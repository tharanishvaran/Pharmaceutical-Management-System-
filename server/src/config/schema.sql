-- Pharmaceutical Management System Database Schema
-- Compatible with SQLite and MySQL

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(30),
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. MANAGERS TABLE
CREATE TABLE IF NOT EXISTS managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) DEFAULT 'Sales & Operations',
  region VARCHAR(100) DEFAULT 'National',
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. PHARMACISTS TABLE
CREATE TABLE IF NOT EXISTS pharmacists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  license_number VARCHAR(100) UNIQUE,
  qualification VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. CASHIERS TABLE
CREATE TABLE IF NOT EXISTS cashiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  counter_number VARCHAR(20),
  shift VARCHAR(50) DEFAULT 'Morning',
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. VENDORS TABLE
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  company_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  tax_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  hospital_clinic VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. MEDICAL REPRESENTATIVES TABLE
CREATE TABLE IF NOT EXISTS medical_representatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  territory VARCHAR(100) NOT NULL,
  manager_id INTEGER,
  joining_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE SET NULL
);

-- 12. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(150) NOT NULL,
  generic_name VARCHAR(150) NOT NULL,
  category_id INTEGER NOT NULL,
  dosage_form VARCHAR(50) NOT NULL, -- Tablet, Capsule, Syrup, Injection, Vitamin, Inhaler, Ointment
  manufacturer VARCHAR(150) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 20,
  vendor_id INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- 14. PRODUCT BATCHES TABLE
CREATE TABLE IF NOT EXISTS product_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  initial_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 15. SALES (POS INVOICES) TABLE
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id INTEGER NOT NULL,
  customer_id INTEGER,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(30),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'Cash' CHECK(payment_method IN ('Cash', 'Card', 'UPI', 'Insurance')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 16. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  batch_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE RESTRICT
);

-- 17. SALES TARGETS TABLE (For Medical Representatives)
CREATE TABLE IF NOT EXISTS sales_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rep_id INTEGER NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  period_name VARCHAR(50) NOT NULL, -- e.g. "September 2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_type VARCHAR(50) DEFAULT 'Monthly Sales Quota',
  territory VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rep_id) REFERENCES medical_representatives(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 18. SALES ACTIVITIES TABLE (Doctor / Hospital Visits by Reps)
CREATE TABLE IF NOT EXISTS sales_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rep_id INTEGER NOT NULL,
  doctor_id INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  location VARCHAR(150) NOT NULL,
  product_id INTEGER,
  promoted_value DECIMAL(12, 2) DEFAULT 0.00,
  notes TEXT,
  follow_up_date DATE,
  status VARCHAR(30) DEFAULT 'completed' CHECK(status IN ('completed', 'scheduled', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rep_id) REFERENCES medical_representatives(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 19. PERFORMANCE THRESHOLDS TABLE (Configurable criteria)
CREATE TABLE IF NOT EXISTS performance_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name VARCHAR(50) UNIQUE NOT NULL,
  min_percentage DECIMAL(5, 2) NOT NULL,
  max_percentage DECIMAL(5, 2),
  badge_color VARCHAR(30) NOT NULL,
  description TEXT
);

-- 20. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  target_role VARCHAR(50),
  type VARCHAR(50) NOT NULL, -- low_stock, expiring_product, target_milestone, security_alert
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name VARCHAR(100),
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id VARCHAR(50),
  ip_address VARCHAR(50),
  previous_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_targets_rep ON sales_targets(rep_id);
CREATE INDEX IF NOT EXISTS idx_activities_rep ON sales_activities(rep_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON sales_activities(visit_date);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
