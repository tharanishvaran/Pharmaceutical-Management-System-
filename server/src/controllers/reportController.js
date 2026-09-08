import db from '../config/db.js';
import { getPerformanceCategory } from './targetController.js';

export const getOrganizationOverview = (req, res) => {
  // Aggregate KPIs
  const totalUsers = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
  const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status = 'active'`).get().count;
  const totalVendors = db.prepare(`SELECT COUNT(*) as count FROM vendors WHERE status = 'active'`).get().count;
  const totalDoctors = db.prepare(`SELECT COUNT(*) as count FROM doctors WHERE status = 'active'`).get().count;
  const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers WHERE status = 'active'`).get().count;
  const totalReps = db.prepare(`SELECT COUNT(*) as count FROM medical_representatives WHERE status = 'active'`).get().count;
  const totalPharmacists = db.prepare(`SELECT COUNT(*) as count FROM pharmacists WHERE status = 'active'`).get().count;
  const totalCashiers = db.prepare(`SELECT COUNT(*) as count FROM cashiers WHERE status = 'active'`).get().count;
  const totalManagers = db.prepare(`SELECT COUNT(*) as count FROM managers WHERE status = 'active'`).get().count;

  // Total POS Sales
  const salesSummary = db.prepare(`
    SELECT 
      COALESCE(COUNT(*), 0) as total_invoices,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(SUM(subtotal), 0) as total_subtotal,
      COALESCE(SUM(tax_amount), 0) as total_tax
    FROM sales
  `).get();

  // Role distribution
  const usersByRole = db.prepare(`
    SELECT role, COUNT(*) as count 
    FROM users 
    GROUP BY role 
    ORDER BY count DESC
  `).all();

  // Target Achievement overview for active quotas
  const targets = db.prepare(`
    SELECT 
      COALESCE(SUM(t.target_amount), 0) as total_target,
      COALESCE((
        SELECT SUM(promoted_value) 
        FROM sales_activities a 
        WHERE a.visit_date >= t.start_date AND a.visit_date <= t.end_date AND a.status = 'completed'
      ), 0) as total_promoted
    FROM sales_targets t
    WHERE t.status = 'active'
  `).get();

  const totalTargetAmount = Number(targets.total_target);
  const totalPromotedAmount = Number(targets.total_promoted);
  const orgTargetAchievement = totalTargetAmount > 0 
    ? Number(((totalPromotedAmount / totalTargetAmount) * 100).toFixed(2)) 
    : 0;

  // Inventory alert counts
  const lowStockCount = db.prepare(`
    SELECT COUNT(p.id) as count
    FROM products p
    LEFT JOIN product_batches b ON p.id = b.product_id
    WHERE p.status = 'active'
    GROUP BY p.id
    HAVING COALESCE(SUM(b.available_quantity), 0) <= p.reorder_level
  `).all().length;

  const expiringCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM product_batches
    WHERE available_quantity > 0 AND expiry_date <= date('now', '+90 days')
  `).get().count;

  // Recent 6 activities
  const recentActivities = db.prepare(`
    SELECT a.*, r.name as rep_name, d.name as doctor_name, p.name as product_name
    FROM sales_activities a
    JOIN medical_representatives r ON a.rep_id = r.id
    JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN products p ON a.product_id = p.id
    ORDER BY a.created_at DESC
    LIMIT 6
  `).all();

  // Recent 5 sales
  const recentSales = db.prepare(`
    SELECT s.*, u.name as cashier_name
    FROM sales s
    LEFT JOIN users u ON s.cashier_id = u.id
    ORDER BY s.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalPharmacists,
      totalCashiers,
      totalManagers,
      totalVendors,
      totalDoctors,
      totalCustomers,
      totalReps,
      totalProducts,
      totalInvoices: salesSummary.total_invoices,
      totalSalesRevenue: Number(salesSummary.total_revenue.toFixed(2)),
      totalTargetAmount,
      totalPromotedAmount,
      orgTargetAchievement,
      lowStockCount,
      expiringCount
    },
    usersByRole,
    recentActivities,
    recentSales
  });
};

export const getUserReport = (req, res) => {
  const usersByRole = db.prepare(`
    SELECT role, status, COUNT(*) as count 
    FROM users 
    GROUP BY role, status 
    ORDER BY role ASC, status ASC
  `).all();

  const userList = db.prepare(`
    SELECT id, name, email, role, phone, status, created_at 
    FROM users 
    ORDER BY role ASC, name ASC
  `).all();

  res.json({ success: true, usersByRole, userList });
};

export const getProductReport = (req, res) => {
  const products = db.prepare(`
    SELECT 
      p.id, p.name, p.generic_name, c.name as category_name, p.dosage_form,
      p.manufacturer, p.unit_price, p.reorder_level, v.company_name as vendor_name,
      p.status,
      COALESCE(SUM(b.available_quantity), 0) as stock_quantity,
      MIN(b.expiry_date) as nearest_expiry,
      CASE 
        WHEN COALESCE(SUM(b.available_quantity), 0) <= p.reorder_level THEN 'LOW_STOCK'
        ELSE 'OPTIMAL'
      END as stock_status
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN product_batches b ON p.id = b.product_id
    GROUP BY p.id
    ORDER BY p.name ASC
  `).all();

  res.json({ success: true, products });
};

export const getSalesReport = (req, res) => {
  const { period = 'monthly' } = req.query;

  // Product-wise sales
  const productWise = db.prepare(`
    SELECT 
      p.id, p.name as product_name, p.dosage_form,
      c.name as category_name,
      SUM(si.quantity) as units_sold,
      SUM(si.total_price) as revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN product_categories c ON p.category_id = c.id
    GROUP BY p.id
    ORDER BY revenue DESC
  `).all();

  // Cashier-wise sales
  const cashierWise = db.prepare(`
    SELECT 
      u.id, u.name as cashier_name,
      COUNT(s.id) as invoice_count,
      SUM(s.total_amount) as total_collected
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    GROUP BY u.id
    ORDER BY total_collected DESC
  `).all();

  // Daily/Timeline aggregate
  const timeline = db.prepare(`
    SELECT 
      date(created_at) as sale_date,
      COUNT(*) as transactions,
      SUM(total_amount) as daily_revenue
    FROM sales
    GROUP BY date(created_at)
    ORDER BY sale_date DESC
    LIMIT 30
  `).all();

  res.json({ success: true, productWise, cashierWise, timeline });
};

export const getRepresentativeReport = (req, res) => {
  const { period = 'September 2026' } = req.query;

  const targets = db.prepare(`
    SELECT 
      t.id, t.target_amount, t.period_name, t.territory, t.start_date, t.end_date,
      r.id as rep_id, r.name as rep_name, r.email as rep_email,
      m.name as manager_name,
      COALESCE(SUM(a.promoted_value), 0) as actual_sales,
      COUNT(a.id) as visit_count
    FROM sales_targets t
    JOIN medical_representatives r ON t.rep_id = r.id
    LEFT JOIN managers m ON r.manager_id = m.id
    LEFT JOIN sales_activities a ON a.rep_id = t.rep_id 
      AND a.visit_date >= t.start_date 
      AND a.visit_date <= t.end_date 
      AND a.status = 'completed'
    WHERE t.period_name = ?
    GROUP BY t.id
    ORDER BY actual_sales DESC
  `).all(period);

  const report = targets.map(t => {
    const act = Number(t.actual_sales);
    const tgt = Number(t.target_amount);
    const ach = tgt > 0 ? Number(((act / tgt) * 100).toFixed(2)) : 0;
    const rating = getPerformanceCategory(ach);
    return {
      ...t,
      actual_sales: act,
      achievement_percentage: ach,
      remaining_target: Math.max(0, tgt - act),
      performance_status: rating.category,
      badge_color: rating.color
    };
  });

  res.json({ success: true, report });
};

export const getVendorReport = (req, res) => {
  const vendors = db.prepare(`
    SELECT 
      v.id, v.company_name, v.contact_person, v.email, v.phone, v.tax_id, v.status,
      COUNT(DISTINCT p.id) as products_supplied,
      COALESCE(SUM(b.available_quantity), 0) as current_stock_in_inventory
    FROM vendors v
    LEFT JOIN products p ON v.id = p.vendor_id
    LEFT JOIN product_batches b ON p.id = b.product_id
    GROUP BY v.id
    ORDER BY v.company_name ASC
  `).all();

  res.json({ success: true, vendors });
};
