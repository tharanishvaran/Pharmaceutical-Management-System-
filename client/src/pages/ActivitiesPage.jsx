import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { CalendarCheck, Plus, Stethoscope, MapPin, Pill } from 'lucide-react';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [activities, setActivities] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    location: '',
    product_id: '',
    promoted_value: 300000,
    notes: '',
    follow_up_date: '',
    status: 'completed'
  });

  const canLog = user?.role === 'MEDICAL_REPRESENTATIVE' || user?.role === 'ADMIN';

  const fetchActivities = () => {
    setLoading(true);
    api.get('/activities?limit=100')
      .then(res => {
        if (res.success) setActivities(res.activities || []);
      })
      .catch(err => error(err.message || 'Failed to fetch field visits'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivities();
    api.get('/doctors').then(r => { if (r.success) setDoctors(r.doctors || []); });
    api.get('/products?limit=100').then(r => { if (r.success) setProducts(r.products || []); });
  }, []);

  const handleLogVisit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/activities', formData);
      if (res.success) {
        success('Doctor field visit activity logged successfully');
        setIsAddOpen(false);
        fetchActivities();
      }
    } catch (err) {
      error(err.message || 'Failed to log visit');
    }
  };

  const columns = [
    {
      header: 'Representative',
      accessor: 'rep_name',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600 }}>{a.rep_name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{a.rep_territory}</div>
        </div>
      )
    },
    {
      header: 'Doctor / Clinic Visited',
      accessor: 'doctor_name',
      render: (a) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.doctor_name}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{a.hospital_clinic}</div>
        </div>
      )
    },
    {
      header: 'Location / Ward',
      accessor: 'location'
    },
    {
      header: 'Product Promoted',
      accessor: 'product_name',
      render: (a) => <span style={{ color: '#10b981', fontWeight: 600 }}>{a.product_name || 'General Formulary'}</span>
    },
    {
      header: 'Promoted Yield',
      accessor: 'promoted_value',
      render: (a) => <strong style={{ color: 'var(--text-main)' }}>₹{Number(a.promoted_value).toLocaleString()}</strong>
    },
    {
      header: 'Visit Date',
      accessor: 'visit_date'
    },
    {
      header: 'Follow-up Date',
      accessor: 'follow_up_date',
      render: (a) => a.follow_up_date || '—'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (a) => <Badge label={a.status} type="success" />
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Field Visit Activities</h1>
          <p className="page-description">
            Medical representative detailing logs &bull; Doctor engagements &bull; Territory promotions
          </p>
        </div>
        {canLog && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> Log Field Visit
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={activities}
        searchPlaceholder="Search visits by doctor, rep, hospital, or product..."
        emptyMessage="No doctor visits recorded yet."
      />

      {/* Log Visit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Log Doctor Detailing & Promotion Visit"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleLogVisit}>Save Visit Activity</button>
          </>
        )}
      >
        <form onSubmit={handleLogVisit}>
          <div className="form-group">
            <label className="form-label">Doctor / Physician *</label>
            <select
              className="form-select"
              required
              value={formData.doctor_id}
              onChange={(e) => {
                const doc = doctors.find(d => String(d.id) === e.target.value);
                setFormData({
                  ...formData,
                  doctor_id: e.target.value,
                  location: doc ? `${doc.hospital_clinic}, ${doc.address.slice(0, 20)}` : formData.location
                });
              }}
            >
              <option value="">Select Healthcare Professional</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization} - {d.hospital_clinic})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Visit Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location / Clinic Detail *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="OPD Clinic 3, Ground Floor"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Promoted</label>
              <select
                className="form-select"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              >
                <option value="">Select Product Line</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.dosage_form})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Promoted / Expected Yield (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="300000"
                value={formData.promoted_value}
                onChange={(e) => setFormData({ ...formData, promoted_value: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes & Discussion Points</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Doctor expressed interest in efficacy data for post-MI patients. Requested 20 sample strips."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
