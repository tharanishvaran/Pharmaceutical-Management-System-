import db from '../config/db.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '401 Unauthorized',
        message: 'Please login to access this resource.'
      });
    }

    const userRole = req.user.role;

    // ADMIN always has full system authorization unless explicitly restricted
    if (userRole === 'ADMIN' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: '403 Forbidden',
      message: 'You do not have permission to perform this action.'
    });
  };
};

export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '401 Unauthorized',
        message: 'Please login to access this resource.'
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      const userPermissions = db.prepare(`
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON r.id = rp.role_id
        WHERE r.name = ?
      `).all(req.user.role).map(row => row.name);

      const hasAll = requiredPermissions.every(perm => userPermissions.includes(perm));

      if (hasAll) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: '403 Forbidden',
        message: 'You do not have permission to perform this action.'
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: '500 Internal Server Error',
        message: 'Failed to verify user permissions.'
      });
    }
  };
};
