# Pharmaceutical Management System

An enterprise-grade, centralized management console for a pharmaceutical manufacturing and distribution organization. Built with a production-style architecture enforcing strict **Role-Based Access Control (RBAC)** across 8 distinct user roles, managing organizational users, field sales activities, medical representative targets & quotas, pharmaceutical inventory with batch/expiry surveillance, Point-of-Sale (POS) cashier transactions, and executive reporting.

---

## 1. Project Objective & Core Business Flow

The system acts as the centralized headquarters for a pharmaceutical organization:

$$\text{Centralized Platform} \longrightarrow \text{Multiple Roles} \longrightarrow \text{RBAC Security} \longrightarrow \text{Role Activities} \longrightarrow \text{Database} \longrightarrow \text{Reports}$$

### Business Context:
- The pharmaceutical company manufactures and distributes pharmaceutical products (Tablets, Capsules, Syrups, Injections, Vitamins, Inhalers, Ointments).
- **Medical Representatives** promote products to doctors, hospitals, and clinics.
- The company assigns monthly sales quotas/targets (e.g. ₹10,00,000/month). Performance is calculated mathematically:
  $$\text{Achievement \%} = \left(\frac{\text{Actual Sales}}{\text{Target Sales}}\right) \times 100$$
  - $\ge 100\%$: **Target Achieved** (e.g. Ravi: Target ₹10,00,000, Actual ₹11,00,000 $\rightarrow 110\%$)
  - $90 - 99\%$: **Near Target**
  - $75 - 89\%$: **Needs Improvement** (e.g. Kumar: Target ₹10,00,000, Actual ₹8,00,000 $\rightarrow 80\%$)
  - $< 75\%$: **Below Target**
- **Cashiers** operate high-speed dispensing counters with server-validated stock deductions and instant receipt generation.
- **Pharmacists** oversee batch registries, manufacture/expiry dates, low-stock warnings, and expiry warnings within 90 days.
- **Managers** supervise team quotas, monitor field visits, and analyze top/under-performers.
- **Vendors** view their supplied products, warehouse inventory, and supply transactions.
- **Doctors** access authorized drug indications, formulations, and medical rep detailing history.
- **Customers** browse the approved medicine catalog, unit prices, and purchase history.

---

## 2. The 8 User Roles & RBAC Matrix

| Role | Primary Functions | Prohibited / Restricted Actions |
| :--- | :--- | :--- |
| **ADMIN** | Full system administration, user management (CRUD, activate/deactivate), product formulations, audit logs, global settings | Super-user; unrestricted. |
| **MANAGER** | Monitor team quotas, review rep doctor visits, analyze target vs actuals, view management reports | Cannot create admin accounts, alter system configs, or delete users. |
| **PHARMACIST** | Manage batch inventory, monitor low-stock warnings & near-expiry warnings, inspect formulations | Cannot process financial POS billing or change user roles. |
| **CASHIER** | Point of Sale (POS) counter billing, live medicine search, cart calculations, print receipts, view shift history | Cannot access user management, audit logs, or edit product prices. |
| **MEDICAL REPRESENTATIVE** | View assigned monthly quota, track achievement %, log doctor/clinic visits, view personal performance | Cannot view or modify another representative's target or unauthorized data. |
| **VENDOR** | View own supplier profile, authorized supplied medicines, warehouse stock levels | Cannot access other vendors' confidential contracts or financial data. |
| **DOCTOR** | View clinician profile, approved pharmaceutical compendium, review past medical rep visits | Cannot modify organization data or access administrative modules. |
| **CUSTOMER** | Search available medicine catalog, review unit prices, view own order receipts | Restricted strictly to own patient profile and personal invoices. |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons, Modern Vanilla CSS Enterprise Design System with custom design tokens, dark/light themes, glassmorphism cards, and responsive tables.
- **Backend**: Node.js v24 + Express.js REST API with clean modular architecture (Controllers, Routes, Middleware, Services, Repositories).
- **Database**: Relational SQLite via `better-sqlite3` (ACID compliant, WAL mode, foreign keys, constraints) with an included MySQL-compatible `schema.sql`.
- **Security & Integrity**: JWT bearer tokens, `bcryptjs` password hashing, parameterized SQL queries against SQL injection, rate limiting, and dual-layer authorization (enforced on both client and API).
- **Testing**: Built-in automated integration and RBAC test suite (`server/src/tests/api.test.js`).

---

## 4. Database Schema

The relational database is structured in `server/src/config/schema.sql`:

```
users (id, name, email, password_hash, role, phone, status, created_at, updated_at)
roles (id, name, description)
permissions (id, name, description)
role_permissions (role_id, permission_id)

managers (id, user_id, name, department, region, status)
pharmacists (id, user_id, license_number, qualification, status)
cashiers (id, user_id, counter_number, shift, status)
vendors (id, user_id, company_name, contact_person, email, phone, address, tax_id, status)
doctors (id, user_id, name, specialization, hospital_clinic, email, phone, address, status)
customers (id, user_id, name, email, phone, address, status)
medical_representatives (id, user_id, name, email, phone, territory, manager_id, joining_date, status)

product_categories (id, name, description)
products (id, name, generic_name, category_id, dosage_form, manufacturer, unit_price, reorder_level, vendor_id, status)
product_batches (id, product_id, batch_number, manufacture_date, expiry_date, initial_quantity, available_quantity, cost_price)

sales (id, invoice_number, cashier_id, customer_id, customer_name, subtotal, tax_amount, discount_amount, total_amount, payment_method, notes)
sale_items (id, sale_id, product_id, batch_id, quantity, unit_price, total_price)

sales_targets (id, rep_id, target_amount, period_name, start_date, end_date, target_type, territory, status, created_by)
sales_activities (id, rep_id, doctor_id, visit_date, location, product_id, promoted_value, notes, follow_up_date, status)
performance_thresholds (id, category_name, min_percentage, max_percentage, badge_color)

notifications (id, user_id, target_role, type, title, message, is_read)
audit_logs (id, user_id, user_name, user_role, action, module, record_id, ip_address, previous_value, new_value, created_at)
```

---

## 5. Pre-Seeded Demo Accounts

All accounts use the standard development password: **`Password@123`**

| Role | Name | Email | Role Profile & Special Attributes |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Dr. Rajesh Sharma | `admin@example.com` | Organization Super-User |
| **MANAGER** | Vikram Malhotra | `manager@example.com` | Regional Sales Manager (North & West) |
| **PHARMACIST** | Pooja Iyer | `pharmacist@example.com` | Lead Pharmacist (License: PH-IND-2021-8841) |
| **CASHIER** | Suresh Raina | `cashier@example.com` | Counter-01 Cashier (Morning Shift) |
| **MEDICAL REP** | Ravi Teja | `representative@example.com` | Star Rep (Target: ₹10L, Actual: ₹11L, 110% Achieved) |
| **MEDICAL REP** | Kumar Sanu | `representative2@example.com` | Field Rep (Target: ₹10L, Actual: ₹8L, 80% Needs Imp.) |
| **VENDOR** | Apex Life Sciences | `vendor@example.com` | Pharmaceutical Supplier (GSTIN24AAACA1122D1Z5) |
| **DOCTOR** | Dr. Sanjay Gupta, MD | `doctor@example.com` | Cardiologist, Apollo Multispeciality Hospital |
| **CUSTOMER** | Aditya Kashyap | `customer@example.com` | Patient / Retail Client |

> **Tip**: The application features an **Instant 1-Click Role Switcher** in the top navigation bar and on the login page to easily switch between all 8 roles without re-typing credentials!

---

## 6. Installation & Running Locally

### Prerequisites
- Node.js (v18+) and npm installed

### 1. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 2. Seed the Database
Populate the database with the complete dataset (1 Admin, 5 Pharmacists, 3 Cashiers, 2 Managers, 10 Vendors, 10 Doctors, 20 Customers, 15 Reps, 32 Medicines & Batches, POS Sales, Targets, and Doctor Visits):
```bash
node server/src/seeds/seedDatabase.js
```

### 3. Start the Backend API Server
```bash
node server/src/index.js
# Backend listening on http://localhost:5000
```

### 4. Start the Frontend Development Server
In a separate terminal:
```bash
cd client
npm run dev
# Frontend ready on http://localhost:5173
```

---

## 7. Automated Test Suite

A comprehensive test suite verifies Authentication, RBAC 403 Forbidden enforcement, POS checkout inventory deductions, and mathematical quota formulas:

```bash
node server/src/tests/api.test.js
```

### Test Suite Execution Output:
```text
======================================================
 RUNNING AUTOMATED PHARMACEUTICAL SYSTEM TEST SUITE
======================================================

TEST: Admin login with correct password returns 200 and JWT token ... PASSED
TEST: Login with wrong password returns 401 Unauthorized ... PASSED
TEST: Login with unknown email returns 401 Unauthorized ... PASSED
TEST: Cashier accessing Admin User Management API is DENIED with 403 Forbidden ... PASSED
TEST: Cashier accessing Audit Logs API is DENIED with 403 Forbidden ... PASSED
TEST: Customer accessing Management Overview Report is DENIED with 403 Forbidden ... PASSED
TEST: Admin accessing Users and Audit Logs is ALLOWED with 200 OK ... PASSED
TEST: Medical Rep 2 trying to access Rep 1 target is DENIED with 403 Forbidden ... PASSED
TEST: Medical Rep 1 accessing own target is ALLOWED with 200 OK ... PASSED
TEST: Target formula calculates exact percentage: (Actual / Target) * 100 ... PASSED
TEST: Cashier POS billing validates server prices, creates sale, and deducts inventory ... PASSED
TEST: POS checkout rejects quantity exceeding available stock with 400 Bad Request ... PASSED
TEST: Admin actions generate persistent audit logs ... PASSED

======================================================
 TEST SUMMARY: 13 PASSED, 0 FAILED
======================================================
```

---

## 8. REST API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Authenticate credentials and issue JWT
- `POST /api/auth/logout` - Invalidate session & log audit trail
- `GET  /api/auth/me` - Fetch authenticated user profile & permissions

### User Administration (Admin & Manager)
- `GET    /api/users` - Search & filter users directory
- `GET    /api/users/roles` - Retrieve all available roles
- `GET    /api/users/:id` - Fetch single user record & role-specific profile
- `POST   /api/users` - Register new user (Admin only)
- `PUT    /api/users/:id` - Update user details & role (Admin only)
- `PATCH  /api/users/:id/status` - Toggle active/inactive status (Admin only)

### Pharmaceutical Products & Batches
- `GET  /api/products` - Catalog search, filter by category, low stock, or expiry
- `GET  /api/products/categories` - Product categories list
- `GET  /api/products/alerts` - Inventory alert center (Low stock & near expiry)
- `GET  /api/products/:id` - Product details & batch breakdown
- `POST /api/products` - Register new medicine (Admin & Pharmacist)
- `POST /api/products/:id/batches` - Add inventory batch (Admin & Pharmacist)

### Point of Sale (POS) Billing
- `POST /api/pos/checkout` - Atomic transaction checkout, stock deduction, & invoice creation
- `GET  /api/pos/transactions` - Filterable sales transaction history
- `GET  /api/pos/transactions/:invoice` - Full tax invoice with itemized batches

### Medical Representative Quotas & Visits
- `GET  /api/targets` - Quotas list with achievement % & performance category
- `GET  /api/targets/performance-summary` - Team ranking (Top performers, underperformers)
- `POST /api/targets` - Assign sales target quota (Admin & Manager)
- `GET  /api/activities` - Field visit logs (Doctor, clinic, product, follow-up)
- `POST /api/activities` - Log doctor field visit (Medical Rep & Admin)

### Reporting & Auditing
- `GET /api/reports/overview` - Consolidated executive KPIs & charts
- `GET /api/reports/sales` - Product-wise & cashier-wise revenue breakdown
- `GET /api/reports/representatives` - Territory quota achievement report
- `GET /api/reports/products` - Stock surveillance & expiry report
- `GET /api/reports/vendors` - Supplier fulfillment report
- `GET /api/audit` - Security audit trail with search & module filtering (Admin only)
