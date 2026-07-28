import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="navbar">
      <div>
        <h3 style={{ margin: 0, fontWeight: 700 }}>Hospital Command Center</h3>
      </div>
      <div className="navbar-user">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={18} className="text-muted" />
          <span style={{ fontWeight: 600 }}>{user?.name}</span>
        </div>
        <span className="user-badge">{user?.role}</span>
        <button onClick={logout} className="btn btn-danger" title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
