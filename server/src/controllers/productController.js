import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const getProducts = (req, res) => {
  const { category, vendor, status, search, alertType, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      p.id,
      p.name,
      p.generic_name,
      p.category_id,
      c.name as category_name,
      p.dosage_form,
      p.manufacturer,
      p.description,
      p.unit_price,
      p.reorder_level,
      p.vendor_id,
      v.company_name as vendor_name,
      p.status,
      p.created_at,
      COALESCE(SUM(b.available_quantity), 0) as total_stock,
      MIN(b.expiry_date) as nearest_expiry,
      COUNT(b.id) as batch_count
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN product_batches b ON p.id = b.product_id
    WHERE 1=1
  `;
  const params = [];

  if (category && category !== 'ALL') {
    query += ` AND p.category_id = ?`;
    params.push(category);
  }

  if (vendor && vendor !== 'ALL') {
    query += ` AND p.vendor_id = ?`;
    params.push(vendor);
  }

  if (status && status !== 'ALL') {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (p.name LIKE ? OR p.generic_name LIKE ? OR p.manufacturer LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ` GROUP BY p.id`;

  // Filter by alertType in HAVING clause
  if (alertType === 'low_stock') {
    query += ` HAVING total_stock <= p.reorder_level`;
  } else if (alertType === 'expiring') {
    query += ` HAVING nearest_expiry <= date('now', '+90 days')`;
  }

  query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const products = db.prepare(query).all(...params);

  res.json({
    success: true,
    count: products.length,
    products
  });
};

export const getProductById = (req, res) => {
  const { id } = req.params;

  const product = db.prepare(`
    SELECT 
      p.*,
      c.name as category_name,
      v.company_name as vendor_name,
      COALESCE(SUM(b.available_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN product_batches b ON p.id = b.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id);

  if (!product) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Product not found.' });
  }

  const batches = db.prepare(`
    SELECT * FROM product_batches WHERE product_id = ? ORDER BY expiry_date ASC
  `).all(id);

  res.json({
    success: true,
    product: {
      ...product,
      batches
    }
  });
};

export const createProduct = (req, res) => {
  const {
    name,
    generic_name,
    category_id,
    dosage_form = 'Tablet',
    manufacturer,
    description,
    unit_price,
    reorder_level = 20,
    vendor_id = null,
    initial_batch = null
  } = req.body;

  if (!name || !generic_name || !category_id || !manufacturer || unit_price === undefined) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Product name, generic name, category, manufacturer, and unit price are required.'
    });
  }

  if (Number(unit_price) <= 0) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Unit price must be greater than zero.'
    });
  }

  const insertStmt = db.prepare(`
    INSERT INTO products (
      name, generic_name, category_id, dosage_form, manufacturer, description, unit_price, reorder_level, vendor_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const result = insertStmt.run(
    name.trim(),
    generic_name.trim(),
    category_id,
    dosage_form,
    manufacturer.trim(),
    description || `${name} formulation`,
    Number(unit_price),
    Number(reorder_level),
    vendor_id || null
  );

  const productId = result.lastInsertRowid;

  // Add initial batch if provided
  if (initial_batch && initial_batch.batch_number) {
    db.prepare(`
      INSERT INTO product_batches (product_id, batch_number, manufacture_date, expiry_date, initial_quantity, available_quantity, cost_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      initial_batch.batch_number,
      initial_batch.manufacture_date || new Date().toISOString().split('T')[0],
      initial_batch.expiry_date,
      Number(initial_batch.quantity || 100),
      Number(initial_batch.quantity || 100),
      Number(initial_batch.cost_price || (unit_price * 0.6))
    );
  }

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_PRODUCT',
    module: 'PHARMACEUTICAL_PRODUCT',
    recordId: String(productId),
    ipAddress: req.ip,
    newValue: { id: productId, name, generic_name, unit_price }
  });

  res.status(201).json({
    success: true,
    message: 'Pharmaceutical product registered successfully',
    productId
  });
};

export const updateProduct = (req, res) => {
  const { id } = req.params;
  const current = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);

  if (!current) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Product not found.' });
  }

  const {
    name = current.name,
    generic_name = current.generic_name,
    category_id = current.category_id,
    dosage_form = current.dosage_form,
    manufacturer = current.manufacturer,
    description = current.description,
    unit_price = current.unit_price,
    reorder_level = current.reorder_level,
    vendor_id = current.vendor_id,
    status = current.status
  } = req.body;

  db.prepare(`
    UPDATE products SET
      name = ?, generic_name = ?, category_id = ?, dosage_form = ?, manufacturer = ?,
      description = ?, unit_price = ?, reorder_level = ?, vendor_id = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, generic_name, category_id, dosage_form, manufacturer, description, unit_price, reorder_level, vendor_id, status, id);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_PRODUCT',
    module: 'PHARMACEUTICAL_PRODUCT',
    recordId: String(id),
    ipAddress: req.ip,
    previousValue: { name: current.name, unit_price: current.unit_price },
    newValue: { name, unit_price, status }
  });

  res.json({ success: true, message: 'Product updated successfully' });
};

export const addBatch = (req, res) => {
  const { id } = req.params;
  const { batch_number, manufacture_date, expiry_date, quantity, cost_price } = req.body;

  if (!batch_number || !manufacture_date || !expiry_date || !quantity || !cost_price) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Batch number, manufacture date, expiry date, quantity, and cost price are required.'
    });
  }

  const existingBatch = db.prepare(`SELECT id FROM product_batches WHERE batch_number = ?`).get(batch_number);
  if (existingBatch) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'A batch with this batch number already exists.'
    });
  }

  db.prepare(`
    INSERT INTO product_batches (product_id, batch_number, manufacture_date, expiry_date, initial_quantity, available_quantity, cost_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, batch_number, manufacture_date, expiry_date, Number(quantity), Number(quantity), Number(cost_price));

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'ADD_BATCH',
    module: 'PHARMACEUTICAL_INVENTORY',
    recordId: String(id),
    ipAddress: req.ip,
    newValue: { batch_number, quantity, expiry_date }
  });

  res.status(201).json({ success: true, message: 'Batch added successfully' });
};

export const getCategories = (req, res) => {
  const categories = db.prepare(`SELECT * FROM product_categories ORDER BY name ASC`).all();
  res.json({ success: true, categories });
};

export const getInventoryAlerts = (req, res) => {
  // Low stock items
  const lowStock = db.prepare(`
    SELECT 
      p.id, p.name, p.generic_name, p.reorder_level,
      COALESCE(SUM(b.available_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN product_batches b ON p.id = b.product_id
    WHERE p.status = 'active'
    GROUP BY p.id
    HAVING total_stock <= p.reorder_level
    ORDER BY total_stock ASC
  `).all();

  // Expiring batches (within 90 days)
  const expiring = db.prepare(`
    SELECT 
      b.id as batch_id, b.batch_number, b.expiry_date, b.available_quantity,
      p.id as product_id, p.name as product_name
    FROM product_batches b
    JOIN products p ON b.product_id = p.id
    WHERE b.available_quantity > 0 AND b.expiry_date <= date('now', '+90 days')
    ORDER BY b.expiry_date ASC
  `).all();

  res.json({
    success: true,
    alerts: {
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      lowStock,
      expiring
    }
  });
};
