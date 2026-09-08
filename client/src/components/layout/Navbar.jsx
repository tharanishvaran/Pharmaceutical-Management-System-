import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../api/client.js';
import { Bell, UserCheck, Moon, Sun, Menu, Sparkles, Building } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, switchDemoRole } = useAuth();
  const { info, error } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications')
      .then(res => {
        if (res.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    try {
      await switchDemoRole(newRole);
      info(`Switched workstation to ${newRole.replace('_', ' ')}`);
    } catch (err) {
      error(err.message || 'Failed to switch demo role');
    }
  };

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.is_read) {
        api.patch(`/notifications/${n.id}/read`, {}).catch(() => {});
      }
    }
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  if (!user) return null;

  return (
    <header className="navbar">
      {/* Left: Mobile trigger & Active Workstation Badge */}
      <div className="navbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '0.45rem' }}
          id="mobile-sidebar-toggle"
        >
          <Menu size={18} />
        </button>

        <div className="workstation-badge">
          <span className="status-dot-pulse" />
          <span style={{ color: 'var(--text-secondary)' }}>Workstation:</span>
          <span style={{ color: 'var(--primary-500)', fontWeight: 700 }}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="navbar-right">
        {/* Theme Switcher: Dark / Light Mode */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
        </button>

        {/* 1-Click Interactive Demo Role Switcher */}
        <div className="demo-role-selector">
          <Sparkles size={14} color="var(--primary-500)" />
          <span className="demo-role-label">Quick Switch:</span>
          <select
            className="demo-role-select"
            value={user.role}
            onChange={handleRoleChange}
          >
            {DEMO_ACCOUNTS.map(acc => (
              <option key={acc.role} value={acc.role}>
                {acc.role.replace('_', ' ')} ({acc.badge})
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="theme-toggle-btn"
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs && unreadCount > 0) markAllAsRead();
            }}
            style={{ position: 'relative' }}
            title="System Alerts & Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#f43f5e',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(244, 63, 94, 0.7)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="card-elevated"
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                padding: '1.25rem',
                zIndex: 60,
                boxShadow: 'var(--shadow-dropdown)',
                border: '1px solid var(--border-medium)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Organization Alerts</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--primary-500)', cursor: 'pointer', fontWeight: 600 }} onClick={markAllAsRead}>
                  Mark all read
                </span>
              </div>
              {notifications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: n.is_read ? 'transparent' : 'var(--accent-cyan-tint)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0', fontSize: '0.84rem' }}>
                  No active notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Identity Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '30px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.82rem',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
          }}>
            {user.name.charAt(0)}
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
