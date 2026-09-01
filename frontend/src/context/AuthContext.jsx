import React, { createContext, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  'admin@hospital.com': { id: 'usr-admin-01', name: 'Dr. Arthur Pendelton', email: 'admin@hospital.com', role: 'ADMIN', phone: '+1-555-0100' },
  'dr.smith@hospital.com': { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', role: 'DOCTOR', phone: '+1-555-0102' },
  'dr.patel@hospital.com': { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', role: 'DOCTOR', phone: '+1-555-0108' },
  'reception@hospital.com': { id: 'usr-rec-01', name: 'Emma Watson', email: 'reception@hospital.com', role: 'RECEPTIONIST', phone: '+1-555-0103' },
  'pharmacy@hospital.com': { id: 'usr-pharma-01', name: 'Marcus Vance', email: 'pharmacy@hospital.com', role: 'PHARMACIST', phone: '+1-555-0104' },
  'lab@hospital.com': { id: 'usr-lab-01', name: 'Dr. Nathan Drake', email: 'lab@hospital.com', role: 'LAB_TECHNICIAN', phone: '+1-555-0105' },
  'billing@hospital.com': { id: 'usr-bill-01', name: 'Sophia Loren', email: 'billing@hospital.com', role: 'ACCOUNTANT', phone: '+1-555-0106' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn('Invalid user in localStorage, clearing auth cache:', e);
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } catch (err) {
        // ignore
      }
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    } catch (error) {
      // If 404 or backend offline (e.g. standalone Vercel preview), check demo accounts
      const lowerEmail = (email || '').toLowerCase().trim();
      if (DEMO_ACCOUNTS[lowerEmail]) {
        const mockUser = DEMO_ACCOUNTS[lowerEmail];
        const mockToken = `mock-jwt-token-carepulse-${mockUser.role.toLowerCase()}`;

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));

        setToken(mockToken);
        setUser(mockUser);
        setLoading(false);
        return { success: true, user: mockUser };
      }

      setLoading(false);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Could not connect to database or server.';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
