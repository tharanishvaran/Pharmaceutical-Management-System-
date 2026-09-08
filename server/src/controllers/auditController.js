import db from '../config/db.js';

export const getAuditLogs = (req, res) => {
  const { module, action, search, limit = 50, offset = 0 } = req.query;

  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];

  if (module && module !== 'ALL') {
    query += ` AND module = ?`;
    params.push(module);
  }

  if (action && action !== 'ALL') {
    query += ` AND action = ?`;
    params.push(action);
  }

  if (search) {
    query += ` AND (user_name LIKE ? OR action LIKE ? OR module LIKE ? OR record_id LIKE ? OR new_value LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const logs = db.prepare(query).all(...params);

  // Total count
  let countQuery = `SELECT COUNT(*) as total FROM audit_logs WHERE 1=1`;
  const countParams = [];
  if (module && module !== 'ALL') {
    countQuery += ` AND module = ?`;
    countParams.push(module);
  }
  if (action && action !== 'ALL') {
    countQuery += ` AND action = ?`;
    countParams.push(action);
  }
  if (search) {
    countQuery += ` AND (user_name LIKE ? OR action LIKE ? OR module LIKE ? OR record_id LIKE ? OR new_value LIKE ?)`;
    const term = `%${search}%`;
    countParams.push(term, term, term, term, term);
  }
  const total = db.prepare(countQuery).get(...countParams).total;

  res.json({ success: true, total, logs });
};

export const getAuditModules = (req, res) => {
  const modules = db.prepare(`SELECT DISTINCT module FROM audit_logs ORDER BY module ASC`).all().map(r => r.module);
  res.json({ success: true, modules });
};
