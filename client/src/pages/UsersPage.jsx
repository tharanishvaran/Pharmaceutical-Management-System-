import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { UserPlus, Edit2, Power, Eye, Shield } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'MEDICAL_REPRESENTATIVE',
    roleSpecificData: {}
  });

  const fetchUsers = () => {
    setLoading(true);
    let url = `/users?limit=100`;
    if (selectedRole !== 'ALL') url += `&role=${selectedRole}`;
    if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;

    api.get(url)
      .then(res => {
        if (res.success) setUsers(res.users || []);
      })
      .catch(err => error(err.message || 'Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    api.get('/users/roles').then(r => {
      if (r.success) setRoles(r.roles || []);
    }).catch(() => {});
  }, [selectedRole, selectedStatus]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', formData);
      if (res.success) {
        success('User created successfully');
        setIsAddOpen(false);
        setFormData({ name: '', email: '', password: '', phone: '', role: 'MEDICAL_REPRESENTATIVE', roleSpecificData: {} });
        fetchUsers();
      }
    } catch (err) {
      error(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    try {
      const res = await api.put(`/users/${activeUser.id}`, {
        name: activeUser.name,
        phone: activeUser.phone,
        role: activeUser.role,
        status: activeUser.status
      });
      if (res.success) {
        success('User updated successfully');
        setIsEditOpen(false);
        fetchUsers();
      }
    } catch (err) {
      error(err.message || 'Failed to update user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/users/${user.id}/status`, {});
      if (res.success) {
        success(res.message);
        fetchUsers();
      }
    } catch (err) {
      error(err.message || 'Failed to update user status');
    }
  };

  const columns = [
    {
      header: 'User ID',
      accessor: 'id',
      width: '80px',
      render: (u) => <code style={{ color: '#38bdf8' }}>#{u.id}</code>
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{u.email}</div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (u) => <Badge label={u.role.replace('_', ' ')} type="info" />
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (u) => u.phone || '—'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (u) => <Badge label={u.status} type={u.status === 'active' ? 'active' : 'inactive'} />
    },
    {
      header: 'Created Date',
      accessor: 'created_at',
      render: (u) => new Date(u.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      width: '160px',
      align: 'right',
      render: (u) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          {currentUser.role === 'ADMIN' && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                title="Edit User"
                onClick={() => {
                  setActiveUser({ ...u });
                  setIsEditOpen(true);
                }}
              >
                <Edit2 size={14} />
              </button>
              <button
                className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                disabled={u.id === currentUser.id}
                onClick={() => handleToggleStatus(u)}
              >
                <Power size={14} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization User Management</h1>
          <p className="page-description">
            Admin console &bull; Manage user accounts, role-based authorization, and account states
          </p>
        </div>
        {currentUser.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <UserPlus size={16} /> Add New User
          </button>
        )}
      </div>

      {/* Role and Status Filters */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter Role:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users by name, email, or phone..."
        emptyMessage="No users matching the criteria found."
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Organization User"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateUser}>Create User</button>
          </>
        )}
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Alok Nath"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input
                type="password"
                required
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password@123"
              />
            </div>
          </div>

          {/* Role specific input helpers */}
          {formData.role === 'MEDICAL_REPRESENTATIVE' && (
            <div className="form-group">
              <label className="form-label">Territory / Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. South Delhi & Noida"
                onChange={(e) => setFormData({
                  ...formData,
                  roleSpecificData: { ...formData.roleSpecificData, territory: e.target.value }
                })}
              />
            </div>
          )}

          {formData.role === 'PHARMACIST' && (
            <div className="form-group">
              <label className="form-label">Pharmacy License Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PH-IND-2026-9021"
                onChange={(e) => setFormData({
                  ...formData,
                  roleSpecificData: { ...formData.roleSpecificData, license_number: e.target.value }
                })}
              />
            </div>
          )}

          {formData.role === 'CASHIER' && (
            <div className="form-group">
              <label className="form-label">Billing Counter Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Counter-04"
                onChange={(e) => setFormData({
                  ...formData,
                  roleSpecificData: { ...formData.roleSpecificData, counter_number: e.target.value }
                })}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User Profile"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateUser}>Save Changes</button>
          </>
        )}
      >
        {activeUser && (
          <form onSubmit={handleUpdateUser}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={activeUser.name}
                onChange={(e) => setActiveUser({ ...activeUser, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={activeUser.phone || ''}
                onChange={(e) => setActiveUser({ ...activeUser, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={activeUser.role}
                  onChange={(e) => setActiveUser({ ...activeUser, role: e.target.value })}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={activeUser.status}
                  onChange={(e) => setActiveUser({ ...activeUser, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
