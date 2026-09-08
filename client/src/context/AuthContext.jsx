import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'ADMIN', name: 'Dr. Rajesh Sharma (Admin)', email: 'admin@example.com', badge: 'Admin Console' },
  { role: 'MANAGER', name: 'Vikram Malhotra', email: 'manager@example.com', badge: 'Sales Manager' },
  { role: 'PHARMACIST', name: 'Pooja Iyer', email: 'pharmacist@example.com', badge: 'Lead Pharmacist' },
  { role: 'CASHIER', name: 'Suresh Raina', email: 'cashier@example.com', badge: 'POS Billing' },
  { role: 'MEDICAL_REPRESENTATIVE', name: 'Ravi Teja (Star Rep)', email: 'representative@example.com', badge: 'Medical Rep (110% Achieved)' },
  { role: 'VENDOR', name: 'Apex Life Sciences (Manoj)', email: 'vendor@example.com', badge: 'Vendor Portal' },
  { role: 'DOCTOR', name: 'Dr. Sanjay Gupta, MD', email: 'doctor@example.com', badge: 'Doctor Portal' },
  { role: 'CUSTOMER', name: 'Aditya Kashyap', email: 'customer@example.com', badge: 'Customer Portal' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from token
  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('pharma_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('pharma_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('pharma_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      localStorage.setItem('pharma_token', res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {}
    localStorage.removeItem('pharma_token');
    setUser(null);
  };

  // Quick Demo Account Switcher
  const switchDemoRole = async (targetRole) => {
    const account = DEMO_ACCOUNTS.find(a => a.role === targetRole);
    if (!account) return;
    return await login(account.email, 'Password@123');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      switchDemoRole,
      hasRole,
      hasPermission,
      demoAccounts: DEMO_ACCOUNTS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
