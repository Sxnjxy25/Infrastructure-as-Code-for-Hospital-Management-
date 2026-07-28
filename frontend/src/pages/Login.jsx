import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleQuickRole = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(2, 132, 199, 0.15)', borderRadius: '50%', color: '#0284c7', marginBottom: '1rem' }}>
            <Activity size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>CarePulse HMS</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Production Infrastructure Portal</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Demo Quick Login Roles:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#0284c7' }} onClick={() => handleQuickRole('admin@hospital.com')}>Admin</button>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#10b981' }} onClick={() => handleQuickRole('dr.smith@hospital.com')}>Doctor</button>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#8b5cf6' }} onClick={() => handleQuickRole('reception@hospital.com')}>Reception</button>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f59e0b' }} onClick={() => handleQuickRole('pharmacy@hospital.com')}>Pharmacy</button>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#ec4899' }} onClick={() => handleQuickRole('lab@hospital.com')}>Lab Tech</button>
            <button className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#14b8a6' }} onClick={() => handleQuickRole('billing@hospital.com')}>Accountant</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
