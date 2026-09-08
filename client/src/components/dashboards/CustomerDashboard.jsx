import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { User, Pill, ShoppingBag, Search, FileText } from 'lucide-react';

export default function CustomerDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=20'),
      api.get('/pos/transactions?limit=5')
    ]).then(([prodRes, transRes]) => {
      if (prodRes.success) setProducts(prodRes.products || []);
      if (transRes.success) setTransactions(transRes.sales || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.generic_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient & Customer Portal</h1>
          <p className="page-description">
            Welcome, <strong>{user.name}</strong> &bull; Browse approved pharmaceutical products &bull; Access order receipts
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Account Holder"
          value={user.name}
          icon={User}
          trend={user.email}
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Available Formulations"
          value={products.length}
          icon={Pill}
          trend="Certified Active Products"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Cleared Counter Invoices"
          value={transactions.length}
          icon={ShoppingBag}
          trend="Your Dispensing Records"
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
      </div>

      {/* Product Catalog Search */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Available Pharmaceutical Catalog</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lookup indications, forms, and authorized retail prices</p>
          </div>
          <div className="search-bar-container">
            <Search size={16} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Search medicine or active ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.slice(0, 8).map(p => (
            <div
              key={p.id}
              style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{p.name}</span>
                  <Badge label={p.dosage_form} type="info" />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
                  {p.generic_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {p.manufacturer}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Retail Price</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>₹{Number(p.unit_price).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer's Past Invoices */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Your Dispensing Receipts</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Payment Mode</th>
                <th>Total Paid</th>
                <th>Date & Time</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{t.invoice_number}</strong></td>
                    <td><Badge label={t.payment_method} type="info" /></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(t.total_amount).toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('pos')}>
                        <FileText size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                    No purchase history found for your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
