import React from 'react';

// 1. Target vs Actual Bar Chart (Manager & Admin)
export function TargetVsActualBarChart({ data = [], title = 'Sales Quota vs Actual Achievement' }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.target_amount, d.actual_sales)), 100000);

  return (
    <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.slice(0, 6).map((item, idx) => {
          const targetPct = Math.min(100, (item.target_amount / maxValue) * 100);
          const actualPct = Math.min(100, (item.actual_sales / maxValue) * 100);
          const ach = item.target_amount > 0 ? ((item.actual_sales / item.target_amount) * 100).toFixed(0) : 0;

          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.rep_name}</span>
                <span style={{ color: Number(ach) >= 100 ? '#10b981' : Number(ach) >= 90 ? '#38bdf8' : '#f59e0b', fontWeight: 700 }}>
                  ₹{(item.actual_sales / 100000).toFixed(1)}L / ₹{(item.target_amount / 100000).toFixed(1)}L ({ach}%)
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                {/* Target marker */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${targetPct}%`, background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
                {/* Actual bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${actualPct}%`, background: Number(ach) >= 100 ? '#10b981' : Number(ach) >= 90 ? '#38bdf8' : '#f59e0b', borderRadius: '4px' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }} /> Achieved &ge; 100%
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '2px' }} /> Near Target (90-99%)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} /> Under Target (&lt; 90%)
        </div>
      </div>
    </div>
  );
}

// 2. Role Distribution Breakdown
export function RoleDistributionChart({ roles = [] }) {
  const total = roles.reduce((sum, r) => sum + r.count, 0) || 1;
  const colors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#f97316'];

  return (
    <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>Organizational User Distribution</h3>
      {/* Visual Stacked Bar */}
      <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        {roles.map((r, idx) => (
          <div
            key={idx}
            style={{
              width: `${(r.count / total) * 100}%`,
              background: colors[idx % colors.length]
            }}
            title={`${r.role}: ${r.count}`}
          />
        ))}
      </div>
      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
        {roles.map((r, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[idx % colors.length] }} />
              <span style={{ color: 'var(--text-muted)' }}>{r.role.replace('_', ' ')}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Simple Timeline Revenue Line Chart (SVG based)
export function SalesTimelineChart({ timeline = [] }) {
  if (timeline.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No recent sales transactions.
      </div>
    );
  }

  const maxVal = Math.max(...timeline.map(t => Number(t.daily_revenue || 0)), 500);

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>POS Daily Sales Trend</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '0.75rem', paddingTop: '1rem' }}>
        {timeline.slice(0, 10).reverse().map((day, idx) => {
          const heightPct = Math.max(10, Math.min(100, (day.daily_revenue / maxVal) * 100));
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>
                ₹{(day.daily_revenue / 1000).toFixed(1)}k
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: 'var(--primary-gradient)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease'
                }}
              />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem', whiteSpace: 'nowrap' }}>
                {day.sale_date?.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
