import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  Pill,
  ShoppingCart,
  Target,
  CalendarCheck,
  Building2,
  Stethoscope,
  BarChart3,
  ShieldAlert,
  LogOut
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, isOpen }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Build navigation items based strictly on role authorization
  const navSections = [];

  // Main Dashboard (Everyone gets role-specific dashboard)
  const mainItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }
  ];

  // Role specific menu items
  const managementItems = [];

  if (role === 'ADMIN') {
    managementItems.push(
      { id: 'users', label: 'User Directory', icon: Users },
      { id: 'products', label: 'Pharmaceutical Products', icon: Pill },
      { id: 'pos', label: 'POS Billing Counter', icon: ShoppingCart },
      { id: 'targets', label: 'Sales Quotas & Targets', icon: Target },
      { id: 'activities', label: 'Doctor Field Visits', icon: CalendarCheck },
      { id: 'vendors', label: 'Vendors & Suppliers', icon: Building2 },
      { id: 'doctors', label: 'Doctors & Clinics', icon: Stethoscope },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      { id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert }
    );
  } else if (role === 'MANAGER') {
    managementItems.push(
      { id: 'targets', label: 'Rep Quotas & Targets', icon: Target },
      { id: 'activities', label: 'Doctor Field Visits', icon: CalendarCheck },
      { id: 'products', label: 'Products Compendium', icon: Pill },
      { id: 'vendors', label: 'Vendors Directory', icon: Building2 },
      { id: 'doctors', label: 'Doctors Directory', icon: Stethoscope },
      { id: 'reports', label: 'Management Reports', icon: BarChart3 }
    );
  } else if (role === 'PHARMACIST') {
    managementItems.push(
      { id: 'products', label: 'Stock & Batch Inventory', icon: Pill },
      { id: 'reports', label: 'Inventory Reports', icon: BarChart3 }
    );
  } else if (role === 'CASHIER') {
    managementItems.push(
      { id: 'pos', label: 'POS Billing Terminal', icon: ShoppingCart },
      { id: 'products', label: 'Product Price Check', icon: Pill }
    );
  } else if (role === 'MEDICAL_REPRESENTATIVE') {
    managementItems.push(
      { id: 'targets', label: 'My Sales Target', icon: Target },
      { id: 'activities', label: 'Log Doctor Visit', icon: CalendarCheck },
      { id: 'products', label: 'Product Compendium', icon: Pill }
    );
  } else if (role === 'VENDOR') {
    managementItems.push(
      { id: 'vendors', label: 'Supplied Products', icon: Building2 },
      { id: 'products', label: 'Product Catalog', icon: Pill }
    );
  } else if (role === 'DOCTOR') {
    managementItems.push(
      { id: 'products', label: 'Drug Compendium', icon: Pill },
      { id: 'activities', label: 'Rep Visit History', icon: CalendarCheck }
    );
  } else if (role === 'CUSTOMER') {
    managementItems.push(
      { id: 'products', label: 'Browse Medicines', icon: Pill },
      { id: 'pos', label: 'Purchase History', icon: ShoppingCart }
    );
  }

  navSections.push({ title: 'Overview', items: mainItems });
  if (managementItems.length > 0) {
    navSections.push({ title: 'Operations', items: managementItems });
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Pill size={22} />
        </div>
        <div>
          <div className="sidebar-title">PHARMA CARE</div>
          <div className="sidebar-subtitle">Enterprise Console</div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx} style={{ marginBottom: '0.85rem' }}>
            <div className="nav-section-title">{sec.title}</div>
            {sec.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <a
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentView(item.id)}
                >
                  <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div style={{
        padding: '1rem 1.15rem',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.84rem',
            flexShrink: 0
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Sign Out"
          style={{
            padding: '0.45rem',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
