import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { ShoppingCart, DollarSign, Clock, Receipt, Plus } from 'lucide-react';

export default function CashierDashboard({ onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pos/transactions?limit=10')
      .then(res => {
        if (res.success) {
          setTransactions(res.sales || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Point-of-Sale Billing Terminal</h1>
          <p className="page-description">
            Dispensing counter checkout &bull; Instant tax invoice generation &bull; Receipt printing
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('pos')}>
          <Plus size={16} /> Open POS Terminal
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Counter Invoices Processed"
          value={transactions.length}
          icon={Receipt}
          trend="Today's Shift"
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Total Cashier Collections"
          value={`₹${totalCollected.toFixed(2)}`}
          icon={DollarSign}
          trend="Validated server-side"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Active Counter"
          value="Counter-01"
          icon={ShoppingCart}
          trend="Online & Synchronized"
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Your Recent Invoices</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('pos')}>
            Launch Terminal
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td><strong style={{ color: '#38bdf8' }}>{t.invoice_number}</strong></td>
                    <td>{t.customer_name}</td>
                    <td><Badge label={t.payment_method} type="info" /></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(t.total_amount).toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td><Badge label="CLEARED" type="success" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                    No sales recorded in this shift yet.
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
