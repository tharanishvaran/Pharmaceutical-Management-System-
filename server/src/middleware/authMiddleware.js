import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'pharmaceutical_mgmt_super_secret_key_2026';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '401 Unauthorized',
      message: 'Access denied. Please login to continue.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch latest user status from database to prevent deactivated users
    const user = db.prepare(`
      SELECT id, name, email, role, phone, status 
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '401 Unauthorized',
        message: 'User account no longer exists.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden',
        message: 'Your account has been deactivated. Please contact your organization administrator.'
      });
    }

    // Attach user information and permissions
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: '401 Unauthorized',
      message: 'Session token is invalid or expired. Please login again.'
    });
  }
};
