import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { TargetVsActualBarChart } from '../common/Charts.jsx';
import { Target, Award, AlertCircle, Users, BarChart3, TrendingUp, CalendarCheck } from 'lucide-react';

export default function ManagerDashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/targets/performance-summary?period=September 2026'),
      api.get('/targets?period=September 2026')
    ]).then(([sumRes, tgtRes]) => {
      if (sumRes.success) setSummary(sumRes.summary);
      if (tgtRes.success) setTargets(tgtRes.targets || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading sales management monitoring dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Regional Sales Management</h1>
          <p className="page-description">
            Medical Representative Quota Monitoring &bull; Target vs Actual Performance &bull; {summary.period}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('targets')}>
            <Target size={16} /> Manage Quotas
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('reports')}>
            <BarChart3 size={16} /> Executive Reports
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Supervised Reps"
          value={summary.totalReps}
          icon={Users}
          trend="Field Representatives"
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Assigned Quota"
          value={`₹${(summary.totalTarget / 100000).toFixed(1)} Lakhs`}
          icon={Target}
          trend={`${summary.period}`}
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
        <StatCard
          title="Actual Promoted Sales"
          value={`₹${(summary.totalActual / 100000).toFixed(1)} Lakhs`}
          icon={TrendingUp}
          trend="Total doctor promotion yield"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Overall Team Achievement"
          value={`${summary.overallAchievement}%`}
          icon={Award}
          trend={summary.overallAchievement >= 100 ? 'Target Achieved' : 'In Progress'}
          color={summary.overallAchievement >= 100 ? '#10b981' : '#f59e0b'}
          bgTint={summary.overallAchievement >= 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
        />
      </div>

      {/* Target vs Actual Comparison Chart */}
      <div style={{ marginBottom: '1.5rem' }}>
        <TargetVsActualBarChart data={targets} title="Representative Quota vs Actual Achievement Comparison" />
      </div>

      {/* Top Performers vs Underperformers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Star Performers (>= 100%) */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', color: '#10b981' }}>Top Performers (&ge; 100% Quota)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {summary.topPerformers.length > 0 ? (
              summary.topPerformers.map(rep => (
                <div
                  key={rep.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {rep.rep_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Territory: {rep.territory}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                      {rep.achievement_percentage}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ₹{(rep.actual_sales / 100000).toFixed(1)}L / ₹{(rep.target_amount / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No reps have exceeded quota yet.</div>
            )}
          </div>
        </div>

        {/* Needs Improvement (< 75%) */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={20} color="#ef4444" />
            <h3 style={{ fontSize: '1.05rem', color: '#f87171' }}>Underperformers (&lt; 75% Quota)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {summary.underperformers.length > 0 ? (
              summary.underperformers.map(rep => (
                <div
                  key={rep.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {rep.rep_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Territory: {rep.territory}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#f87171', fontSize: '1rem' }}>
                      {rep.achievement_percentage}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ₹{(rep.actual_sales / 100000).toFixed(1)}L / ₹{(rep.target_amount / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>All reps are above 75% threshold!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
