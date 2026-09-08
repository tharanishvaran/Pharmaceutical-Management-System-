import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

// Helper to determine performance rating based on thresholds
export const getPerformanceCategory = (achievementPercent) => {
  const thresholds = db.prepare(`SELECT * FROM performance_thresholds ORDER BY min_percentage DESC`).all();
  for (const t of thresholds) {
    if (t.max_percentage !== null) {
      if (achievementPercent >= t.min_percentage && achievementPercent <= t.max_percentage) {
        return { category: t.category_name, color: t.badge_color };
      }
    } else {
      if (achievementPercent >= t.min_percentage) {
        return { category: t.category_name, color: t.badge_color };
      }
    }
  }
  return { category: 'Below Target', color: '#ef4444' };
};

export const getTargets = (req, res) => {
  const { rep_id, period, status } = req.query;

  let query = `
    SELECT 
      t.*,
      r.name as rep_name,
      r.email as rep_email,
      r.territory as rep_territory,
      r.user_id as rep_user_id,
      m.name as manager_name,
      COALESCE((
        SELECT SUM(promoted_value) 
        FROM sales_activities a 
        WHERE a.rep_id = t.rep_id 
          AND a.visit_date >= t.start_date 
          AND a.visit_date <= t.end_date
          AND a.status = 'completed'
      ), 0) as actual_sales
    FROM sales_targets t
    JOIN medical_representatives r ON t.rep_id = r.id
    LEFT JOIN managers m ON r.manager_id = m.id
    WHERE 1=1
  `;
  const params = [];

  // Medical Representatives can ONLY see their own targets!
  if (req.user.role === 'MEDICAL_REPRESENTATIVE') {
    const repProfile = db.prepare(`SELECT id FROM medical_representatives WHERE user_id = ?`).get(req.user.id);
    if (!repProfile) {
      return res.status(404).json({ success: false, error: '404 Not Found', message: 'Representative profile not found.' });
    }
    query += ` AND t.rep_id = ?`;
    params.push(repProfile.id);
  } else if (rep_id) {
    query += ` AND t.rep_id = ?`;
    params.push(rep_id);
  }

  if (period) {
    query += ` AND t.period_name = ?`;
    params.push(period);
  }

  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY t.start_date DESC`;
  const targets = db.prepare(query).all(...params);

  // Compute metrics for each target
  const enrichedTargets = targets.map(t => {
    const actual = Number(t.actual_sales);
    const target = Number(t.target_amount);
    const achievementPercent = target > 0 ? Number(((actual / target) * 100).toFixed(2)) : 0;
    const remaining = Math.max(0, target - actual);
    const rating = getPerformanceCategory(achievementPercent);

    return {
      ...t,
      actual_sales: actual,
      achievement_percentage: achievementPercent,
      remaining_amount: remaining,
      performance_status: rating.category,
      badge_color: rating.color
    };
  });

  res.json({
    success: true,
    count: enrichedTargets.length,
    targets: enrichedTargets
  });
};

export const getTargetById = (req, res) => {
  const { id } = req.params;

  const target = db.prepare(`
    SELECT 
      t.*,
      r.name as rep_name,
      r.email as rep_email,
      r.territory as rep_territory,
      r.user_id as rep_user_id
    FROM sales_targets t
    JOIN medical_representatives r ON t.rep_id = r.id
    WHERE t.id = ?
  `).get(id);

  if (!target) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Target not found' });
  }

  // Check RBAC for Medical Rep
  if (req.user.role === 'MEDICAL_REPRESENTATIVE' && target.rep_user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '403 Forbidden',
      message: 'You do not have permission to view another representative’s target.'
    });
  }

  // Calculate actual
  const actualRow = db.prepare(`
    SELECT COALESCE(SUM(promoted_value), 0) as actual_sales
    FROM sales_activities
    WHERE rep_id = ? AND visit_date >= ? AND visit_date <= ? AND status = 'completed'
  `).get(target.rep_id, target.start_date, target.end_date);

  const actual = Number(actualRow.actual_sales);
  const targetAmount = Number(target.target_amount);
  const achievementPercent = targetAmount > 0 ? Number(((actual / targetAmount) * 100).toFixed(2)) : 0;
  const remaining = Math.max(0, targetAmount - actual);
  const rating = getPerformanceCategory(achievementPercent);

  res.json({
    success: true,
    target: {
      ...target,
      actual_sales: actual,
      achievement_percentage: achievementPercent,
      remaining_amount: remaining,
      performance_status: rating.category,
      badge_color: rating.color
    }
  });
};

export const createTarget = (req, res) => {
  const { rep_id, target_amount, period_name, start_date, end_date, territory } = req.body;

  if (!rep_id || !target_amount || !period_name || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Representative, target amount, period name, start date, and end date are required.'
    });
  }

  if (Number(target_amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Target amount must be a positive number.'
    });
  }

  const rep = db.prepare(`SELECT * FROM medical_representatives WHERE id = ?`).get(rep_id);
  if (!rep) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Medical Representative not found.' });
  }

  const result = db.prepare(`
    INSERT INTO sales_targets (rep_id, target_amount, period_name, start_date, end_date, territory, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(rep_id, Number(target_amount), period_name, start_date, end_date, territory || rep.territory, req.user.id);

  const newTargetId = result.lastInsertRowid;

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'ASSIGN_SALES_TARGET',
    module: 'TARGET_MANAGEMENT',
    recordId: String(newTargetId),
    ipAddress: req.ip,
    newValue: { rep_id, rep_name: rep.name, target_amount, period_name }
  });

  res.status(201).json({
    success: true,
    message: 'Sales target assigned successfully',
    targetId: newTargetId
  });
};

export const updateTarget = (req, res) => {
  const { id } = req.params;
  const { target_amount, period_name, start_date, end_date, territory, status } = req.body;

  const current = db.prepare(`SELECT * FROM sales_targets WHERE id = ?`).get(id);
  if (!current) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Target not found' });
  }

  db.prepare(`
    UPDATE sales_targets SET
      target_amount = COALESCE(?, target_amount),
      period_name = COALESCE(?, period_name),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      territory = COALESCE(?, territory),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(target_amount, period_name, start_date, end_date, territory, status, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_SALES_TARGET',
    module: 'TARGET_MANAGEMENT',
    recordId: String(id),
    ipAddress: req.ip,
    previousValue: { target_amount: current.target_amount, status: current.status },
    newValue: { target_amount, status }
  });

  res.json({ success: true, message: 'Sales target updated successfully' });
};

export const getPerformanceSummary = (req, res) => {
  const { period = 'September 2026' } = req.query;

  const targets = db.prepare(`
    SELECT 
      t.id, t.target_amount, t.period_name, t.territory,
      r.id as rep_id, r.name as rep_name,
      COALESCE(SUM(a.promoted_value), 0) as actual_sales
    FROM sales_targets t
    JOIN medical_representatives r ON t.rep_id = r.id
    LEFT JOIN sales_activities a ON a.rep_id = t.rep_id 
      AND a.visit_date >= t.start_date 
      AND a.visit_date <= t.end_date 
      AND a.status = 'completed'
    WHERE t.period_name = ?
    GROUP BY t.id
    ORDER BY actual_sales DESC
  `).all(period);

  let totalTarget = 0;
  let totalActual = 0;

  const ranked = targets.map(t => {
    const act = Number(t.actual_sales);
    const tgt = Number(t.target_amount);
    totalTarget += tgt;
    totalActual += act;
    const ach = tgt > 0 ? Number(((act / tgt) * 100).toFixed(2)) : 0;
    const rating = getPerformanceCategory(ach);
    return {
      ...t,
      actual_sales: act,
      achievement_percentage: ach,
      remaining_amount: Math.max(0, tgt - act),
      performance_status: rating.category,
      badge_color: rating.color
    };
  });

  const overallAchievement = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    summary: {
      period,
      totalReps: targets.length,
      totalTarget,
      totalActual,
      overallAchievement,
      topPerformers: ranked.filter(r => r.achievement_percentage >= 100),
      nearTarget: ranked.filter(r => r.achievement_percentage >= 90 && r.achievement_percentage < 100),
      underperformers: ranked.filter(r => r.achievement_percentage < 75),
      allReps: ranked
    }
  });
};
