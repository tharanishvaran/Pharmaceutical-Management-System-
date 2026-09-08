import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const getActivities = (req, res) => {
  const { rep_id, doctor_id, start_date, end_date, status, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      a.*,
      r.name as rep_name,
      r.email as rep_email,
      r.territory as rep_territory,
      r.user_id as rep_user_id,
      d.name as doctor_name,
      d.specialization as doctor_specialization,
      d.hospital_clinic,
      p.name as product_name,
      p.generic_name
    FROM sales_activities a
    JOIN medical_representatives r ON a.rep_id = r.id
    JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN products p ON a.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // Medical Representative can only view their own activities
  if (req.user.role === 'MEDICAL_REPRESENTATIVE') {
    const rep = db.prepare(`SELECT id FROM medical_representatives WHERE user_id = ?`).get(req.user.id);
    if (rep) {
      query += ` AND a.rep_id = ?`;
      params.push(rep.id);
    }
  } else if (rep_id) {
    query += ` AND a.rep_id = ?`;
    params.push(rep_id);
  }

  // Doctor can view visits directed to them
  if (req.user.role === 'DOCTOR') {
    const doc = db.prepare(`SELECT id FROM doctors WHERE user_id = ?`).get(req.user.id);
    if (doc) {
      query += ` AND a.doctor_id = ?`;
      params.push(doc.id);
    }
  } else if (doctor_id) {
    query += ` AND a.doctor_id = ?`;
    params.push(doctor_id);
  }

  if (start_date) {
    query += ` AND a.visit_date >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND a.visit_date <= ?`;
    params.push(end_date);
  }

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY a.visit_date DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const activities = db.prepare(query).all(...params);

  res.json({
    success: true,
    count: activities.length,
    activities
  });
};

export const createActivity = (req, res) => {
  const {
    rep_id: reqRepId,
    doctor_id,
    visit_date,
    location,
    product_id = null,
    promoted_value = 0,
    notes = '',
    follow_up_date = null,
    status = 'completed'
  } = req.body;

  if (!doctor_id || !visit_date || !location) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Doctor, visit date, and location are required.'
    });
  }

  let repId = reqRepId;
  // If logged in as representative, enforce own rep ID
  if (req.user.role === 'MEDICAL_REPRESENTATIVE') {
    const rep = db.prepare(`SELECT id FROM medical_representatives WHERE user_id = ?`).get(req.user.id);
    if (!rep) {
      return res.status(404).json({ success: false, error: '404 Not Found', message: 'Representative profile not found.' });
    }
    repId = rep.id;
  }

  if (!repId) {
    return res.status(400).json({ success: false, error: '400 Bad Request', message: 'Representative ID is required.' });
  }

  const result = db.prepare(`
    INSERT INTO sales_activities (
      rep_id, doctor_id, visit_date, location, product_id, promoted_value, notes, follow_up_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(repId, doctor_id, visit_date, location, product_id || null, Number(promoted_value || 0), notes, follow_up_date, status);

  const newActivityId = result.lastInsertRowid;

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'LOG_SALES_ACTIVITY',
    module: 'FIELD_SALES',
    recordId: String(newActivityId),
    ipAddress: req.ip,
    newValue: { doctor_id, promoted_value, visit_date }
  });

  res.status(201).json({
    success: true,
    message: 'Field visit activity logged successfully',
    activityId: newActivityId
  });
};
