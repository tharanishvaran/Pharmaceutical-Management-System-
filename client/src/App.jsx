import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';

import LoginPage from './pages/LoginPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import PosPage from './pages/PosPage.jsx';
import TargetsPage from './pages/TargetsPage.jsx';
import ActivitiesPage from './pages/ActivitiesPage.jsx';
import VendorsPage from './pages/VendorsPage.jsx';
import DoctorsPage from './pages/DoctorsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';

// Role Dashboards
import AdminDashboard from './components/dashboards/AdminDashboard.jsx';
import ManagerDashboard from './components/dashboards/ManagerDashboard.jsx';
import PharmacistDashboard from './components/dashboards/PharmacistDashboard.jsx';
import CashierDashboard from './components/dashboards/CashierDashboard.jsx';
import RepresentativeDashboard from './components/dashboards/RepresentativeDashboard.jsx';
import VendorDashboard from './components/dashboards/VendorDashboard.jsx';
import DoctorDashboard from './components/dashboards/DoctorDashboard.jsx';
import CustomerDashboard from './components/dashboards/CustomerDashboard.jsx';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        color: 'var(--primary-500)',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        Initializing Pharmaceutical Management Console...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard onNavigate={setCurrentView} />;
      case 'MANAGER':
        return <ManagerDashboard onNavigate={setCurrentView} />;
      case 'PHARMACIST':
        return <PharmacistDashboard onNavigate={setCurrentView} />;
      case 'CASHIER':
        return <CashierDashboard onNavigate={setCurrentView} />;
      case 'MEDICAL_REPRESENTATIVE':
        return <RepresentativeDashboard onNavigate={setCurrentView} />;
      case 'VENDOR':
        return <VendorDashboard onNavigate={setCurrentView} />;
      case 'DOCTOR':
        return <DoctorDashboard onNavigate={setCurrentView} />;
      case 'CUSTOMER':
        return <CustomerDashboard onNavigate={setCurrentView} />;
      default:
        return <AdminDashboard onNavigate={setCurrentView} />;
    }
  };

  // Render operations page with RBAC check
  const renderMainView = () => {
    if (currentView === 'dashboard') return renderDashboard();
    if (currentView === 'users') {
      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') return renderDashboard();
      return <UsersPage />;
    }
    if (currentView === 'products') return <ProductsPage />;
    if (currentView === 'pos') return <PosPage />;
    if (currentView === 'targets') return <TargetsPage />;
    if (currentView === 'activities') return <ActivitiesPage />;
    if (currentView === 'vendors') return <VendorsPage />;
    if (currentView === 'doctors') return <DoctorsPage />;
    if (currentView === 'reports') {
      if (user.role === 'CUSTOMER' || user.role === 'VENDOR') return renderDashboard();
      return <ReportsPage />;
    }
    if (currentView === 'audit') {
      if (user.role !== 'ADMIN') return renderDashboard();
      return <AuditLogsPage />;
    }
    return renderDashboard();
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={sidebarOpen}
      />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="main-viewport">
          <div className="page-container">
            {renderMainView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
