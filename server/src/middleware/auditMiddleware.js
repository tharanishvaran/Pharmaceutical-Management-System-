import db from '../config/db.js';

export const logAudit = ({
  userId = null,
  userName = 'System',
  userRole = 'SYSTEM',
  action,
  module,
  recordId = null,
  ipAddress = null,
  previousValue = null,
  newValue = null
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_name, user_role, action, module, record_id, ip_address, previous_value, new_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      userName,
      userRole,
      action,
      module,
      recordId ? String(recordId) : null,
      ipAddress,
      previousValue ? (typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue)) : null,
      newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null
    );
  } catch (err) {
    console.error('Audit log write error:', err.message);
  }
};
