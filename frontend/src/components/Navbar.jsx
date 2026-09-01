import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, User as UserIcon, Bell, Check, CheckCheck, AlertTriangle, Calendar, TestTube, DollarSign, Info } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev?.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev?.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertTriangle size={16} color="#dc2626" />;
      case 'APPOINTMENT':
        return <Calendar size={16} color="#059669" />;
      case 'LAB_REQUEST':
      case 'LAB_RESULT':
        return <TestTube size={16} color="#c2410c" />;
      case 'PAYMENT':
        return <DollarSign size={16} color="#059669" />;
      default:
        return <Info size={16} color="#18181b" />;
    }
  };

  return (
    <div className="navbar">
      <div>
        <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Hospital Command Center
        </h3>
      </div>
      <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'var(--transition)'
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#dc2626',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                minWidth: '18px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '52px',
              width: '380px',
              maxHeight: '480px',
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-elevated)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-canvas-subtle)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Notifications {unreadCount > 0 && <span style={{ color: 'var(--accent-emerald)' }}>({unreadCount} unread)</span>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-emerald)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No alerts in queue.
                  </div>
                ) : (
                  notifications?.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.isRead ? '#ffffff' : 'var(--bg-canvas)',
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'flex-start',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon size={18} color="var(--text-secondary)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{user?.name}</span>
        </div>
        <span className="user-badge">{user?.role}</span>
        <button onClick={logout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }} title="Logout">
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
