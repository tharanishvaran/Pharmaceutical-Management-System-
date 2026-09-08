import db from '../config/db.js';

export const getNotifications = (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  const notifs = db.prepare(`
    SELECT * FROM notifications
    WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL' OR (target_role = 'ADMIN' AND ? = 'ADMIN'))
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId, userRole, userRole);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL' OR (target_role = 'ADMIN' AND ? = 'ADMIN'))
      AND is_read = 0
  `).get(userId, userRole, userRole).count;

  res.json({ success: true, unreadCount, notifications: notifs });
};

export const markNotificationRead = (req, res) => {
  const { id } = req.params;
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(id);
  res.json({ success: true, message: 'Notification marked as read' });
};
