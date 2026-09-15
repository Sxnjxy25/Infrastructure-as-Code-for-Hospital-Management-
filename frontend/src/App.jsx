import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import StaffDirectory from './pages/StaffDirectory';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Pharmacy from './pages/Pharmacy';
import Laboratory from './pages/Laboratory';
import Billing from './pages/Billing';

const AppLayout = ({ children }) => {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Showcase & Authentication Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Clinical App Routes */}
              <Route
                path="/dashboard"
                element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/departments"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <Departments />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/staff"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN']}>
                      <StaffDirectory />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/patients"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT']}>
                      <Patients />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/doctors"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}>
                      <Doctors />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/appointments"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}>
                      <Appointments />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/pharmacy"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR']}>
                      <Pharmacy />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/lab"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT']}>
                      <Laboratory />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/billing"
                element={
                  <AppLayout>
                    <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT']}>
                      <Billing />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
