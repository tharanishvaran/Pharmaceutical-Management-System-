import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { Target, Plus, Award, AlertCircle, TrendingUp } from 'lucide-react';

export default function TargetsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [targets, setTargets] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    rep_id: '',
    target_amount: 1000000,
    period_name: 'September 2026',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    territory: 'Delhi NCR'
  });

  const canAssign = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchTargets = () => {
    setLoading(true);
    api.get('/targets?period=September 2026')
      .then(res => {
        if (res.success) setTargets(res.targets || []);
      })
      .catch(err => error(err.message || 'Failed to fetch targets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTargets();
    if (canAssign) {
      api.get('/users?role=MEDICAL_REPRESENTATIVE&limit=50').then(r => {
        if (r.success) {
          // get reps profiles
          api.get('/reports/representatives?period=September 2026').then(rr => {
            if (rr.success) setReps(rr.report || []);
          });
        }
      });
    }
  }, []);

  const handleAssignTarget = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/targets', formData);
      if (res.success) {
        success('Sales target assigned successfully');
        setIsAddOpen(false);
        fetchTargets();
      }
    } catch (err) {
      error(err.message || 'Failed to assign target');
    }
  };

  const columns = [
    {
      header: 'Representative',
      accessor: 'rep_name',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.rep_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Territory: {t.rep_territory || t.territory}</div>
        </div>
      )
    },
    {
      header: 'Quota Period',
      accessor: 'period_name'
    },
    {
      header: 'Target Amount',
      accessor: 'target_amount',
      render: (t) => <strong style={{ color: 'var(--text-main)' }}>₹{Number(t.target_amount).toLocaleString()}</strong>
    },
    {
      header: 'Actual Achieved',
      accessor: 'actual_sales',
      render: (t) => <strong style={{ color: '#10b981' }}>₹{Number(t.actual_sales).toLocaleString()}</strong>
    },
    {
      header: 'Remaining',
      accessor: 'remaining_amount',
      render: (t) => (
        <span style={{ color: t.remaining_amount === 0 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
          {t.remaining_amount === 0 ? 'Completed' : `₹${Number(t.remaining_amount).toLocaleString()}`}
        </span>
      )
    },
    {
      header: 'Achievement %',
      accessor: 'achievement_percentage',
      render: (t) => {
        const isExceeded = t.achievement_percentage >= 100;
        return (
          <div style={{ minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
              <span style={{ color: isExceeded ? '#10b981' : '#38bdf8' }}>{t.achievement_percentage}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, t.achievement_percentage)}%`,
                  background: isExceeded ? '#10b981' : '#0284c7',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Performance Rating',
      accessor: 'performance_status',
      render: (t) => <Badge label={t.performance_status} color={t.badge_color} />
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Target & Quota Management</h1>
          <p className="page-description">
            Formula: <code>Achievement % = (Actual Sales / Target Sales) &times; 100</code> &bull; Configurable Rating Tiers
          </p>
        </div>
        {canAssign && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> Assign Sales Quota
          </button>
        )}
      </div>

      {/* Configurable Rating Tiers Banner */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Configured Performance Tiers:</span>
        <Badge label="&ge; 100% : Target Achieved" type="success" />
        <Badge label="90–99% : Near Target" type="info" />
        <Badge label="75–89% : Needs Improvement" type="warning" />
        <Badge label="< 75% : Below Target" type="danger" />
      </div>

      <DataTable
        columns={columns}
        data={targets}
        searchPlaceholder="Search representatives by name or territory..."
        emptyMessage="No targets found for this period."
      />

      {/* Assign Target Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Assign Medical Representative Quota"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssignTarget}>Assign Target</button>
          </>
        )}
      >
        <form onSubmit={handleAssignTarget}>
          <div className="form-group">
            <label className="form-label">Medical Representative *</label>
            <select
              className="form-select"
              required
              value={formData.rep_id}
              onChange={(e) => setFormData({ ...formData, rep_id: e.target.value })}
            >
              <option value="">Select Field Representative</option>
              {reps.map(r => (
                <option key={r.rep_id} value={r.rep_id}>
                  {r.rep_name} ({r.territory})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Amount (₹) *</label>
              <input
                type="number"
                required
                className="form-input"
                placeholder="1000000"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Period Label *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="September 2026"
                value={formData.period_name}
                onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
