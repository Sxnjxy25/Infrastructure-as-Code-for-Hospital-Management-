import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2>Access Denied</h2>
        <p className="text-muted">You do not have administrative permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
