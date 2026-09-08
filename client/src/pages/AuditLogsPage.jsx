import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Badge from '../components/common/Badge.jsx';
import { ShieldAlert, Filter, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    let url = `/audit?limit=100`;
    if (selectedModule !== 'ALL') url += `&module=${selectedModule}`;

    api.get(url)
      .then(res => {
        if (res.success) setLogs(res.logs || []);
      })
      .catch(err => error(err.message || 'Failed to fetch audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    api.get('/audit/modules').then(r => {
      if (r.success) setModules(r.modules || []);
    }).catch(() => {});
  }, [selectedModule]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'created_at',
      width: '170px',
      render: (l) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {new Date(l.created_at).toLocaleString()}
        </span>
      )
    },
    {
      header: 'User',
      accessor: 'user_name',
      render: (l) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{l.user_name}</div>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{l.user_role}</div>
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (l) => <Badge label={l.action} type="info" />
    },
    {
      header: 'Module',
      accessor: 'module',
      render: (l) => <code style={{ color: '#a78bfa' }}>{l.module}</code>
    },
    {
      header: 'Record Ref',
      accessor: 'record_id',
      render: (l) => l.record_id ? <code>{l.record_id}</code> : '—'
    },
    {
      header: 'IP Address',
      accessor: 'ip_address',
      render: (l) => <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{l.ip_address || '127.0.0.1'}</span>
    },
    {
      header: 'Activity Details / Diff',
      accessor: 'new_value',
      render: (l) => (
        <div style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }} title={l.new_value}>
          {l.new_value || l.previous_value || 'State mutation executed'}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security & System Audit Logs</h1>
          <p className="page-description">
            Strict administrator audit trail &bull; Immutable record of user mutations, POS checkouts, quota assignments, and logins
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-subtle)" />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Module:</span>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="ALL">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit records by user, action, module, or details..."
        emptyMessage="No audit records found."
      />
    </div>
  );
}
