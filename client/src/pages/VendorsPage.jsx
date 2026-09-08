import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { Building2, Plus, Phone, Mail, MapPin } from 'lucide-react';

export default function VendorsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: ''
  });

  const canAdd = user?.role === 'ADMIN';

  const fetchVendors = () => {
    setLoading(true);
    api.get('/vendors')
      .then(res => {
        if (res.success) setVendors(res.vendors || []);
      })
      .catch(err => error(err.message || 'Failed to fetch vendors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/vendors', formData);
      if (res.success) {
        success('Vendor supplier registered successfully');
        setIsAddOpen(false);
        setFormData({ company_name: '', contact_person: '', email: '', phone: '', address: '', tax_id: '' });
        fetchVendors();
      }
    } catch (err) {
      error(err.message || 'Failed to create vendor');
    }
  };

  const columns = [
    {
      header: 'Company / Supplier',
      accessor: 'company_name',
      render: (v) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{v.company_name}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>GSTIN: {v.tax_id || 'Registered'}</div>
        </div>
      )
    },
    {
      header: 'Contact Person',
      accessor: 'contact_person'
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
      header: 'Facility Address',
      accessor: 'address',
      render: (v) => (
        <div style={{ maxWidth: '280px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {v.address}
        </div>
      )
    },
    {
      header: 'Supplied Lines',
      accessor: 'products_supplied_count',
      render: (v) => <span style={{ fontWeight: 700, color: '#10b981' }}>{v.products_supplied_count || 0} items</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (v) => <Badge label={v.status} type={v.status === 'active' ? 'active' : 'inactive'} />
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor & Supplier Management</h1>
          <p className="page-description">
            Active pharmaceutical raw material and formulation suppliers &bull; Supply contracts
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> Register Vendor
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        searchPlaceholder="Search vendors by company, contact, or email..."
        emptyMessage="No vendors found."
      />

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Pharmaceutical Vendor"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateVendor}>Register Vendor</button>
          </>
        )}
      >
        <form onSubmit={handleCreateVendor}>
          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Zenith Pharma Formulations"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Harish Mehta"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax ID / GSTIN</label>
              <input
                type="text"
                className="form-input"
                placeholder="GSTIN27AAACD4455G1Z2"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="contact@zenithpharma.com"
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
                placeholder="+91 98555 11005"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Facility / Operating Address *</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              placeholder="Industrial Growth Centre, Phase II"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
