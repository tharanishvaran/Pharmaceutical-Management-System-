import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Pill, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password@123');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      success(`Welcome back, ${loggedUser.name}! (${loggedUser.role})`);
    } catch (err) {
      error(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (account) => {
    setEmail(account.email);
    setPassword('Password@123');
    setSubmitting(true);
    try {
      const loggedUser = await login(account.email, 'Password@123');
      success(`Logged in as ${loggedUser.role}: ${loggedUser.name}`);
    } catch (err) {
      error(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const roleColors = {
    ADMIN: '#f43f5e',
    MANAGER: '#f59e0b',
    PHARMACIST: '#10b981',
    CASHIER: '#8b5cf6',
    MEDICAL_REPRESENTATIVE: '#0ea5e9',
    VENDOR: '#06b6d4',
    DOCTOR: '#3b82f6',
    CUSTOMER: '#14b8a6'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'radial-gradient(ellipse at top, #111a2e 0%, #090d16 100%)'
        : 'radial-gradient(ellipse at top, #e2e8f0 0%, #f1f5f9 100%)',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      {/* Top right Theme Switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          style={{ width: '42px', height: '42px' }}
        >
          {isDark ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#0284c7" />}
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1060px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '3rem',
        alignItems: 'center'
      }}>
        
        {/* Left: Organization Branding & Core Features */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 30px rgba(2, 132, 199, 0.45)',
              flexShrink: 0
            }}>
              <Pill size={30} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                PHARMA CARE
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-500)', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>
                Centralized Enterprise Platform
              </span>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '2.25rem' }}>
            A unified pharmaceutical management ecosystem governing role-based authorization,
            Medical Representative sales quotas & doctor detailing, counter POS billing, and real-time inventory alerts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {[
              { title: '8 Specialized User Roles', desc: 'Admin, Manager, Pharmacist, Cashier, Rep, Doctor, Vendor, Customer' },
              { title: 'Field Rep Quota & Actuals Engine', desc: 'Real-time achievement percentage with dynamic performance tiers' },
              { title: 'Counter POS Terminal with Deductions', desc: 'Atomic inventory deduction, taxes, discounts & printable tax receipts' },
              { title: 'Immutable Security Audit Logs', desc: 'State diffs, timestamped mutations & downloadable executive reports' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ marginTop: '3px', flexShrink: 0 }}>
                  <CheckCircle2 size={20} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sign-in Glass Card */}
        <div className="card-elevated" style={{
          padding: '2.5rem',
          borderRadius: '20px',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 800 }}>
              Portal Sign In
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Enter your organization credentials or click any demo role below
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', fontSize: '0.95rem', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : 'Sign In to Console'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts Selector */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              <Sparkles size={15} color="#f59e0b" /> 1-Click Instant Demo Login:
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const color = roleColors[acc.role] || '#0ea5e9';
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.5rem 0.65rem',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      gap: '0.5rem'
                    }}
                    title={`Login as ${acc.name} (${acc.role})`}
                  >
                    <div style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0
                    }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                        {acc.role.replace('_', ' ').slice(0, 7)}:
                      </span>{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {acc.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '1rem' }}>
              Demo Organization Password: <code>Password@123</code>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
