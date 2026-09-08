import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Email and password are required.'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '401 Unauthorized',
      message: 'Invalid credentials. Please verify your email and password.'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: '403 Forbidden',
      message: 'This account has been deactivated. Please contact your organization administrator.'
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: '401 Unauthorized',
      message: 'Invalid credentials. Please verify your email and password.'
    });
  }

  // Fetch role permissions
  const permissions = db.prepare(`
    SELECT p.name 
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = ?
  `).all(user.role).map(r => r.name);

  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Determine specific role profile ID (e.g. rep_id, doctor_id, vendor_id, etc.)
  let profileData = null;
  if (user.role === 'MEDICAL_REPRESENTATIVE') {
    profileData = db.prepare(`SELECT * FROM medical_representatives WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'DOCTOR') {
    profileData = db.prepare(`SELECT * FROM doctors WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'VENDOR') {
    profileData = db.prepare(`SELECT * FROM vendors WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'CUSTOMER') {
    profileData = db.prepare(`SELECT * FROM customers WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'PHARMACIST') {
    profileData = db.prepare(`SELECT * FROM pharmacists WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'CASHIER') {
    profileData = db.prepare(`SELECT * FROM cashiers WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'MANAGER') {
    profileData = db.prepare(`SELECT * FROM managers WHERE user_id = ?`).get(user.id);
  }

  logAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    module: 'AUTH',
    recordId: String(user.id),
    ipAddress: req.ip || req.connection.remoteAddress,
    newValue: `User logged in successfully with role ${user.role}`
  });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      permissions,
      profile: profileData
    }
  });
};

export const getMe = (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, role, phone, status, created_at 
    FROM users 
    WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '404 Not Found',
      message: 'User not found'
    });
  }

  const permissions = db.prepare(`
    SELECT p.name 
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = ?
  `).all(user.role).map(r => r.name);

  let profileData = null;
  if (user.role === 'MEDICAL_REPRESENTATIVE') {
    profileData = db.prepare(`SELECT * FROM medical_representatives WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'DOCTOR') {
    profileData = db.prepare(`SELECT * FROM doctors WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'VENDOR') {
    profileData = db.prepare(`SELECT * FROM vendors WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'CUSTOMER') {
    profileData = db.prepare(`SELECT * FROM customers WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'PHARMACIST') {
    profileData = db.prepare(`SELECT * FROM pharmacists WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'CASHIER') {
    profileData = db.prepare(`SELECT * FROM cashiers WHERE user_id = ?`).get(user.id);
  } else if (user.role === 'MANAGER') {
    profileData = db.prepare(`SELECT * FROM managers WHERE user_id = ?`).get(user.id);
  }

  return res.json({
    success: true,
    user: {
      ...user,
      permissions,
      profile: profileData
    }
  });
};

export const logout = (req, res) => {
  if (req.user) {
    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      module: 'AUTH',
      recordId: String(req.user.id),
      ipAddress: req.ip || req.connection.remoteAddress,
      newValue: 'User logged out'
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
};
