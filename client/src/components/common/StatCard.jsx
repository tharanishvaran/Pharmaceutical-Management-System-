import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = '#0284c7',
  bgTint = 'rgba(2, 132, 199, 0.12)'
}) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-icon-wrapper" style={{ background: bgTint, color: color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {trend && (
          <div className="stat-trend" style={{ color: trend.startsWith('+') ? '#10b981' : '#f59e0b' }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
