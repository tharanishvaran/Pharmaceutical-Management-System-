import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const getDoctors = (req, res) => {
  if (req.user.role === 'DOCTOR') {
    const doc = db.prepare(`SELECT * FROM doctors WHERE user_id = ?`).get(req.user.id);
    return res.json({ success: true, count: doc ? 1 : 0, doctors: doc ? [doc] : [] });
  }

  const { search, specialization } = req.query;
  let query = `SELECT * FROM doctors WHERE 1=1`;
  const params = [];

  if (specialization) {
    query += ` AND specialization LIKE ?`;
    params.push(`%${specialization}%`);
  }

  if (search) {
    query += ` AND (name LIKE ? OR hospital_clinic LIKE ? OR email LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY name ASC`;
  const doctors = db.prepare(query).all(...params);

  res.json({ success: true, count: doctors.length, doctors });
};

export const getDoctorById = (req, res) => {
  const { id } = req.params;

  const doctor = db.prepare(`SELECT * FROM doctors WHERE id = ?`).get(id);
  if (!doctor) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Doctor not found.' });
  }

  if (req.user.role === 'DOCTOR' && doctor.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: '403 Forbidden', message: 'Access denied.' });
  }

  // Fetch past rep visits
  const visits = db.prepare(`
    SELECT a.*, r.name as rep_name, p.name as product_name
    FROM sales_activities a
    JOIN medical_representatives r ON a.rep_id = r.id
    LEFT JOIN products p ON a.product_id = p.id
    WHERE a.doctor_id = ?
    ORDER BY a.visit_date DESC
  `).all(id);

  res.json({ success: true, doctor: { ...doctor, visits } });
};

export const createDoctor = (req, res) => {
  const { name, specialization, hospital_clinic, email, phone, address } = req.body;

  if (!name || !specialization || !hospital_clinic || !email || !phone || !address) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Name, specialization, hospital/clinic, email, phone, and address are required.'
    });
  }

  const result = db.prepare(`
    INSERT INTO doctors (name, specialization, hospital_clinic, email, phone, address, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(name.trim(), specialization.trim(), hospital_clinic.trim(), email.trim().toLowerCase(), phone.trim(), address.trim());

  const doctorId = result.lastInsertRowid;

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_DOCTOR',
    module: 'DOCTOR_MANAGEMENT',
    recordId: String(doctorId),
    ipAddress: req.ip,
    newValue: { name, specialization, hospital_clinic }
  });

  res.status(201).json({ success: true, message: 'Doctor registered successfully', doctorId });
};

export const updateDoctor = (req, res) => {
  const { id } = req.params;
  const current = db.prepare(`SELECT * FROM doctors WHERE id = ?`).get(id);

  if (!current) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Doctor not found.' });
  }

  if (req.user.role === 'DOCTOR' && current.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: '403 Forbidden', message: 'Access denied.' });
  }

  const {
    name = current.name,
    specialization = current.specialization,
    hospital_clinic = current.hospital_clinic,
    phone = current.phone,
    address = current.address,
    status = current.status
  } = req.body;

  db.prepare(`
    UPDATE doctors SET
      name = ?, specialization = ?, hospital_clinic = ?, phone = ?, address = ?, status = ?
    WHERE id = ?
  `).run(name, specialization, hospital_clinic, phone, address, status, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_DOCTOR',
    module: 'DOCTOR_MANAGEMENT',
    recordId: String(id),
    ipAddress: req.ip,
    newValue: { name, specialization, hospital_clinic }
  });

  res.json({ success: true, message: 'Doctor profile updated successfully' });
};
