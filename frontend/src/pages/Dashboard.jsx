import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { Users, UserCheck, Calendar, Pill, TestTube, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
      setRecentAppointments(res.data.recentAppointments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading command metrics...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Hospital Operational Analytics</h2>

      <div className="grid-stats">
        <StatCard title="Total Patients" value={stats?.totalPatients || 0} icon={Users} color="#0284c7" />
        <StatCard title="Active Doctors" value={stats?.totalDoctors || 0} icon={UserCheck} color="#10b981" />
        <StatCard title="Scheduled Appointments" value={stats?.activeAppointments || 0} icon={Calendar} color="#f59e0b" />
        <StatCard title="Pending Lab Requests" value={stats?.pendingLabTests || 0} icon={TestTube} color="#ec4899" />
        <StatCard title="Medicine Low Stock" value={stats?.lowStockMedicines || 0} icon={Pill} color="#ef4444" />
        <StatCard title="Net Revenue ($)" value={`$${stats?.totalRevenue || '0.00'}`} icon={DollarSign} color="#8b5cf6" />
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Recent Patient Appointments</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Token #</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentAppointments.map((app) => (
              <tr key={app.id}>
                <td style={{ fontWeight: 600 }}>{app.patient.firstName} {app.patient.lastName} ({app.patient.mrn})</td>
                <td>{app.doctor.user.name}</td>
                <td><span className="user-badge">{app.tokenNumber}</span></td>
                <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                <td><span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
