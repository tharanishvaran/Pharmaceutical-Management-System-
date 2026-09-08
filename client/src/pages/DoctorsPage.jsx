import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { Stethoscope, Plus, Hospital, Mail, Phone, MapPin } from 'lucide-react';

export default function DoctorsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: 'Cardiologist',
    hospital_clinic: '',
    email: '',
    phone: '',
    address: ''
  });

  const canAdd = user?.role === 'ADMIN';

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/doctors')
      .then(res => {
        if (res.success) setDoctors(res.doctors || []);
      })
      .catch(err => error(err.message || 'Failed to fetch doctors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors', formData);
      if (res.success) {
        success('Doctor registered successfully');
        setIsAddOpen(false);
        setFormData({ name: '', specialization: 'Cardiologist', hospital_clinic: '', email: '', phone: '', address: '' });
        fetchDoctors();
      }
    } catch (err) {
      error(err.message || 'Failed to register doctor');
    }
  };

  const columns = [
    {
      header: 'Doctor Name',
      accessor: 'name',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{d.specialization}</div>
        </div>
      )
    },
    {
      header: 'Hospital / Clinic',
      accessor: 'hospital_clinic',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 600 }}>{d.hospital_clinic}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.address}</div>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Phone',
      accessor: 'phone'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (d) => <Badge label={d.status} type={d.status === 'active' ? 'active' : 'inactive'} />
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor & Clinic Registry</h1>
          <p className="page-description">
            Healthcare professionals engaged by field Medical Representatives &bull; Specialty mapping
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> Register Doctor
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={doctors}
        searchPlaceholder="Search by doctor name, specialty, or hospital..."
        emptyMessage="No doctors found."
      />

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Healthcare Professional"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateDoctor}>Register Doctor</button>
          </>
        )}
      >
        <form onSubmit={handleCreateDoctor}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Doctor Name & Title *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Dr. Tanuja Reddy, MD"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Endocrinologist"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hospital / Medical Center *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Apollo Multispeciality Hospital"
              value={formData.hospital_clinic}
              onChange={(e) => setFormData({ ...formData, hospital_clinic: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="dr.tanuja@apollo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="+91 98666 22006"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinic Location / Street Address *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Somajiguda, Hyderabad, Telangana"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
