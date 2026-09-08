import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ReceiptModal from '../components/common/ReceiptModal.jsx';
import Badge from '../components/common/Badge.jsx';
import { ShoppingCart, Search, Plus, Trash2, Printer, CheckCircle, ArrowRight, User } from 'lucide-react';

export default function PosPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchInitialData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/pos/transactions?limit=20')
    ]).then(([prodRes, transRes]) => {
      if (prodRes.success) setProducts(prodRes.products || []);
      if (transRes.success) setTransactions(transRes.sales || []);
    }).catch(err => error(err.message || 'Failed to load POS data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const addToCart = async (product) => {
    if (product.total_stock <= 0) {
      error(`Cannot add ${product.name}: Out of stock.`);
      return;
    }

    // Fetch batch for product
    try {
      const res = await api.get(`/products/${product.id}`);
      if (!res.success || !res.product.batches || res.product.batches.length === 0) {
        error(`No active batches available for ${product.name}`);
        return;
      }

      // Pick first available batch with stock
      const validBatch = res.product.batches.find(b => b.available_quantity > 0) || res.product.batches[0];

      // Check if already in cart
      const existingIdx = cart.findIndex(c => c.product_id === product.id && c.batch_id === validBatch.id);
      if (existingIdx > -1) {
        const currentQty = cart[existingIdx].quantity;
        if (currentQty >= validBatch.available_quantity) {
          error(`Cannot add more: Batch available limit of ${validBatch.available_quantity} reached.`);
          return;
        }
        const updated = [...cart];
        updated[existingIdx].quantity += 1;
        setCart(updated);
      } else {
        setCart([
          ...cart,
          {
            product_id: product.id,
            product_name: product.name,
            dosage_form: product.dosage_form,
            batch_id: validBatch.id,
            batch_number: validBatch.batch_number,
            available_quantity: validBatch.available_quantity,
            unit_price: product.unit_price,
            quantity: 1
          }
        ]);
      }
    } catch (err) {
      error('Failed to retrieve batch information.');
    }
  };

  const updateCartQty = (idx, delta) => {
    const updated = [...cart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else if (newQty > updated[idx].available_quantity) {
      error(`Stock limit: Only ${updated[idx].available_quantity} units available.`);
      return;
    } else {
      updated[idx].quantity = newQty;
    }
    setCart(updated);
  };

  const removeFromCart = (idx) => {
    const updated = [...cart];
    updated.splice(idx, 1);
    setCart(updated);
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount || 0)));
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number((taxable * 0.05).toFixed(2));
  const total = Number((taxable + tax).toFixed(2));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      error('Cart is empty. Please select products first.');
      return;
    }

    try {
      const payload = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        discount_amount: discount,
        items: cart.map(c => ({
          product_id: c.product_id,
          batch_id: c.batch_id,
          quantity: c.quantity
        }))
      };

      const res = await api.post('/pos/checkout', payload);
      if (res.success && res.receipt) {
        success('Transaction cleared successfully!');
        setActiveReceipt(res.receipt);
        setIsReceiptOpen(true);
        setCart([]);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setDiscountAmount(0);
        fetchInitialData();
      }
    } catch (err) {
      error(err.message || 'Checkout failed.');
    }
  };

  const handleViewReceipt = async (invoiceNumber) => {
    try {
      const res = await api.get(`/pos/transactions/${invoiceNumber}`);
      if (res.success && res.sale) {
        setActiveReceipt({
          invoiceNumber: res.sale.invoice_number,
          customer_name: res.sale.customer_name,
          customer_phone: res.sale.customer_phone,
          subtotal: res.sale.subtotal,
          discount: res.sale.discount_amount,
          taxAmount: res.sale.tax_amount,
          totalAmount: res.sale.total_amount,
          payment_method: res.sale.payment_method,
          created_at: res.sale.created_at,
          items: res.sale.items
        });
        setIsReceiptOpen(true);
      }
    } catch (err) {
      error('Failed to load receipt.');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.generic_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Point of Sale (POS) Terminal</h1>
          <p className="page-description">
            Live catalog stock verification &bull; Subtotal / GST tax calculation &bull; Real-time receipt generator
          </p>
        </div>
      </div>

      <div className="pos-container">
        {/* Left Side: Product Selector Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={18} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Type to search medicine, brand, active ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', paddingRight: '0.25rem' }}>
            {filteredProducts.map(p => {
              const isOut = p.total_stock <= 0;
              return (
                <div
                  key={p.id}
                  className="glass-card"
                  style={{
                    padding: '1rem',
                    cursor: isOut ? 'not-allowed' : 'pointer',
                    opacity: isOut ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)'
                  }}
                  onClick={() => !isOut && addToCart(p)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '0.4rem' }}>{p.generic_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.manufacturer}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>₹{Number(p.unit_price).toFixed(2)}</span>
                    <span style={{ fontSize: '0.72rem', color: isOut ? '#f43f5e' : '#34d399', fontWeight: 600 }}>
                      {isOut ? 'Out of Stock' : `${p.total_stock} in stock`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart & Checkout Summary */}
        <div className="pos-cart-panel">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} color="#38bdf8" /> Order Cart ({cart.length})
            </h3>
          </div>

          <div className="pos-cart-items">
            {cart.length > 0 ? (
              cart.map((item, idx) => (
                <div key={idx} className="pos-cart-item">
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Batch: {item.batch_number} &bull; ₹{Number(item.unit_price).toFixed(2)} ea
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        onClick={() => updateCartQty(idx, -1)}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 0.4rem', fontWeight: 700, fontSize: '0.82rem' }}>{item.quantity}</span>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        onClick={() => updateCartQty(idx, 1)}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem', minWidth: '55px', textAlign: 'right' }}>
                      ₹{(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0.2rem' }}
                      onClick={() => removeFromCart(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <div>Cart is empty. Click any product on the left to add.</div>
              </div>
            )}
          </div>

          <div className="pos-totals-box">
            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>Customer</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>Phone</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  placeholder="+91 99999 88888"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Mode & Discount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>Payment Mode</label>
                <select
                  className="form-select"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="UPI">UPI / QR Pay</option>
                  <option value="Insurance">Insurance TPA</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>Discount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                  <span>Discount:</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>GST (5%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#38bdf8' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Complete Sale & Print Receipt <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={activeReceipt}
      />

      {/* Transaction History Section */}
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Cleared Billing History</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total Paid</th>
                <th>Payment Mode</th>
                <th>Timestamp</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{t.invoice_number}</strong></td>
                  <td>{t.cashier_name}</td>
                  <td>{t.customer_name}</td>
                  <td>₹{Number(t.subtotal).toFixed(2)}</td>
                  <td>₹{Number(t.tax_amount).toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(t.total_amount).toFixed(2)}</td>
                  <td><Badge label={t.payment_method} type="info" /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleViewReceipt(t.invoice_number)}>
                      <Printer size={14} /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
