import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { TargetVsActualBarChart, RoleDistributionChart, SalesTimelineChart } from '../common/Charts.jsx';
import {
  Users,
  Pill,
  ShoppingCart,
  Target,
  Building2,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repTargets, setRepTargets] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/reports/overview'),
      api.get('/targets?period=September 2026')
    ]).then(([overviewRes, targetsRes]) => {
      if (overviewRes.success) setData(overviewRes);
      if (targetsRes.success) setRepTargets(targetsRes.targets || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading enterprise management dashboard...
      </div>
    );
  }

  const { stats, usersByRole, recentActivities, recentSales } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Command Center</h1>
          <p className="page-description">
            Organization-wide consolidated overview &bull; Role permissions, quotas, inventory & billing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('audit')}>
            <ShieldCheck size={16} /> Audit Trail
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('reports')}>
            <TrendingUp size={16} /> Full Reports
          </button>
        </div>
      </div>

      {/* Inventory & Quota Warning Banners */}
      {(stats.lowStockCount > 0 || stats.expiringCount > 0) && (
        <div
          className="glass-card"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            borderLeft: '4px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="#f59e0b" />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Inventory Watchlist: </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {stats.lowStockCount} medicines below reorder level &bull; {stats.expiringCount} batches expiring within 90 days.
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>
            Inspect Inventory
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={`${stats.totalReps} Reps, ${stats.totalPharmacists} Pharm, ${stats.totalCashiers} Cashiers`}
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Pharmaceutical Products"
          value={stats.totalProducts}
          icon={Pill}
          trend={`${stats.totalVendors} Active Vendors`}
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Total POS Sales"
          value={`₹${(stats.totalSalesRevenue || 0).toLocaleString()}`}
          icon={ShoppingCart}
          trend={`${stats.totalInvoices} Invoices cleared`}
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
        <StatCard
          title="Overall Quota Achievement"
          value={`${stats.orgTargetAchievement}%`}
          icon={Target}
          trend={`₹${((stats.totalPromotedAmount || 0)/100000).toFixed(1)}L / ₹${((stats.totalTargetAmount || 0)/100000).toFixed(1)}L`}
          color="#f59e0b"
          bgTint="rgba(245, 158, 11, 0.15)"
        />
      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <TargetVsActualBarChart data={repTargets} title="Field Rep Quotas vs Actuals (Sep 2026)" />
        <RoleDistributionChart roles={usersByRole} />
      </div>

      {/* Secondary Tables: Recent Sales & Doctor Visits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Field Activities */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Recent Doctor Field Visits</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('activities')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivities.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.doctor_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Rep: {a.rep_name} &bull; Promoted: {a.product_name || 'Multi-product'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                    ₹{Number(a.promoted_value || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                    {a.visit_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent POS Sales Invoices */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Recent POS Sales Transactions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('pos')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentSales.map(s => (
              <div
                key={s.id}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.invoice_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Customer: {s.customer_name} &bull; Cashier: {s.cashier_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>
                    ₹{Number(s.total_amount).toFixed(2)}
                  </div>
                  <Badge label={s.payment_method} type="info" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
