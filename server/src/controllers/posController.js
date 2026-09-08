import db from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export const createSaleTransaction = (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_id = null,
    items, // array of { product_id, batch_id, quantity }
    payment_method = 'Cash',
    discount_amount = 0,
    notes = ''
  } = req.body;

  if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: 'Customer name and at least one sale item are required.'
    });
  }

  // Execute sale in an atomic database transaction
  const executeSale = db.transaction(() => {
    let subtotal = 0;
    const validatedItems = [];

    // 1. Verify and lock batch quantities & prices server-side
    for (const item of items) {
      const { product_id, batch_id, quantity } = item;
      const qty = Number(quantity);

      if (!product_id || !batch_id || qty <= 0) {
        throw new Error('Invalid product, batch, or non-positive quantity specified.');
      }

      // Check product and batch in database
      const product = db.prepare(`SELECT name, unit_price FROM products WHERE id = ?`).get(product_id);
      if (!product) {
        throw new Error(`Product ID ${product_id} was not found.`);
      }

      const batch = db.prepare(`SELECT id, batch_number, available_quantity FROM product_batches WHERE id = ? AND product_id = ?`).get(batch_id, product_id);
      if (!batch) {
        throw new Error(`Batch ID ${batch_id} does not match product ${product.name}.`);
      }

      if (batch.available_quantity < qty) {
        throw new Error(`Insufficient stock for ${product.name} (Batch ${batch.batch_number}). Available: ${batch.available_quantity}, Requested: ${qty}`);
      }

      const itemTotal = Number((product.unit_price * qty).toFixed(2));
      subtotal += itemTotal;

      validatedItems.push({
        product_id,
        product_name: product.name,
        batch_id,
        batch_number: batch.batch_number,
        quantity: qty,
        unit_price: product.unit_price,
        total_price: itemTotal
      });
    }

    const discount = Math.max(0, Number(discount_amount || 0));
    const taxRate = 0.05; // 5% GST standard pharma rate
    const taxAmount = Number(((subtotal - discount) * taxRate).toFixed(2));
    const totalAmount = Number(((subtotal - discount) + taxAmount).toFixed(2));

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 2. Insert into sales table
    const saleResult = db.prepare(`
      INSERT INTO sales (
        invoice_number, cashier_id, customer_id, customer_name, customer_phone,
        subtotal, tax_amount, discount_amount, total_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNumber,
      req.user.id,
      customer_id || null,
      customer_name.trim(),
      customer_phone || '',
      subtotal,
      taxAmount,
      discount,
      totalAmount,
      payment_method,
      notes || 'Standard POS counter invoice'
    );

    const saleId = saleResult.lastInsertRowid;

    // 3. Insert sale items & deduct inventory
    const insertItemStmt = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const deductStockStmt = db.prepare(`
      UPDATE product_batches
      SET available_quantity = available_quantity - ?
      WHERE id = ?
    `);

    for (const vItem of validatedItems) {
      insertItemStmt.run(saleId, vItem.product_id, vItem.batch_id, vItem.quantity, vItem.unit_price, vItem.total_price);
      deductStockStmt.run(vItem.quantity, vItem.batch_id);
    }

    return {
      saleId,
      invoiceNumber,
      customer_name,
      customer_phone,
      subtotal,
      discount,
      taxAmount,
      totalAmount,
      payment_method,
      items: validatedItems,
      created_at: new Date().toISOString()
    };
  });

  try {
    const receipt = executeSale();

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PROCESS_POS_SALE',
      module: 'POS_BILLING',
      recordId: receipt.invoiceNumber,
      ipAddress: req.ip,
      newValue: { invoice: receipt.invoiceNumber, total: receipt.totalAmount, items: receipt.items.length }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction processed successfully',
      receipt
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: '400 Bad Request',
      message: err.message || 'Transaction could not be processed.'
    });
  }
};

export const getTransactions = (req, res) => {
  const { cashier_id, date, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
      s.id,
      s.invoice_number,
      s.cashier_id,
      u.name as cashier_name,
      s.customer_name,
      s.customer_phone,
      s.subtotal,
      s.tax_amount,
      s.discount_amount,
      s.total_amount,
      s.payment_method,
      s.created_at,
      COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN users u ON s.cashier_id = u.id
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE 1=1
  `;
  const params = [];

  // Cashiers can only view their own transactions unless ADMIN or MANAGER
  if (req.user.role === 'CASHIER') {
    query += ` AND s.cashier_id = ?`;
    params.push(req.user.id);
  } else if (cashier_id) {
    query += ` AND s.cashier_id = ?`;
    params.push(cashier_id);
  }

  if (date) {
    query += ` AND date(s.created_at) = ?`;
    params.push(date);
  }

  if (search) {
    query += ` AND (s.invoice_number LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)`;
    const sTerm = `%${search}%`;
    params.push(sTerm, sTerm, sTerm);
  }

  query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const sales = db.prepare(query).all(...params);

  res.json({
    success: true,
    sales
  });
};

export const getTransactionByInvoice = (req, res) => {
  const { invoice } = req.params;

  const sale = db.prepare(`
    SELECT s.*, u.name as cashier_name
    FROM sales s
    LEFT JOIN users u ON s.cashier_id = u.id
    WHERE s.invoice_number = ?
  `).get(invoice);

  if (!sale) {
    return res.status(404).json({ success: false, error: '404 Not Found', message: 'Invoice not found.' });
  }

  // If customer is requesting, verify customer access
  if (req.user.role === 'CUSTOMER' && sale.customer_id && sale.customer_id !== req.user.profile?.id) {
    return res.status(403).json({ success: false, error: '403 Forbidden', message: 'Unauthorized invoice view.' });
  }

  const items = db.prepare(`
    SELECT si.*, p.name as product_name, p.generic_name, pb.batch_number
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN product_batches pb ON si.batch_id = pb.id
    WHERE si.sale_id = ?
  `).all(sale.id);

  res.json({
    success: true,
    sale: {
      ...sale,
      items
    }
  });
};
