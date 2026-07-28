import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Pill,
  TestTube,
  CreditCard,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT'] },
    { name: 'Patients', path: '/patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { name: 'Doctors', path: '/doctors', icon: UserCheck, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'DOCTOR'] },
    { name: 'Laboratory', path: '/lab', icon: TestTube, roles: ['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'] },
    { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Activity size={28} />
        <span>CarePulse HMS</span>
      </div>
      <ul className="sidebar-menu">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
