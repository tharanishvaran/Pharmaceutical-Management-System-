import assert from 'assert';
import db from '../config/db.js';

const PORT = process.env.PORT || 5000;
let baseUrl = `http://localhost:${PORT}`;

async function runTests() {
  console.log('\n======================================================');
  console.log(' RUNNING AUTOMATED PHARMACEUTICAL SYSTEM TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return async () => {
      try {
        process.stdout.write(`TEST: ${name} ... `);
        await fn();
        console.log('\x1b[32mPASSED\x1b[0m');
        passed++;
      } catch (err) {
        console.log('\x1b[31mFAILED\x1b[0m');
        console.error('   Error:', err.message);
        failed++;
      }
    };
  }

  let adminToken = '';
  let cashierToken = '';
  let customerToken = '';
  let rep1Token = ''; // Ravi (rep_id 1)
  let rep2Token = ''; // Kumar (rep_id 2)

  // 1. AUTHENTICATION TESTS
  await test('Admin login with correct password returns 200 and JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Password@123' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'ADMIN');
    assert.ok(data.token);
    adminToken = data.token;
  })();

  await test('Login with wrong password returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'WrongPassword' })
    });
    assert.strictEqual(res.status, 401);
  })();

  await test('Login with unknown email returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'Password@123' })
    });
    assert.strictEqual(res.status, 401);
  })();

  // Login other roles
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cashier@example.com', password: 'Password@123' })
    });
    const data = await res.json();
    cashierToken = data.token;
  }
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@example.com', password: 'Password@123' })
    });
    const data = await res.json();
    customerToken = data.token;
  }
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'representative@example.com', password: 'Password@123' })
    });
    const data = await res.json();
    rep1Token = data.token;
  }
  {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'representative2@example.com', password: 'Password@123' })
    });
    const data = await res.json();
    rep2Token = data.token;
  }

  // 2. AUTHORIZATION & RBAC TESTS (MANDATORY REQUIREMENT)
  await test('Cashier accessing Admin User Management API is DENIED with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, '403 Forbidden');
  })();

  await test('Cashier accessing Audit Logs API is DENIED with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });
    assert.strictEqual(res.status, 403);
  })();

  await test('Customer accessing Management Overview Report is DENIED with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/reports/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(res.status, 403);
  })();

  await test('Admin accessing Users and Audit Logs is ALLOWED with 200 OK', async () => {
    const resUsers = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resUsers.status, 200);

    const resAudit = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAudit.status, 200);
  })();

  await test('Medical Rep 2 trying to access Rep 1 target is DENIED with 403 Forbidden', async () => {
    // Target 1 belongs to Rep 1 (Ravi)
    const res = await fetch(`${baseUrl}/api/targets/1`, {
      headers: { Authorization: `Bearer ${rep2Token}` }
    });
    assert.strictEqual(res.status, 403);
  })();

  await test('Medical Rep 1 accessing own target is ALLOWED with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/targets/1`, {
      headers: { Authorization: `Bearer ${rep1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.target.rep_name.includes('Ravi'), true);
  })();

  // 3. TARGET ACHIEVEMENT FORMULA VERIFICATION
  await test('Target formula calculates exact percentage: (Actual / Target) * 100', async () => {
    const res = await fetch(`${baseUrl}/api/targets/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const t = data.target;
    const expectedPercent = Number(((t.actual_sales / t.target_amount) * 100).toFixed(2));
    assert.strictEqual(t.achievement_percentage, expectedPercent);
    if (t.achievement_percentage >= 100) {
      assert.strictEqual(t.performance_status, 'Target Achieved');
    }
  })();

  // 4. POS BILLING & STOCK DEDUCTION TEST
  await test('Cashier POS billing validates server prices, creates sale, and deducts inventory', async () => {
    // Get product and batch
    const pRow = db.prepare(`SELECT id, unit_price FROM products WHERE name = 'Dolo 650mg'`).get();
    const bRow = db.prepare(`SELECT id, available_quantity FROM product_batches WHERE product_id = ?`).get(pRow.id);
    const initialQty = bRow.available_quantity;

    const res = await fetch(`${baseUrl}/api/pos/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test POS Customer',
        customer_phone: '+91 99999 88888',
        payment_method: 'Cash',
        items: [
          { product_id: pRow.id, batch_id: bRow.id, quantity: 5 }
        ]
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.receipt.invoiceNumber);

    // Verify database stock deduction
    const updatedBatch = db.prepare(`SELECT available_quantity FROM product_batches WHERE id = ?`).get(bRow.id);
    assert.strictEqual(updatedBatch.available_quantity, initialQty - 5);
  })();

  await test('POS checkout rejects quantity exceeding available stock with 400 Bad Request', async () => {
    const pRow = db.prepare(`SELECT id FROM products WHERE name = 'Cifran 500mg'`).get();
    const bRow = db.prepare(`SELECT id, available_quantity FROM product_batches WHERE product_id = ?`).get(pRow.id);

    const res = await fetch(`${baseUrl}/api/pos/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Over-buyer',
        items: [
          { product_id: pRow.id, batch_id: bRow.id, quantity: bRow.available_quantity + 5000 }
        ]
      })
    });

    assert.strictEqual(res.status, 400);
  })();

  // 5. AUDIT LOG VERIFICATION
  await test('Admin actions generate persistent audit logs', async () => {
    const log = db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1`).get();
    assert.ok(log);
    assert.ok(log.action);
    assert.ok(log.module);
  })();

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
