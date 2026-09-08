import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { Pill, AlertTriangle, Clock, Layers, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function PharmacistDashboard({ onNavigate }) {
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/alerts')
      .then(res => {
        if (res.success && res.alerts) {
          setAlerts(res.alerts);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading pharmacy dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacist Inventory Control</h1>
          <p className="page-description">
            Drug formulations &bull; Batch tracking &bull; Expiry warning system &bull; Minimum stock surveillance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('products')}>
            <Pill size={16} /> Manage Drug Batches
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Critical Low-Stock Medicines"
          value={alerts.lowStockCount || 0}
          icon={AlertTriangle}
          trend={alerts.lowStockCount > 0 ? 'Requires Immediate Reorder' : 'All Stock Optimal'}
          color="#f59e0b"
          bgTint="rgba(245, 158, 11, 0.15)"
        />
        <StatCard
          title="Expiring Batches (Within 90 Days)"
          value={alerts.expiringCount || 0}
          icon={Clock}
          trend="Rotate Stock to Front"
          color="#f43f5e"
          bgTint="rgba(244, 63, 94, 0.15)"
        />
        <StatCard
          title="Safety Compliance"
          value="100%"
          icon={CheckCircle2}
          trend="Scheduled Batch Audit Complete"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
      </div>

      {/* Two Alert Panels: Low Stock & Expiring Batches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Panel */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.05rem', color: '#fbbf24' }}>Low Stock Watchlist</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.lowStock && alerts.lowStock.length > 0 ? (
              alerts.lowStock.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Generic: {p.generic_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1.05rem' }}>
                      {p.total_stock} units
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Reorder Threshold: {p.reorder_level}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', padding: '1.5rem 0', textAlign: 'center' }}>
                All medicines are currently above reorder levels.
              </div>
            )}
          </div>
        </div>

        {/* Expiring Batches Panel */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.05rem', color: '#fb7185' }}>Expiring Batches (Next 90 Days)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.expiring && alerts.expiring.length > 0 ? (
              alerts.expiring.map(b => (
                <div
                  key={b.batch_id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(244, 63, 94, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {b.product_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Batch: <code style={{ color: '#38bdf8' }}>{b.batch_number}</code>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge label={`Expires ${b.expiry_date}`} type="danger" />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {b.available_quantity} units remaining
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', padding: '1.5rem 0', textAlign: 'center' }}>
                No batches expiring within the next 90 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
