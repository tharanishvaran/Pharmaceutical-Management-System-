import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const getUsers = (req, res) => {
  const { role, status, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT id, name, email, role, phone, status, created_at, updated_at
    FROM users
    WHERE 1=1
  `;
  const params = [];

  if (role && role !== 'ALL') {
    query += ` AND role = ?`;
    params.push(role);
  }

  if (status && status !== 'ALL') {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const users = db.prepare(query).all(...params);

  // Total count for pagination
  let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
  const countParams = [];
  if (role && role !== 'ALL') {
    countQuery += ` AND role = ?`;
    countParams.push(role);
  }
  if (status && status !== 'ALL') {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }
  if (search) {
    countQuery += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern);
  }
  const total = db.prepare(countQuery).get(...countParams).total;

  res.json({
    success: true,
    total,
    users
  });
};

export const getUserById = (req, res) => {
  const { id } = req.params;
  const user = db.prepare(`SELECT id, name, email, role, phone, status, created_at, updated_at FROM users WHERE id = ?`).get(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '404 Not Found',
      message: 'User record not found.'
    });
  }

  // Fetch role-specific details
  let roleDetails = null;
  if (user.role === 'MEDICAL_REPRESENTATIVE') {
    roleDetails = db.prepare(`SELECT * FROM medical_representatives WHERE user_id = ?`).get(id);
  } else if (user.role === 'DOCTOR') {
    roleDetails = db.prepare(`SELECT * FROM doctors WHERE user_id = ?`).get(id);
  } else if (user.role === 'VENDOR') {
    roleDetails = db.prepare(`SELECT * FROM vendors WHERE user_id = ?`).get(id);
  } else if (user.role === 'CUSTOMER') {
    roleDetails = db.prepare(`SELECT * FROM customers WHERE user_id = ?`).get(id);
  } else if (user.role === 'PHARMACIST') {
    roleDetails = db.prepare(`SELECT * FROM pharmacists WHERE user_id = ?`).get(id);
  } else if (user.role === 'CASHIER') {
    roleDetails = db.prepare(`SELECT * FROM cashiers WHERE user_id = ?`).get(id);
  } else if (user.role === 'MANAGER') {
    roleDetails = db.prepare(`SELECT * FROM managers WHERE user_id = ?`).get(id);
  }

  res.json({
    success: true,
    user: {
      ...user,
      roleDetails
    }
  });
};

export const createUser = (req, res) => {
  const { name, email, password, role, phone, roleSpecificData = {} } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Name, email, password, and role are required.'
    });
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'A user with this email address already exists.'
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  const result = insertUser.run(name.trim(), email.trim().toLowerCase(), password_hash, role, phone || null);
  const newUserId = result.lastInsertRowid;

  // Insert role profile
  try {
    if (role === 'MEDICAL_REPRESENTATIVE') {
      db.prepare(`
        INSERT INTO medical_representatives (user_id, name, email, phone, territory, manager_id, joining_date, status)
        VALUES (?, ?, ?, ?, ?, ?, date('now'), 'active')
      `).run(newUserId, name, email, phone || '', roleSpecificData.territory || 'National Territory', roleSpecificData.manager_id || null);
    } else if (role === 'PHARMACIST') {
      db.prepare(`
        INSERT INTO pharmacists (user_id, license_number, qualification, status)
        VALUES (?, ?, ?, 'active')
      `).run(newUserId, roleSpecificData.license_number || `PH-${Date.now().toString().slice(-6)}`, roleSpecificData.qualification || 'B.Pharm');
    } else if (role === 'CASHIER') {
      db.prepare(`
        INSERT INTO cashiers (user_id, counter_number, shift, status)
        VALUES (?, ?, ?, 'active')
      `).run(newUserId, roleSpecificData.counter_number || 'Counter-General', roleSpecificData.shift || 'General');
    } else if (role === 'MANAGER') {
      db.prepare(`
        INSERT INTO managers (user_id, name, department, region, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(newUserId, name, roleSpecificData.department || 'Operations', roleSpecificData.region || 'National');
    } else if (role === 'VENDOR') {
      db.prepare(`
        INSERT INTO vendors (user_id, company_name, contact_person, email, phone, address, tax_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(newUserId, roleSpecificData.company_name || name, name, email, phone || '', roleSpecificData.address || 'Vendor Address', roleSpecificData.tax_id || null);
    } else if (role === 'DOCTOR') {
      db.prepare(`
        INSERT INTO doctors (user_id, name, specialization, hospital_clinic, email, phone, address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(newUserId, name, roleSpecificData.specialization || 'General Physician', roleSpecificData.hospital_clinic || 'City Clinic', email, phone || '', roleSpecificData.address || 'Clinic Address');
    } else if (role === 'CUSTOMER') {
      db.prepare(`
        INSERT INTO customers (user_id, name, email, phone, address, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(newUserId, name, email, phone || '', roleSpecificData.address || 'City Address');
    }
  } catch (err) {
    console.error('Role profile insertion error:', err);
  }

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_USER',
    module: 'USER_MANAGEMENT',
    recordId: String(newUserId),
    ipAddress: req.ip || req.connection.remoteAddress,
    newValue: { id: newUserId, name, email, role, phone }
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: { id: newUserId, name, email, role, phone, status: 'active' }
  });
};

export const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status } = req.body;

  const current = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  if (!current) {
    return res.status(404).json({
      success: false,
      error: '404 Not Found',
      message: 'User not found'
    });
  }

  const updatedName = name !== undefined ? name : current.name;
  const updatedPhone = phone !== undefined ? phone : current.phone;
  const updatedRole = role !== undefined ? role : current.role;
  const updatedStatus = status !== undefined ? status : current.status;

  db.prepare(`
    UPDATE users 
    SET name = ?, phone = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updatedName, updatedPhone, updatedRole, updatedStatus, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_USER',
    module: 'USER_MANAGEMENT',
    recordId: String(id),
    ipAddress: req.ip || req.connection.remoteAddress,
    previousValue: { name: current.name, role: current.role, status: current.status },
    newValue: { name: updatedName, role: updatedRole, status: updatedStatus }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    user: { id, name: updatedName, role: updatedRole, status: updatedStatus }
  });
};

export const toggleUserStatus = (req, res) => {
  const { id } = req.params;
  const current = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);

  if (!current) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'User not found' });
  }

  // Prevent self-deactivation by admin
  if (current.id === req.user.id) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'You cannot deactivate your own account.'
    });
  }

  const newStatus = current.status === 'active' ? 'inactive' : 'active';
  db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: newStatus === 'active' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    module: 'USER_MANAGEMENT',
    recordId: String(id),
    ipAddress: req.ip || req.connection.remoteAddress,
    previousValue: { status: current.status },
    newValue: { status: newStatus }
  });

  res.json({
    success: true,
    message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    status: newStatus
  });
};

export const getRoles = (req, res) => {
  const roles = db.prepare(`SELECT * FROM roles ORDER BY id ASC`).all();
  res.json({ success: true, roles });
};
