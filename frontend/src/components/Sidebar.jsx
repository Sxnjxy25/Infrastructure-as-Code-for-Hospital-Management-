import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Contact,
  Users,
  UserCheck,
  Calendar,
  Pill,
  TestTube,
  CreditCard,
  Activity,
  Globe
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN'] },
    { name: 'Staff Directory', path: '/staff', icon: Contact, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN'] },
    { name: 'Patients', path: '/patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { name: 'Doctors', path: '/doctors', icon: UserCheck, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
    { name: 'Laboratory', path: '/lab', icon: TestTube, roles: ['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'] },
    { name: 'Billing & Invoices', path: '/billing', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="sidebar-brand">
          <Activity size={26} />
          <span>CarePulse</span>
        </div>
      </Link>
      <ul className="sidebar-menu">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <Link to="/" className="sidebar-link" style={{ color: 'var(--text-muted)' }}>
          <Globe size={18} />
          <span>View Public Site</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
