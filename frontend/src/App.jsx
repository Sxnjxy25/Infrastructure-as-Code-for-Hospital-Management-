import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Pharmacy from './pages/Pharmacy';
import Laboratory from './pages/Laboratory';
import Billing from './pages/Billing';

const AppLayout = () => {
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT']}><Patients /></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}><Doctors /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}><Appointments /></ProtectedRoute>} />
            <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR']}><Pharmacy /></ProtectedRoute>} />
            <Route path="/lab" element={<ProtectedRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT']}><Laboratory /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT']}><Billing /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
