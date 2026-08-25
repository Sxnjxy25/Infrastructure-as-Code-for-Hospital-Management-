import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, ArrowLeft } from 'lucide-react';

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
      navigate('/dashboard');
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
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Public Showcase
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--bg-canvas-subtle)', borderRadius: '50%', color: 'var(--accent-emerald)', marginBottom: '0.85rem', border: '1px solid var(--border-medium)' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
            CarePulse Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Enterprise Clinical & Hospital Command System
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            1-Click Demo Credentials:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('admin@hospital.com')}>Admin</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('dr.smith@hospital.com')}>Doctor</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('reception@hospital.com')}>Reception</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('pharmacy@hospital.com')}>Pharmacy</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('lab@hospital.com')}>Lab Tech</button>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleQuickRole('billing@hospital.com')}>Accountant</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
