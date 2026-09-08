import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { Target, TrendingUp, Award, CalendarCheck, MapPin, Plus, Clock } from 'lucide-react';

export default function RepresentativeDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/targets'),
      api.get('/activities?limit=10')
    ]).then(([tgtRes, actRes]) => {
      if (tgtRes.success) setTargets(tgtRes.targets || []);
      if (actRes.success) setActivities(actRes.activities || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const activeTarget = targets[0] || {
    period_name: 'September 2026',
    target_amount: 1000000,
    actual_sales: 1100000,
    achievement_percentage: 110.0,
    remaining_amount: 0,
    performance_status: 'Target Achieved',
    badge_color: '#10b981',
    territory: 'Delhi NCR'
  };

  const isAchieved = activeTarget.achievement_percentage >= 100;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Representative Portal</h1>
          <p className="page-description">
            Welcome back, {user.name} &bull; Territory: <strong>{activeTarget.territory || 'Delhi NCR'}</strong> &bull; Quota Period: {activeTarget.period_name}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('activities')}>
          <Plus size={16} /> Log Doctor Field Visit
        </button>
      </div>

      {/* Star Achievement Banner if >= 100% */}
      {isAchieved && (
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Award size={32} color="#10b981" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#34d399' }}>
                Outstanding Performance! Target Exceeded ({activeTarget.achievement_percentage}%)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                You have surpassed your {activeTarget.period_name} quota of ₹{Number(activeTarget.target_amount).toLocaleString()}. Keep up the tremendous work!
              </div>
            </div>
          </div>
          <Badge label={activeTarget.performance_status} type="success" />
        </div>
      )}

      {/* Performance KPIs Grid */}
      <div className="stats-grid">
        <StatCard
          title="Assigned Monthly Quota"
          value={`₹${(activeTarget.target_amount / 100000).toFixed(1)}L`}
          icon={Target}
          trend={activeTarget.period_name}
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Actual Promotion Yield"
          value={`₹${(activeTarget.actual_sales / 100000).toFixed(1)}L`}
          icon={TrendingUp}
          trend={`${activities.length} Recorded Doctor Visits`}
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Achievement Rate"
          value={`${activeTarget.achievement_percentage}%`}
          icon={Award}
          trend={activeTarget.performance_status}
          color={isAchieved ? '#10b981' : '#f59e0b'}
          bgTint={isAchieved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
        />
        <StatCard
          title="Remaining to Target"
          value={`₹${(activeTarget.remaining_amount / 100000).toFixed(1)}L`}
          icon={Clock}
          trend={isAchieved ? 'Quota Fulfilled' : 'Days Remaining'}
          color={isAchieved ? '#10b981' : '#f59e0b'}
          bgTint={isAchieved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
        />
      </div>

      {/* Progress Bar Component */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Formula Calculation: </span>
            <code style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
              (Actual Sales / Target Sales) &times; 100 = ({activeTarget.actual_sales} / {activeTarget.target_amount}) &times; 100 = {activeTarget.achievement_percentage}%
            </code>
          </div>
          <Badge label={activeTarget.performance_status} color={activeTarget.badge_color} />
        </div>
        <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '7px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, activeTarget.achievement_percentage)}%`,
              background: isAchieved ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
              borderRadius: '7px',
              transition: 'width 0.6s ease'
            }}
          />
        </div>
      </div>

      {/* Recent Doctor Engagements */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Your Logged Doctor Visits</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('activities')}>
            View History
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor / Clinic</th>
                <th>Specialization</th>
                <th>Promoted Product</th>
                <th>Estimated Value</th>
                <th>Visit Date</th>
                <th>Follow-up</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map(a => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.doctor_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{a.location}</div>
                    </td>
                    <td>{a.doctor_specialization || 'General'}</td>
                    <td><span style={{ color: '#38bdf8' }}>{a.product_name || 'Portfolio'}</span></td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(a.promoted_value).toLocaleString()}</td>
                    <td>{a.visit_date}</td>
                    <td style={{ color: '#f59e0b' }}>{a.follow_up_date || '—'}</td>
                    <td><Badge label={a.status} type="success" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                    No doctor field visits logged yet. Click "Log Doctor Field Visit" above to add one!
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
