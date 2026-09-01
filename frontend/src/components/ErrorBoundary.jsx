import React from 'react';
import { Activity, RotateCcw, Home, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CarePulse App Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--bg-canvas, #f2ede4)',
            color: 'var(--text-primary, #18181b)',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '16px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: '1.6rem',
                margin: '0 0 0.5rem 0',
                color: '#18181b',
                textTransform: 'uppercase',
                letterSpacing: '-0.5px'
              }}
            >
              Application Recovery
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#71717a',
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0'
              }}
            >
              CarePulse encountered an unexpected state. Click below to reset your session and reload the clinical portal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
              >
                <RotateCcw size={18} />
                <span>Reset Session & Reload</span>
              </button>

              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  color: '#18181b',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Home size={16} />
                <span>Return to Public Showcase</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
