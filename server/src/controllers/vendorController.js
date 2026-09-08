import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const getVendors = (req, res) => {
  // If Vendor role, only return their own profile
  if (req.user.role === 'VENDOR') {
    const vendor = db.prepare(`SELECT * FROM vendors WHERE user_id = ?`).get(req.user.id);
    return res.json({ success: true, count: vendor ? 1 : 0, vendors: vendor ? [vendor] : [] });
  }

  const { search, status } = req.query;
  let query = `
    SELECT 
      v.*,
      COUNT(p.id) as products_supplied_count
    FROM vendors v
    LEFT JOIN products p ON v.id = p.vendor_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND v.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (v.company_name LIKE ? OR v.contact_person LIKE ? OR v.email LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` GROUP BY v.id ORDER BY v.company_name ASC`;
  const vendors = db.prepare(query).all(...params);

  res.json({ success: true, count: vendors.length, vendors });
};

export const getVendorById = (req, res) => {
  const { id } = req.params;

  const vendor = db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(id);
  if (!vendor) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Vendor not found.' });
  }

  // Vendor role can only see their own profile
  if (req.user.role === 'VENDOR' && vendor.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '403 Forbidden',
      message: 'You do not have permission to view another vendor’s details.'
    });
  }

  // Get products supplied by this vendor
  const products = db.prepare(`
    SELECT p.*, COALESCE(SUM(b.available_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN product_batches b ON p.id = b.product_id
    WHERE p.vendor_id = ?
    GROUP BY p.id
  `).all(id);

  res.json({
    success: true,
    vendor: {
      ...vendor,
      products
    }
  });
};

export const createVendor = (req, res) => {
  const { company_name, contact_person, email, phone, address, tax_id } = req.body;

  if (!company_name || !contact_person || !email || !phone || !address) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Company name, contact person, email, phone, and address are required.'
    });
  }

  const result = db.prepare(`
    INSERT INTO vendors (company_name, contact_person, email, phone, address, tax_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(company_name.trim(), contact_person.trim(), email.trim().toLowerCase(), phone.trim(), address.trim(), tax_id || null);

  const vendorId = result.lastInsertRowid;

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_VENDOR',
    module: 'VENDOR_MANAGEMENT',
    recordId: String(vendorId),
    ipAddress: req.ip,
    newValue: { company_name, contact_person, email }
  });

  res.status(201).json({ success: true, message: 'Vendor registered successfully', vendorId });
};

export const updateVendor = (req, res) => {
  const { id } = req.params;
  const current = db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(id);

  if (!current) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Vendor not found.' });
  }

  // Vendor can update their own contact info
  if (req.user.role === 'VENDOR' && current.user_id !== req.user.id) {
    return res.status(403).json({ success: false, error: '403 Forbidden', message: 'Access denied.' });
  }

  const {
    company_name = current.company_name,
    contact_person = current.contact_person,
    phone = current.phone,
    address = current.address,
    tax_id = current.tax_id,
    status = current.status
  } = req.body;

  db.prepare(`
    UPDATE vendors SET
      company_name = ?, contact_person = ?, phone = ?, address = ?, tax_id = ?, status = ?
    WHERE id = ?
  `).run(company_name, contact_person, phone, address, tax_id, status, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_VENDOR',
    module: 'VENDOR_MANAGEMENT',
    recordId: String(id),
    ipAddress: req.ip,
    newValue: { company_name, contact_person, phone }
  });

  res.json({ success: true, message: 'Vendor details updated successfully' });
};
