import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, ArrowLeft, Stethoscope, X, User, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
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

  const handleQuickRole = async (roleEmail) => {
    setShowDoctorModal(false);
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
    const result = await login(roleEmail, 'password123');
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }
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
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => handleQuickRole('admin@hospital.com')}>Admin</button>
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => setShowDoctorModal(true)}>Doctor</button>
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => handleQuickRole('reception@hospital.com')}>Reception</button>
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => handleQuickRole('pharmacy@hospital.com')}>Pharmacy</button>
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => handleQuickRole('lab@hospital.com')}>Lab Tech</button>
            <button type="button" disabled={loading} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => handleQuickRole('billing@hospital.com')}>Accountant</button>
          </div>
        </div>
      </div>

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '500px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Which Doctor to Login?</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Select a specialist doctor workstation to sign in immediately:</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Doctor 1: Dr. Sarah Smith */}
              <div
                onClick={() => handleQuickRole('dr.smith@hospital.com')}
                style={{
                  padding: '1.25rem',
                  border: '2px solid #10b981',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '1.75rem', width: '44px', height: '44px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🫀
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Dr. Sarah Smith</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: '#dcfce7', color: '#15803d', fontWeight: 800 }}>Cardiology</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Ground Floor • Suite 302 • Fee: ₹1,500
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                      dr.smith@hospital.com
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, pointerEvents: 'none' }}
                >
                  Sign In
                </button>
              </div>

              {/* Doctor 2: Dr. Rajesh Patel */}
              <div
                onClick={() => handleQuickRole('dr.patel@hospital.com')}
                style={{
                  padding: '1.25rem',
                  border: '2px solid #0284c7',
                  borderRadius: '14px',
                  background: 'rgba(2, 132, 199, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(2, 132, 199, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '1.75rem', width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🧠
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Dr. Rajesh Patel</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>Neurology</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Ground Floor • Suite 410 • Fee: ₹1,750
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, marginTop: '0.2rem' }}>
                      dr.patel@hospital.com
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, borderColor: '#0284c7', color: '#0284c7', pointerEvents: 'none' }}
                >
                  Sign In
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Close & go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

