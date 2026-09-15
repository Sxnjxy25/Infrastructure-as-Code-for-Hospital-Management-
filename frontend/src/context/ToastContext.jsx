import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showInfo: () => {},
      showWarning: () => {}
    };
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message = '', type = 'success', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, title, message, type, duration };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showSuccess = (title, message = '', duration = 5000) => addToast(title, message, 'success', duration);
  const showError = (title, message = '', duration = 5000) => addToast(title, message, 'error', duration);
  const showInfo = (title, message = '', duration = 4000) => addToast(title, message, 'info', duration);
  const showWarning = (title, message = '', duration = 4500) => addToast(title, message, 'warning', duration);

  // Seamlessly intercept any legacy window.alert calls so no ugly native browser popups appear
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg) => {
        const text = String(msg || '');
        if (text.includes('Failed') || text.includes('Error') || text.includes('failed') || text.includes('error')) {
          showError('Hospital System Notice', text);
        } else if (text.includes('Success') || text.includes('success') || text.includes('Registered') || text.includes('Booked') || text.includes('Dispensed') || text.includes('recorded') || text.includes('Created') || text.includes('✅')) {
          showSuccess('Operation Successful', text);
        } else {
          showInfo('Hospital Alert', text);
        }
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(5, 150, 105, 0.95)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#ffffff',
          icon: <CheckCircle2 size={22} color="#ffffff" />
        };
      case 'error':
        return {
          bg: 'rgba(220, 38, 38, 0.95)',
          border: '1px solid rgba(248, 113, 113, 0.4)',
          color: '#ffffff',
          icon: <AlertCircle size={22} color="#ffffff" />
        };
      case 'warning':
        return {
          bg: 'rgba(217, 119, 6, 0.95)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          color: '#ffffff',
          icon: <AlertTriangle size={22} color="#ffffff" />
        };
      default:
        return {
          bg: 'rgba(2, 132, 199, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#ffffff',
          icon: <Info size={22} color="#ffffff" />
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast, showSuccess, showError, showInfo, showWarning, removeToast }}>
      {children}

      {/* Floating In-App Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '440px',
          width: 'calc(100% - 2.5rem)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => {
          const styles = getTypeStyles(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: styles.bg,
                border: styles.border,
                color: styles.color,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                fontSize: '0.9rem',
                lineHeight: 1.45
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {styles.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', letterSpacing: '-0.2px', marginBottom: toast.message ? '0.25rem' : '0' }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: '0.86rem', opacity: 0.95, whiteSpace: 'pre-line' }}>
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
