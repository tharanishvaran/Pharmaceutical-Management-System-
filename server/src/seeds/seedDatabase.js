import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../config/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function seed() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  console.log('--- Seeding Roles & Permissions ---');
  const roles = [
    { name: 'ADMIN', desc: 'Full organizational & system administration privileges' },
    { name: 'MANAGER', desc: 'Regional/Departmental sales supervision, targets and reporting' },
    { name: 'PHARMACIST', desc: 'Pharmaceutical stock monitoring, batches, formulations, and expiry management' },
    { name: 'CASHIER', desc: 'Point of Sale billing, sales transactions, receipts, and cashier reports' },
    { name: 'MEDICAL_REPRESENTATIVE', desc: 'Product promotion to healthcare professionals, sales targets, and visit tracking' },
    { name: 'VENDOR', desc: 'Raw/finished pharmaceutical product supply tracking and orders' },
    { name: 'DOCTOR', desc: 'Approved pharmaceutical compendium lookup, samples, and rep visits' },
    { name: 'CUSTOMER', desc: 'Patient/client medicine catalog lookup, orders, and receipts' }
  ];

  const insertRole = db.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`);
  for (const r of roles) {
    insertRole.run(r.name, r.desc);
  }

  const permissions = [
    { name: 'users.read', desc: 'View user directory' },
    { name: 'users.create', desc: 'Create new users' },
    { name: 'users.update', desc: 'Update user profiles and roles' },
    { name: 'users.delete', desc: 'Deactivate or delete users' },
    { name: 'products.view', desc: 'View pharmaceutical products compendium' },
    { name: 'products.manage', desc: 'Create, update, and manage products and batches' },
    { name: 'pharmacist.activities', desc: 'Pharmacist stock updates, expiry and batch reviews' },
    { name: 'billing.manage', desc: 'Access POS billing system and process sales' },
    { name: 'transactions.view', desc: 'View POS sales transactions and receipts' },
    { name: 'transactions.create', desc: 'Create sales transactions' },
    { name: 'reports.view', desc: 'Access organization, sales, and management reports' },
    { name: 'representatives.view', desc: 'Monitor Medical Representatives' },
    { name: 'targets.assign', desc: 'Assign sales quotas and targets' },
    { name: 'targets.view_own', desc: 'View personal assigned sales target' },
    { name: 'performance.view', desc: 'View organization-wide performance analysis' },
    { name: 'performance.view_own', desc: 'View personal target performance' },
    { name: 'sales.activity.manage', desc: 'Log and manage doctor sales visits' },
    { name: 'vendor.activities', desc: 'Access vendor profile and supplied goods' },
    { name: 'doctor.activities', desc: 'Access doctor profile and clinical compendium' },
    { name: 'customer.activities', desc: 'Access customer portal, catalog, and invoices' },
    { name: 'audit.view', desc: 'Inspect security audit trails' },
    { name: 'settings.manage', desc: 'Configure system settings and performance criteria' }
  ];

  const insertPerm = db.prepare(`INSERT OR IGNORE INTO permissions (name, description) VALUES (?, ?)`);
  for (const p of permissions) {
    insertPerm.run(p.name, p.desc);
  }

  // Map permissions to roles
  const rolePermMap = {
    ADMIN: permissions.map(p => p.name),
    MANAGER: ['reports.view', 'representatives.view', 'targets.assign', 'performance.view', 'products.view', 'transactions.view'],
    PHARMACIST: ['products.view', 'pharmacist.activities'],
    CASHIER: ['products.view', 'billing.manage', 'transactions.create', 'transactions.view'],
    MEDICAL_REPRESENTATIVE: ['products.view', 'targets.view_own', 'performance.view_own', 'sales.activity.manage'],
    VENDOR: ['vendor.activities'],
    DOCTOR: ['doctor.activities', 'products.view'],
    CUSTOMER: ['customer.activities', 'products.view']
  };

  const getRoleId = db.prepare(`SELECT id FROM roles WHERE name = ?`);
  const getPermId = db.prepare(`SELECT id FROM permissions WHERE name = ?`);
  const insertRolePerm = db.prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`);

  for (const [roleName, perms] of Object.entries(rolePermMap)) {
    const roleRow = getRoleId.get(roleName);
    if (!roleRow) continue;
    for (const pName of perms) {
      const permRow = getPermId.get(pName);
      if (permRow) {
        insertRolePerm.run(roleRow.id, permRow.id);
      }
    }
  }

  console.log('--- Seeding Performance Thresholds ---');
  const thresholds = [
    { name: 'Target Achieved', min: 100.0, max: null, color: '#10b981', desc: 'Quota completed or exceeded' },
    { name: 'Near Target', min: 90.0, max: 99.99, color: '#3b82f6', desc: 'Within 10% of achieving quota' },
    { name: 'Needs Improvement', min: 75.0, max: 89.99, color: '#f59e0b', desc: 'Moderate performance gap' },
    { name: 'Below Target', min: 0.0, max: 74.99, color: '#ef4444', desc: 'Significantly under target' }
  ];

  const insertThreshold = db.prepare(`
    INSERT OR REPLACE INTO performance_thresholds (category_name, min_percentage, max_percentage, badge_color, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const t of thresholds) {
    insertThreshold.run(t.name, t.min, t.max, t.color, t.desc);
  }

  console.log('--- Seeding Product Categories ---');
  const categories = [
    { name: 'Antibiotics', desc: 'Bacterial infection treatments and antimicrobials' },
    { name: 'Analgesics & Antipyretics', desc: 'Pain relief and fever management' },
    { name: 'Cardiovascular', desc: 'Hypertension, cholesterol, and cardiac formulations' },
    { name: 'Antidiabetic', desc: 'Blood glucose regulation and metabolic therapies' },
    { name: 'Respiratory', desc: 'Bronchodilators, inhalers, and antihistamines' },
    { name: 'Gastrointestinal', desc: 'Antacids, proton pump inhibitors, and motility regulators' },
    { name: 'Vitamins & Supplements', desc: 'Nutritional supplements and micronutrients' },
    { name: 'Dermatological', desc: 'Topical ointments, antimycotics, and skin formulations' }
  ];

  const insertCat = db.prepare(`INSERT OR IGNORE INTO product_categories (name, description) VALUES (?, ?)`);
  for (const c of categories) {
    insertCat.run(c.name, c.desc);
  }

  console.log('--- Generating Password Hashes ---');
  const demoPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  // Helper to insert user
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  console.log('--- Seeding Users (Admin, Managers, Pharmacists, Cashiers, Reps, Vendors, Doctors, Customers) ---');
  
  // Clean existing users to avoid unique email conflicts if re-seeded
  db.prepare(`DELETE FROM users`).run();
  db.prepare(`DELETE FROM managers`).run();
  db.prepare(`DELETE FROM pharmacists`).run();
  db.prepare(`DELETE FROM cashiers`).run();
  db.prepare(`DELETE FROM vendors`).run();
  db.prepare(`DELETE FROM doctors`).run();
  db.prepare(`DELETE FROM customers`).run();
  db.prepare(`DELETE FROM medical_representatives`).run();
  db.prepare(`DELETE FROM products`).run();
  db.prepare(`DELETE FROM product_batches`).run();
  db.prepare(`DELETE FROM sales`).run();
  db.prepare(`DELETE FROM sale_items`).run();
  db.prepare(`DELETE FROM sales_targets`).run();
  db.prepare(`DELETE FROM sales_activities`).run();
  db.prepare(`DELETE FROM notifications`).run();
  db.prepare(`DELETE FROM audit_logs`).run();

  // 1. ADMIN (1)
  const adminResult = insertUser.run('Dr. Rajesh Sharma (Admin)', 'admin@example.com', passwordHash, 'ADMIN', '+91 98765 43210', 'active', '-60 days');
  const adminId = adminResult.lastInsertRowid;

  // 2. MANAGERS (2)
  const managersData = [
    { name: 'Vikram Malhotra', email: 'manager@example.com', phone: '+91 98111 22334', dept: 'North & West Regional Sales', region: 'North Zone' },
    { name: 'Ananya Deshmukh', email: 'manager2@example.com', phone: '+91 98222 33445', dept: 'South & East Regional Sales', region: 'South Zone' }
  ];

  const insertManager = db.prepare(`
    INSERT INTO managers (user_id, name, department, region, status)
    VALUES (?, ?, ?, ?, 'active')
  `);
  const managerIds = [];
  for (const m of managersData) {
    const res = insertUser.run(m.name, m.email, passwordHash, 'MANAGER', m.phone, 'active', '-50 days');
    const mRes = insertManager.run(res.lastInsertRowid, m.name, m.dept, m.region);
    managerIds.push(mRes.lastInsertRowid);
  }

  // 3. PHARMACISTS (5)
  const pharmacistsData = [
    { name: 'Pooja Iyer', email: 'pharmacist@example.com', phone: '+91 98333 44556', license: 'PH-IND-2021-8841', qual: 'M.Pharm (Pharmacology)' },
    { name: 'Arun Nair', email: 'pharmacist2@example.com', phone: '+91 98333 44557', license: 'PH-IND-2022-3920', qual: 'B.Pharm' },
    { name: 'Sneha Kulkarni', email: 'pharmacist3@example.com', phone: '+91 98333 44558', license: 'PH-IND-2020-1129', qual: 'Pharm.D' },
    { name: 'Mohit Verma', email: 'pharmacist4@example.com', phone: '+91 98333 44559', license: 'PH-IND-2023-5590', qual: 'B.Pharm' },
    { name: 'Kavita Pillai', email: 'pharmacist5@example.com', phone: '+91 98333 44560', license: 'PH-IND-2019-9021', qual: 'M.Pharm (Pharmaceutics)' }
  ];

  const insertPharmacist = db.prepare(`
    INSERT INTO pharmacists (user_id, license_number, qualification, status)
    VALUES (?, ?, ?, 'active')
  `);
  for (const p of pharmacistsData) {
    const res = insertUser.run(p.name, p.email, passwordHash, 'PHARMACIST', p.phone, 'active', '-45 days');
    insertPharmacist.run(res.lastInsertRowid, p.license, p.qual);
  }

  // 4. CASHIERS (3)
  const cashiersData = [
    { name: 'Suresh Raina', email: 'cashier@example.com', phone: '+91 98444 55661', counter: 'Counter-01', shift: 'Morning' },
    { name: 'Divya Sen', email: 'cashier2@example.com', phone: '+91 98444 55662', counter: 'Counter-02', shift: 'Evening' },
    { name: 'Gaurav Joshi', email: 'cashier3@example.com', phone: '+91 98444 55663', counter: 'Counter-03', shift: 'Night' }
  ];

  const insertCashier = db.prepare(`
    INSERT INTO cashiers (user_id, counter_number, shift, status)
    VALUES (?, ?, ?, 'active')
  `);
  const cashierUserIds = [];
  for (const c of cashiersData) {
    const res = insertUser.run(c.name, c.email, passwordHash, 'CASHIER', c.phone, 'active', '-40 days');
    cashierUserIds.push(res.lastInsertRowid);
    insertCashier.run(res.lastInsertRowid, c.counter, c.shift);
  }

  // 5. VENDORS (10)
  const vendorsData = [
    { company: 'Apex Life Sciences Ltd', contact: 'Manoj Bajpayee', email: 'vendor@example.com', phone: '+91 98555 11001', addr: 'Plot 42, GIDC Industrial Estate, Ahmedabad, Gujarat', tax: 'GSTIN24AAACA1122D1Z5' },
    { company: 'Biocare Pharma Solutions', contact: 'Rameshwar Roy', email: 'vendor2@example.com', phone: '+91 98555 11002', addr: 'Baddi Industrial Area, Solan, Himachal Pradesh', tax: 'GSTIN02AAACB2233E1Z4' },
    { company: 'Sunlight Active Ingredients', contact: 'Geeta Agarwal', email: 'vendor3@example.com', phone: '+91 98555 11003', addr: 'Jeedimetla Pharma Zone, Hyderabad, Telangana', tax: 'GSTIN36AAACC3344F1Z3' },
    { company: 'MediCore Global Lab', contact: 'Tariq Siddiqui', email: 'vendor4@example.com', phone: '+91 98555 11004', addr: 'MIDC Kurkumbh, Pune, Maharashtra', tax: 'GSTIN27AAACD4455G1Z2' },
    { company: 'Zenith Formulations Inc', contact: 'Harish Mehta', email: 'vendor5@example.com', phone: '+91 98555 11005', addr: 'Industrial Growth Centre, Samba, Jammu & Kashmir', tax: 'GSTIN01AAACE5566H1Z1' },
    { company: 'Global Capsule Technologies', contact: 'Alok Saxena', email: 'vendor6@example.com', phone: '+91 98555 11006', addr: 'Peenya Industrial Area, Bengaluru, Karnataka', tax: 'GSTIN29AAACF6677I1Z0' },
    { company: 'Sterile Vials & Injections Ltd', contact: 'Sunita Rao', email: 'vendor7@example.com', phone: '+91 98555 11007', addr: 'SIPCOT Industrial Park, Hosur, Tamil Nadu', tax: 'GSTIN33AAACG7788J1Z9' },
    { company: 'Astra Bio-Synthetics', contact: 'Naveen Jindal', email: 'vendor8@example.com', phone: '+91 98555 11008', addr: 'Ankleshwar Chemical Zone, Bharuch, Gujarat', tax: 'GSTIN24AAACH8899K1Z8' },
    { company: 'Nectar Nutraceuticals', contact: 'Deepak Chawla', email: 'vendor9@example.com', phone: '+91 98555 11009', addr: 'SIDCUL Integrated Industrial Estate, Haridwar, Uttarakhand', tax: 'GSTIN05AAACI9900L1Z7' },
    { company: 'Pristine Health Supplies', contact: 'Meenakshi Sundaram', email: 'vendor10@example.com', phone: '+91 98555 11010', addr: 'Kakkanad Tech Park Road, Kochi, Kerala', tax: 'GSTIN32AAACJ0011M1Z6' }
  ];

  const insertVendor = db.prepare(`
    INSERT INTO vendors (user_id, company_name, contact_person, email, phone, address, tax_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const vendorIds = [];
  for (const v of vendorsData) {
    const res = insertUser.run(v.contact, v.email, passwordHash, 'VENDOR', v.phone, 'active', '-35 days');
    const vRes = insertVendor.run(res.lastInsertRowid, v.company, v.contact, v.email, v.phone, v.addr, v.tax);
    vendorIds.push(vRes.lastInsertRowid);
  }

  // 6. DOCTORS (10)
  const doctorsData = [
    { name: 'Dr. Sanjay Gupta, MD', spec: 'Cardiologist', hospital: 'Apollo Multispeciality Hospital, Delhi', email: 'doctor@example.com', phone: '+91 98666 22001', addr: 'Sarita Vihar, Mathura Road, New Delhi' },
    { name: 'Dr. Meera Nambiar, MD', spec: 'Internal Medicine', hospital: 'Fortis Memorial Research Institute, Gurugram', email: 'doctor2@example.com', phone: '+91 98666 22002', addr: 'Sector 44, Gurugram, Haryana' },
    { name: 'Dr. Anand Swaminathan, MS', spec: 'General Surgeon', hospital: 'Manipal Hospital, Bengaluru', email: 'doctor3@example.com', phone: '+91 98666 22003', addr: 'HAL Old Airport Road, Bengaluru' },
    { name: 'Dr. Shalini Kapoor, MD', spec: 'Pediatrician', hospital: 'Max Super Speciality Hospital, Saket', email: 'doctor4@example.com', phone: '+91 98666 22004', addr: 'Press Enclave Road, Saket, New Delhi' },
    { name: 'Dr. Pradeep Bhatt, MD', spec: 'Pulmonologist & Chest Physician', hospital: 'Lilavati Hospital & Research Centre, Mumbai', email: 'doctor5@example.com', phone: '+91 98666 22005', addr: 'Bandra West, Mumbai, Maharashtra' },
    { name: 'Dr. Tanuja Reddy, DNB', spec: 'Endocrinologist & Diabetologist', hospital: 'Yashoda Hospitals, Hyderabad', email: 'doctor6@example.com', phone: '+91 98666 22006', addr: 'Somajiguda, Hyderabad, Telangana' },
    { name: 'Dr. Vivek Khurana, MD', spec: 'Gastroenterologist', hospital: 'Medanta - The Medicity, Gurugram', email: 'doctor7@example.com', phone: '+91 98666 22007', addr: 'CH Bakhtawar Singh Road, Gurugram' },
    { name: 'Dr. Rituparna Bose, MD', spec: 'Dermatologist', hospital: 'AMRI Hospitals, Kolkata', email: 'doctor8@example.com', phone: '+91 98666 22008', addr: 'Dhakuria, Kolkata, West Bengal' },
    { name: 'Dr. Rakesh Singhal, MS', spec: 'Orthopedic Surgeon', hospital: 'Sir Ganga Ram Hospital, New Delhi', email: 'doctor9@example.com', phone: '+91 98666 22009', addr: 'Rajinder Nagar, New Delhi' },
    { name: 'Dr. Preeti Vasudevan, MD', spec: 'Gynecologist & Obstetrician', hospital: 'MIOT International, Chennai', email: 'doctor10@example.com', phone: '+91 98666 22010', addr: 'Manapakkam, Chennai, Tamil Nadu' }
  ];

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (user_id, name, specialization, hospital_clinic, email, phone, address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const doctorIds = [];
  for (const d of doctorsData) {
    const res = insertUser.run(d.name, d.email, passwordHash, 'DOCTOR', d.phone, 'active', '-30 days');
    const dRes = insertDoctor.run(res.lastInsertRowid, d.name, d.spec, d.hospital, d.email, d.phone, d.addr);
    doctorIds.push(dRes.lastInsertRowid);
  }

  // 7. CUSTOMERS (20)
  const customersData = [
    { name: 'Aditya Kashyap', email: 'customer@example.com', phone: '+91 98777 33001', addr: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru' },
    { name: 'Bhavna Menon', email: 'customer2@example.com', phone: '+91 98777 33002', addr: 'House 12, Sector 15, Chandigarh' },
    { name: 'Chetan Bhagat', email: 'customer3@example.com', phone: '+91 98777 33003', addr: '74 Hill Road, Bandra West, Mumbai' },
    { name: 'Deepika Padukone', email: 'customer4@example.com', phone: '+91 98777 33004', addr: 'Prabhadevi Tower, Mumbai' },
    { name: 'Eshwar Prasad', email: 'customer5@example.com', phone: '+91 98777 33005', addr: 'Plot 88, Banjara Hills Road No 12, Hyderabad' },
    { name: 'Farhan Akhtar', email: 'customer6@example.com', phone: '+91 98777 33006', addr: 'Bungalow 5, Juhu Tara Road, Mumbai' },
    { name: 'Geetanjali Thapa', email: 'customer7@example.com', phone: '+91 98777 33007', addr: 'Development Area, Gangtok, Sikkim' },
    { name: 'Hemant Soren', email: 'customer8@example.com', phone: '+91 98777 33008', addr: 'Kanke Road, Ranchi, Jharkhand' },
    { name: 'Indira Mukherjee', email: 'customer9@example.com', phone: '+91 98777 33009', addr: 'Ballygunge Circular Road, Kolkata' },
    { name: 'Jatin Sarna', email: 'customer10@example.com', phone: '+91 98777 33010', addr: 'Lajpat Nagar IV, New Delhi' },
    { name: 'Karthik Subbaraj', email: 'customer11@example.com', phone: '+91 98777 33011', addr: 'Anna Nagar West, Chennai' },
    { name: 'Lavanya Tripathi', email: 'customer12@example.com', phone: '+91 98777 33012', addr: 'Jubilee Hills, Hyderabad' },
    { name: 'Manish Malhotra', email: 'customer13@example.com', phone: '+91 98777 33013', addr: 'Pali Hill, Khar West, Mumbai' },
    { name: 'Nandita Das', email: 'customer14@example.com', phone: '+91 98777 33014', addr: 'Golf Links, New Delhi' },
    { name: 'Omkar Kapoor', email: 'customer15@example.com', phone: '+91 98777 33015', addr: 'Model Town III, Delhi' },
    { name: 'Pallavi Sharda', email: 'customer16@example.com', phone: '+91 98777 33016', addr: 'Indiranagar 100ft Road, Bengaluru' },
    { name: 'Raghav Juyal', email: 'customer17@example.com', phone: '+91 98777 33017', addr: 'Rajpur Road, Dehradun, Uttarakhand' },
    { name: 'Sanya Malhotra', email: 'customer18@example.com', phone: '+91 98777 33018', addr: 'South Extension Part 2, New Delhi' },
    { name: 'Tarun Tahiliani', email: 'customer19@example.com', phone: '+91 98777 33019', addr: 'Mehrauli Heritage Zone, New Delhi' },
    { name: 'Upendra Rao', email: 'customer20@example.com', phone: '+91 98777 33020', addr: 'Sadashivanagar, Bengaluru' }
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (user_id, name, email, phone, address, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);
  const customerIds = [];
  for (const c of customersData) {
    const res = insertUser.run(c.name, c.email, passwordHash, 'CUSTOMER', c.phone, 'active', '-25 days');
    const cRes = insertCustomer.run(res.lastInsertRowid, c.name, c.email, c.phone, c.addr);
    customerIds.push(cRes.lastInsertRowid);
  }

  // 8. MEDICAL REPRESENTATIVES (15)
  // Notable example 1: Ravi (representative@example.com) -> Target 10,00,000, Actual 11,00,000 (110% Target Achieved)
  // Notable example 2: Kumar (representative2@example.com) -> Target 10,00,000, Actual 8,00,000 (80% Needs Improvement)
  const repsData = [
    { name: 'Ravi Teja (Star Rep)', email: 'representative@example.com', phone: '+91 98888 44001', territory: 'South Delhi & Noida', managerIdx: 0, join: '2024-01-15' },
    { name: 'Kumar Sanu', email: 'representative2@example.com', phone: '+91 98888 44002', territory: 'Gurugram & Faridabad', managerIdx: 0, join: '2024-02-01' },
    { name: 'Priya Narang', email: 'representative3@example.com', phone: '+91 98888 44003', territory: 'North Delhi & Rohtak', managerIdx: 0, join: '2024-03-10' },
    { name: 'Amitabh Sen', email: 'representative4@example.com', phone: '+91 98888 44004', territory: 'South Mumbai & Colaba', managerIdx: 0, join: '2023-11-20' },
    { name: 'Sunil Gavaskar', email: 'representative5@example.com', phone: '+91 98888 44005', territory: 'Western Suburbs, Mumbai', managerIdx: 0, join: '2024-04-05' },
    { name: 'Neha Kakkar', email: 'representative6@example.com', phone: '+91 98888 44006', territory: 'Pune Metropolitan Region', managerIdx: 0, join: '2024-05-12' },
    { name: 'Kunal Khemu', email: 'representative7@example.com', phone: '+91 98888 44007', territory: 'Ahmedabad & Vadodara', managerIdx: 0, join: '2023-09-01' },
    { name: 'Vandana Shiva', email: 'representative8@example.com', phone: '+91 98888 44008', territory: 'Jaipur & Ajmer', managerIdx: 0, join: '2024-06-18' },
    { name: 'Siddharth Roy', email: 'representative9@example.com', phone: '+91 98888 44009', territory: 'Bengaluru Central & Whitefield', managerIdx: 1, join: '2023-08-15' },
    { name: 'Deepa Malik', email: 'representative10@example.com', phone: '+91 98888 44010', territory: 'Bengaluru South & Electronic City', managerIdx: 1, join: '2024-02-20' },
    { name: 'Rohan Bopanna', email: 'representative11@example.com', phone: '+91 98888 44011', territory: 'Chennai Central & Anna Nagar', managerIdx: 1, join: '2024-03-01' },
    { name: 'Smriti Mandhana', email: 'representative12@example.com', phone: '+91 98888 44012', territory: 'Hyderabad & Secunderabad', managerIdx: 1, join: '2024-01-10' },
    { name: 'Abhinav Bindra', email: 'representative13@example.com', phone: '+91 98888 44013', territory: 'Kolkata Metropolitan & Salt Lake', managerIdx: 1, join: '2024-04-15' },
    { name: 'Mithali Raj', email: 'representative14@example.com', phone: '+91 98888 44014', territory: 'Kochi & Ernakulam', managerIdx: 1, join: '2024-05-01' },
    { name: 'Kiran Bedi', email: 'representative15@example.com', phone: '+91 98888 44015', territory: 'Bhubaneswar & Cuttack', managerIdx: 1, join: '2024-07-01' }
  ];

  const insertRep = db.prepare(`
    INSERT INTO medical_representatives (user_id, name, email, phone, territory, manager_id, joining_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  const repIds = [];
  for (const r of repsData) {
    const res = insertUser.run(r.name, r.email, passwordHash, 'MEDICAL_REPRESENTATIVE', r.phone, 'active', '-20 days');
    const rRes = insertRep.run(res.lastInsertRowid, r.name, r.email, r.phone, r.territory, managerIds[r.managerIdx], r.join);
    repIds.push(rRes.lastInsertRowid);
  }

  console.log('--- Seeding 32 Pharmaceutical Products & Batches ---');
  const catRows = db.prepare(`SELECT id, name FROM product_categories`).all();
  const catMap = {};
  catRows.forEach(c => { catMap[c.name] = c.id; });

  const productsList = [
    // Antibiotics
    { name: 'Amoxil 500mg', gen: 'Amoxicillin Trihydrate', cat: 'Antibiotics', form: 'Capsule', mfr: 'Apex Life Sciences', price: 120.00, reorder: 30, vIdx: 0, batch: 'AMX-2026-01', mfg: '2025-01-10', exp: '2027-01-10', qty: 450, cost: 65.00 },
    { name: 'Azithral 500mg', gen: 'Azithromycin', cat: 'Antibiotics', form: 'Tablet', mfr: 'Apex Life Sciences', price: 185.50, reorder: 25, vIdx: 0, batch: 'AZT-2026-09', mfg: '2025-02-15', exp: '2027-02-15', qty: 320, cost: 95.00 },
    { name: 'Cifran 500mg', gen: 'Ciprofloxacin HCl', cat: 'Antibiotics', form: 'Tablet', mfr: 'Biocare Pharma', price: 95.00, reorder: 40, vIdx: 1, batch: 'CIF-2025-88', mfg: '2024-11-01', exp: '2026-11-01', qty: 15, cost: 48.00 }, // LOW STOCK WARNING
    { name: 'Augmentin 625 Duo', gen: 'Amoxicillin + Clavulanic Acid', cat: 'Antibiotics', form: 'Tablet', mfr: 'Biocare Pharma', price: 215.00, reorder: 50, vIdx: 1, batch: 'AUG-2026-12', mfg: '2025-03-01', exp: '2027-03-01', qty: 580, cost: 120.00 },
    { name: 'Cepexil 250mg Syrup', gen: 'Cephalexin Oral Suspension', cat: 'Antibiotics', form: 'Syrup', mfr: 'Astra Bio-Synthetics', price: 140.00, reorder: 20, vIdx: 7, batch: 'CPX-2025-04', mfg: '2024-05-10', exp: '2026-10-15', qty: 85, cost: 72.00 }, // NEAR EXPIRY WARNING

    // Analgesics & Antipyretics
    { name: 'Dolo 650mg', gen: 'Paracetamol', cat: 'Analgesics & Antipyretics', form: 'Tablet', mfr: 'Sunlight Active Ingredients', price: 32.50, reorder: 100, vIdx: 2, batch: 'DLO-2026-77', mfg: '2025-01-01', exp: '2028-01-01', qty: 2500, cost: 14.00 },
    { name: 'Combiflam', gen: 'Ibuprofen + Paracetamol', cat: 'Analgesics & Antipyretics', form: 'Tablet', mfr: 'Sunlight Active Ingredients', price: 45.00, reorder: 60, vIdx: 2, batch: 'CMB-2025-99', mfg: '2024-08-15', exp: '2027-08-15', qty: 890, cost: 20.00 },
    { name: 'Ultracet Semi', gen: 'Tramadol HCl + Acetaminophen', cat: 'Analgesics & Antipyretics', form: 'Tablet', mfr: 'MediCore Global', price: 175.00, reorder: 20, vIdx: 3, batch: 'ULT-2026-03', mfg: '2025-04-10', exp: '2027-04-10', qty: 180, cost: 92.00 },
    { name: 'Voveran 50mg', gen: 'Diclofenac Sodium', cat: 'Analgesics & Antipyretics', form: 'Tablet', mfr: 'MediCore Global', price: 58.00, reorder: 35, vIdx: 3, batch: 'VOV-2025-55', mfg: '2024-10-20', exp: '2026-10-25', qty: 45, cost: 26.00 }, // NEAR EXPIRY
    { name: 'Dynapar AQ 75mg/ml', gen: 'Diclofenac Sodium Aqueous', cat: 'Analgesics & Antipyretics', form: 'Injection', mfr: 'Sterile Vials & Injections', price: 85.00, reorder: 30, vIdx: 6, batch: 'DYN-2026-14', mfg: '2025-02-12', exp: '2027-02-12', qty: 210, cost: 38.00 },

    // Cardiovascular
    { name: 'Atorva 20mg', gen: 'Atorvastatin Calcium', cat: 'Cardiovascular', form: 'Tablet', mfr: 'Zenith Formulations', price: 210.00, reorder: 50, vIdx: 4, batch: 'ATV-2026-05', mfg: '2025-01-20', exp: '2027-06-20', qty: 640, cost: 105.00 },
    { name: 'Telma 40mg', gen: 'Telmisartan', cat: 'Cardiovascular', form: 'Tablet', mfr: 'Zenith Formulations', price: 135.00, reorder: 40, vIdx: 4, batch: 'TLM-2026-22', mfg: '2025-03-15', exp: '2027-09-15', qty: 510, cost: 68.00 },
    { name: 'Amlong 5mg', gen: 'Amlodipine Besylate', cat: 'Cardiovascular', form: 'Tablet', mfr: 'Zenith Formulations', price: 65.00, reorder: 30, vIdx: 4, batch: 'AML-2025-18', mfg: '2024-09-01', exp: '2026-12-01', qty: 12, cost: 30.00 }, // LOW STOCK WARNING
    { name: 'Concor 5mg', gen: 'Bisoprolol Fumarate', cat: 'Cardiovascular', form: 'Tablet', mfr: 'Apex Life Sciences', price: 155.00, reorder: 25, vIdx: 0, batch: 'CNC-2026-44', mfg: '2025-02-01', exp: '2027-08-01', qty: 290, cost: 80.00 },
    { name: 'Ecosprin 75mg', gen: 'Enteric Coated Aspirin', cat: 'Cardiovascular', form: 'Capsule', mfr: 'Global Capsule Tech', price: 18.00, reorder: 80, vIdx: 5, batch: 'ECO-2026-61', mfg: '2025-01-05', exp: '2028-01-05', qty: 1800, cost: 8.00 },

    // Antidiabetic
    { name: 'Glycomet GP 1mg', gen: 'Metformin HCl + Glimepiride', cat: 'Antidiabetic', form: 'Tablet', mfr: 'Sunlight Active Ingredients', price: 145.00, reorder: 45, vIdx: 2, batch: 'GLY-2026-33', mfg: '2025-02-18', exp: '2027-05-18', qty: 780, cost: 72.00 },
    { name: 'Januvia 100mg', gen: 'Sitagliptin Phosphate', cat: 'Antidiabetic', form: 'Tablet', mfr: 'Biocare Pharma', price: 420.00, reorder: 20, vIdx: 1, batch: 'JAN-2026-71', mfg: '2025-04-01', exp: '2027-04-01', qty: 190, cost: 260.00 },
    { name: 'Galvus Met 50/500', gen: 'Vildagliptin + Metformin', cat: 'Antidiabetic', form: 'Tablet', mfr: 'Biocare Pharma', price: 340.00, reorder: 30, vIdx: 1, batch: 'GLV-2026-19', mfg: '2025-03-25', exp: '2027-09-25', qty: 340, cost: 195.00 },
    { name: 'Human Mixtard 30/70', gen: 'Biphasic Isophane Insulin', cat: 'Antidiabetic', form: 'Injection', mfr: 'Sterile Vials & Injections', price: 290.00, reorder: 25, vIdx: 6, batch: 'MIX-2026-80', mfg: '2025-05-10', exp: '2026-11-10', qty: 140, cost: 185.00 },

    // Respiratory
    { name: 'Asthalin Inhaler 100mcg', gen: 'Salbutamol Inhalation Aerosol', cat: 'Respiratory', form: 'Inhaler', mfr: 'Zenith Formulations', price: 165.00, reorder: 30, vIdx: 4, batch: 'AST-2026-92', mfg: '2025-01-15', exp: '2027-01-15', qty: 260, cost: 88.00 },
    { name: 'Budecort 200 Inhaler', gen: 'Budesonide Inhalation', cat: 'Respiratory', form: 'Inhaler', mfr: 'Zenith Formulations', price: 380.00, reorder: 20, vIdx: 4, batch: 'BUD-2026-50', mfg: '2025-03-01', exp: '2027-03-01', qty: 150, cost: 210.00 },
    { name: 'Ascoril LS Syrup', gen: 'Levosalbutamol + Ambroxol + Guaiphenesin', cat: 'Respiratory', form: 'Syrup', mfr: 'Apex Life Sciences', price: 118.00, reorder: 35, vIdx: 0, batch: 'ASC-2026-27', mfg: '2025-02-28', exp: '2027-02-28', qty: 420, cost: 58.00 },
    { name: 'Montair LC 10mg/5mg', gen: 'Montelukast Sodium + Levocetirizine', cat: 'Respiratory', form: 'Tablet', mfr: 'MediCore Global', price: 195.00, reorder: 40, vIdx: 3, batch: 'MNT-2026-38', mfg: '2025-04-15', exp: '2027-04-15', qty: 550, cost: 98.00 },

    // Gastrointestinal
    { name: 'Pan 40mg', gen: 'Pantoprazole Sodium', cat: 'Gastrointestinal', form: 'Tablet', mfr: 'Sunlight Active Ingredients', price: 155.00, reorder: 60, vIdx: 2, batch: 'PAN-2026-45', mfg: '2025-01-18', exp: '2027-07-18', qty: 920, cost: 74.00 },
    { name: 'Omez 20mg', gen: 'Omeprazole', cat: 'Gastrointestinal', form: 'Capsule', mfr: 'Global Capsule Tech', price: 82.00, reorder: 50, vIdx: 5, batch: 'OMZ-2026-11', mfg: '2025-02-05', exp: '2027-08-05', qty: 710, cost: 38.00 },
    { name: 'Gelusil Antacid Liquid', gen: 'Aluminium Hydroxide + Magnesium Hydroxide', cat: 'Gastrointestinal', form: 'Syrup', mfr: 'Apex Life Sciences', price: 125.00, reorder: 30, vIdx: 0, batch: 'GEL-2025-63', mfg: '2024-07-10', exp: '2026-10-30', qty: 18, cost: 60.00 }, // LOW STOCK & NEAR EXPIRY
    { name: 'Econorm 250mg', gen: 'Saccharomyces boulardii', cat: 'Gastrointestinal', form: 'Capsule', mfr: 'Global Capsule Tech', price: 280.00, reorder: 25, vIdx: 5, batch: 'ECN-2026-82', mfg: '2025-03-12', exp: '2027-03-12', qty: 230, cost: 165.00 },

    // Vitamins & Supplements
    { name: 'Becosules Z', gen: 'Vitamin B-Complex with Zinc & Vitamin C', cat: 'Vitamins & Supplements', form: 'Capsule', mfr: 'Nectar Nutraceuticals', price: 54.00, reorder: 80, vIdx: 8, batch: 'BEC-2026-90', mfg: '2025-01-10', exp: '2027-07-10', qty: 1400, cost: 24.00 },
    { name: 'Shelcal 500mg', gen: 'Elemental Calcium + Vitamin D3', cat: 'Vitamins & Supplements', form: 'Tablet', mfr: 'Nectar Nutraceuticals', price: 132.00, reorder: 60, vIdx: 8, batch: 'SHL-2026-08', mfg: '2025-02-14', exp: '2027-08-14', qty: 850, cost: 62.00 },
    { name: 'Zincovit Tablet', gen: 'Multivitamins + Multiminerals + Grape Seed', cat: 'Vitamins & Supplements', form: 'Tablet', mfr: 'Nectar Nutraceuticals', price: 110.00, reorder: 50, vIdx: 8, batch: 'ZNC-2026-74', mfg: '2025-03-05', exp: '2027-09-05', qty: 620, cost: 52.00 },

    // Dermatological
    { name: 'Betnovate-N Cream 20g', gen: 'Betamethasone Valerate + Neomycin', cat: 'Dermatological', form: 'Ointment', mfr: 'Pristine Health Supplies', price: 62.00, reorder: 40, vIdx: 9, batch: 'BET-2026-21', mfg: '2025-01-25', exp: '2027-01-25', qty: 410, cost: 29.00 },
    { name: 'Candid Cream 30g', gen: 'Clotrimazole Cream 1%', cat: 'Dermatological', form: 'Ointment', mfr: 'Pristine Health Supplies', price: 98.00, reorder: 30, vIdx: 9, batch: 'CND-2026-57', mfg: '2025-03-10', exp: '2027-09-10', qty: 330, cost: 46.00 }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, generic_name, category_id, dosage_form, manufacturer, description, unit_price, reorder_level, vendor_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const insertBatch = db.prepare(`
    INSERT INTO product_batches (product_id, batch_number, manufacture_date, expiry_date, initial_quantity, available_quantity, cost_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const productIds = [];
  for (const p of productsList) {
    const catId = catMap[p.cat] || catRows[0].id;
    const vendorId = vendorIds[p.vIdx] || vendorIds[0];
    const pRes = insertProduct.run(p.name, p.gen, catId, p.form, p.mfr, `${p.name} (${p.gen}) - Standard pharmaceutical formulation.`, p.price, p.reorder, vendorId);
    const pId = pRes.lastInsertRowid;
    productIds.push(pId);
    insertBatch.run(pId, p.batch, p.mfg, p.exp, p.qty + 50, p.qty, p.cost);
  }

  console.log('--- Seeding Realistic POS Sales Transactions ---');
  const insertSale = db.prepare(`
    INSERT INTO sales (invoice_number, cashier_id, customer_id, customer_name, customer_phone, subtotal, tax_amount, discount_amount, total_amount, payment_method, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const sampleSales = [
    { inv: 'INV-2026-0901', cashierUserIdx: 0, custIdx: 0, sub: 1250.00, tax: 62.50, disc: 50.00, total: 1262.50, pay: 'Card', ago: '-7 days', items: [[0, 2, 120.00], [5, 4, 32.50], [10, 2, 210.00], [23, 3, 155.00]] },
    { inv: 'INV-2026-0902', cashierUserIdx: 1, custIdx: 1, sub: 890.00, tax: 44.50, disc: 0.00, total: 934.50, pay: 'UPI', ago: '-6 days', items: [[3, 2, 215.00], [15, 2, 145.00], [28, 1, 132.00]] },
    { inv: 'INV-2026-0903', cashierUserIdx: 0, custIdx: 2, sub: 2150.00, tax: 107.50, disc: 100.00, total: 2157.50, pay: 'Cash', ago: '-5 days', items: [[16, 2, 420.00], [20, 2, 380.00], [1, 2, 185.50], [24, 2, 82.00]] },
    { inv: 'INV-2026-0904', cashierUserIdx: 2, custIdx: 3, sub: 640.00, tax: 32.00, disc: 20.00, total: 652.00, pay: 'UPI', ago: '-4 days', items: [[5, 6, 32.50], [27, 4, 54.00], [30, 2, 62.00]] },
    { inv: 'INV-2026-0905', cashierUserIdx: 1, custIdx: 4, sub: 3420.00, tax: 171.00, disc: 150.00, total: 3441.00, pay: 'Insurance', ago: '-3 days', items: [[18, 4, 290.00], [17, 4, 340.00], [10, 4, 210.00]] },
    { inv: 'INV-2026-0906', cashierUserIdx: 0, custIdx: 5, sub: 980.00, tax: 49.00, disc: 0.00, total: 1029.00, pay: 'Cash', ago: '-2 days', items: [[11, 4, 135.00], [22, 2, 195.00], [6, 1, 45.00]] },
    { inv: 'INV-2026-0907', cashierUserIdx: 2, custIdx: 6, sub: 1520.00, tax: 76.00, disc: 50.00, total: 1546.00, pay: 'Card', ago: '-1 days', items: [[0, 4, 120.00], [3, 2, 215.00], [29, 3, 110.00], [31, 2, 98.00]] },
    { inv: 'INV-2026-0908', cashierUserIdx: 0, custIdx: 7, sub: 460.00, tax: 23.00, disc: 0.00, total: 483.00, pay: 'UPI', ago: '-4 hours', items: [[5, 4, 32.50], [27, 2, 54.00], [21, 1, 118.00]] }
  ];

  for (const s of sampleSales) {
    const cUser = cashierUserIds[s.cashierUserIdx];
    const cust = customersData[s.custIdx];
    const sRes = insertSale.run(s.inv, cUser, customerIds[s.custIdx], cust.name, cust.phone, s.sub, s.tax, s.disc, s.total, s.pay, 'Validated POS transaction at billing counter.', s.ago);
    const saleId = sRes.lastInsertRowid;

    for (const [pIdx, qty, uPrice] of s.items) {
      const pId = productIds[pIdx];
      // get batch for product
      const batch = db.prepare(`SELECT id FROM product_batches WHERE product_id = ? LIMIT 1`).get(pId);
      if (batch) {
        insertSaleItem.run(saleId, pId, batch.id, qty, uPrice, qty * uPrice);
      }
    }
  }

  console.log('--- Seeding Medical Representative Quota Targets & Performance ---');
  // Monthly quota for September 2026
  // Rep 1 (Ravi): Target ₹10,00,000, Actual ₹11,00,000 (110% Achieved)
  // Rep 2 (Kumar): Target ₹10,00,000, Actual ₹8,00,000 (80% Needs Improvement)
  // Rep 3 (Priya): Target ₹9,00,000, Actual ₹8,55,000 (95% Near Target)
  // Rep 4 (Amitabh): Target ₹12,00,000, Actual ₹13,20,000 (110% Target Achieved)
  // Rep 5 (Sunil): Target ₹8,00,000, Actual ₹5,20,000 (65% Below Target)
  // And targets for other reps...
  const insertTarget = db.prepare(`
    INSERT INTO sales_targets (rep_id, target_amount, period_name, start_date, end_date, target_type, territory, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now', '-25 days'))
  `);

  const repTargets = [
    { repIdx: 0, target: 1000000.00, actual: 1100000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'South Delhi & Noida' },
    { repIdx: 1, target: 1000000.00, actual: 800000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Gurugram & Faridabad' },
    { repIdx: 2, target: 900000.00, actual: 855000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'North Delhi & Rohtak' },
    { repIdx: 3, target: 1200000.00, actual: 1320000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'South Mumbai & Colaba' },
    { repIdx: 4, target: 800000.00, actual: 520000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Western Suburbs, Mumbai' },
    { repIdx: 5, target: 950000.00, actual: 980000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Pune Metropolitan' },
    { repIdx: 6, target: 850000.00, actual: 810000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Ahmedabad & Vadodara' },
    { repIdx: 7, target: 750000.00, actual: 510000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Jaipur & Ajmer' },
    { repIdx: 8, target: 1100000.00, actual: 1210000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Bengaluru Central' },
    { repIdx: 9, target: 900000.00, actual: 880000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Bengaluru South' },
    { repIdx: 10, target: 1000000.00, actual: 720000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Chennai Central' },
    { repIdx: 11, target: 1050000.00, actual: 1120000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Hyderabad & Secunderabad' },
    { repIdx: 12, target: 800000.00, actual: 780000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Kolkata Metropolitan' },
    { repIdx: 13, target: 700000.00, actual: 650000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Kochi & Ernakulam' },
    { repIdx: 14, target: 600000.00, actual: 420000.00, period: 'September 2026', start: '2026-09-01', end: '2026-09-30', terr: 'Bhubaneswar & Cuttack' }
  ];

  for (const t of repTargets) {
    insertTarget.run(repIds[t.repIdx], t.target, t.period, t.start, t.end, 'Monthly Sales Quota', t.terr, adminId);
  }

  console.log('--- Seeding Sales Activities (Doctor Visits by Reps) ---');
  const insertActivity = db.prepare(`
    INSERT INTO sales_activities (rep_id, doctor_id, visit_date, location, product_id, promoted_value, notes, follow_up_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const activitiesData = [
    { repIdx: 0, docIdx: 0, date: '2026-09-02', loc: 'Apollo Multispeciality, Sarita Vihar', pIdx: 10, val: 350000.00, notes: 'Detailed Atorva 20mg efficacy in post-MI patients. Doctor requested 50 sample strips.', follow: '2026-09-16', st: 'completed', ago: '-6 days' },
    { repIdx: 0, docIdx: 1, date: '2026-09-04', loc: 'Fortis Memorial, Sector 44, Gurugram', pIdx: 15, val: 420000.00, notes: 'Presented Glycomet GP clinical trial data. High interest for newly diagnosed T2D.', follow: '2026-09-20', st: 'completed', ago: '-4 days' },
    { repIdx: 0, docIdx: 3, date: '2026-09-06', loc: 'Max Super Speciality, Saket', pIdx: 4, val: 330000.00, notes: 'Promoted Cepexil pediatric syrup formulations and safety profile.', follow: '2026-09-22', st: 'completed', ago: '-2 days' },
    { repIdx: 1, docIdx: 1, date: '2026-09-03', loc: 'Fortis Gurugram OPD 3', pIdx: 11, val: 400000.00, notes: 'Discussed Telma 40mg renal-protective features in hypertensive diabetics.', follow: '2026-09-17', st: 'completed', ago: '-5 days' },
    { repIdx: 1, docIdx: 6, date: '2026-09-05', loc: 'Medanta Hospital Medicity, Gurugram', pIdx: 23, val: 400000.00, notes: 'Introduced Pan 40mg fast-dissolving tablets for GERD patients.', follow: '2026-09-19', st: 'completed', ago: '-3 days' },
    { repIdx: 2, docIdx: 8, date: '2026-09-04', loc: 'Sir Ganga Ram Hospital Ortho Ward', pIdx: 9, val: 450000.00, notes: 'Demonstrated Dynapar AQ injection rapid analgesic onset for acute orthopedic post-op pain.', follow: '2026-09-18', st: 'completed', ago: '-4 days' },
    { repIdx: 3, docIdx: 4, date: '2026-09-05', loc: 'Lilavati Hospital Chest Clinic, Bandra', pIdx: 19, val: 650000.00, notes: 'Presented Asthalin & Budecort dual therapy guidelines for COPD.', follow: '2026-09-25', st: 'completed', ago: '-3 days' },
    { repIdx: 8, docIdx: 2, date: '2026-09-03', loc: 'Manipal Hospital Bengaluru Surgical Unit', pIdx: 7, val: 620000.00, notes: 'Detailed Ultracet for post-surgical analgesia with low GI irritation.', follow: '2026-09-21', st: 'completed', ago: '-5 days' },
    { repIdx: 11, docIdx: 5, date: '2026-09-04', loc: 'Yashoda Hospital Diabetes Wing, Somajiguda', pIdx: 17, val: 580000.00, notes: 'Presented Galvus Met 50/500 glycemic variability suppression data.', follow: '2026-09-24', st: 'completed', ago: '-4 days' }
  ];

  for (const a of activitiesData) {
    insertActivity.run(repIds[a.repIdx], doctorIds[a.docIdx], a.date, a.loc, productIds[a.pIdx], a.val, a.notes, a.follow, a.st, a.ago);
  }

  console.log('--- Seeding Notifications ---');
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, target_role, type, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, datetime('now', ?))
  `);

  insertNotif.run(null, 'ADMIN', 'target_milestone', 'Target Achieved', 'Ravi Teja has achieved 110% of his September 2026 sales quota (₹11,00,000 / ₹10,00,000).', '-1 days');
  insertNotif.run(null, 'MANAGER', 'target_milestone', 'Star Performer Alert', 'Ravi Teja and Amitabh Sen have already exceeded 100% quota for the current period.', '-1 days');
  insertNotif.run(null, 'PHARMACIST', 'low_stock', 'Low Stock Alert', 'Cifran 500mg and Amlong 5mg are below reorder thresholds. Immediate purchase requisition advised.', '-2 days');
  insertNotif.run(null, 'PHARMACIST', 'expiring_product', 'Batch Expiry Warning', 'Batch CPX-2025-04 (Cepexil 250mg) will expire on 2026-10-15. Review stock rotation.', '-3 days');
  insertNotif.run(null, 'CASHIER', 'system_alert', 'Counter System Update', 'POS system synchronized with pharmaceutical inventory batch registry.', '-5 hours');

  console.log('--- Seeding Initial Audit Logs ---');
  logAudit({
    userId: adminId,
    userName: 'Dr. Rajesh Sharma (Admin)',
    userRole: 'ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    module: 'CORE_SYSTEM',
    recordId: 'INIT-01',
    ipAddress: '127.0.0.1',
    previousValue: null,
    newValue: 'Initial schema and enterprise seed parameters created successfully'
  });

  logAudit({
    userId: adminId,
    userName: 'Dr. Rajesh Sharma (Admin)',
    userRole: 'ADMIN',
    action: 'TARGET_ASSIGNMENT',
    module: 'TARGET_MANAGEMENT',
    recordId: 'TGT-SEP-2026',
    ipAddress: '192.168.1.10',
    previousValue: null,
    newValue: 'Assigned September 2026 sales target of ₹10,00,000 to Ravi Teja (Territory: South Delhi)'
  });

  console.log('--- Seeding Completed Successfully! ---');
  console.log('Summary of Seed Data:');
  console.log(' - Admin: 1 (admin@example.com)');
  console.log(' - Managers: 2 (manager@example.com, manager2@example.com)');
  console.log(' - Pharmacists: 5 (pharmacist@example.com, pharmacist2@example.com, etc.)');
  console.log(' - Cashiers: 3 (cashier@example.com, cashier2@example.com, cashier3@example.com)');
  console.log(' - Vendors: 10 (vendor@example.com, vendor2@example.com, etc.)');
  console.log(' - Doctors: 10 (doctor@example.com, doctor2@example.com, etc.)');
  console.log(' - Customers: 20 (customer@example.com, customer2@example.com, etc.)');
  console.log(' - Medical Representatives: 15 (representative@example.com [Ravi: 110%], representative2@example.com [Kumar: 80%], etc.)');
  console.log(' - Pharmaceutical Products: 32 with active batches, expiries, prices, and stock levels');
  console.log(' - POS Sales Invoices: 8 detailed billing transactions');
  console.log(' - Monthly Sales Targets: 15 representative quotas');
  console.log(' - Sales Activities: 9 logged doctor visits');
  console.log(' - Standard Demo Password for all accounts: Password@123');
}

// Execute directly if run via node
if (process.argv[1]?.endsWith('seedDatabase.js')) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
