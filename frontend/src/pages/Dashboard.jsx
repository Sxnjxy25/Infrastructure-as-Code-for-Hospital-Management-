import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import {
  Users,
  UserCheck,
  Calendar,
  Pill,
  TestTube,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Sparkles,
  Building2,
  TrendingUp,
  Receipt
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorPanelMode, setDoctorPanelMode] = useState('SPLIT'); // 'SPLIT', 'SARAH', 'RAJESH', 'ALL'

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
      setRecentAppointments(res.data.recentAppointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading command metrics...</div>;

  const role = user?.role;

  // Filter appointments for Doctor 1 (Dr. Sarah Smith) and Doctor 2 (Dr. Rajesh Patel) sorted in ASCENDING order (#101, #102, #103...)
  const sarahAppointments = recentAppointments
    .filter(
      (a) => a.doctor?.user?.name?.toLowerCase().includes('sarah') || a.doctor?.specialization?.toLowerCase().includes('cardio')
    )
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const rajeshAppointments = recentAppointments
    .filter(
      (a) => a.doctor?.user?.name?.toLowerCase().includes('rajesh') || a.doctor?.specialization?.toLowerCase().includes('neuro')
    )
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const sortedAllAppointments = [...recentAppointments].sort((a, b) => a.tokenNumber - b.tokenNumber);

  const renderDoctorTable = (apps, doctorColor = '#059669') => {
    if (!apps || apps.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No appointments scheduled for this doctor yet.
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ fontSize: '0.84rem' }}>
          <thead>
            <tr>
              <th style={{ width: '85px' }}>Token #</th>
              <th>Patient</th>
              <th>Channel</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {apps?.map((app) => (
              <tr key={app.id}>
                <td>
                  <span
                    className="user-badge"
                    style={{
                      background: `${doctorColor}20`,
                      color: doctorColor,
                      borderColor: `${doctorColor}40`,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    #{app.tokenNumber}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {app.patient.firstName} {app.patient.lastName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    MRN: {app.patient.mrn}
                  </div>
                </td>
                <td>
                  <span
                    className="user-badge"
                    style={{
                      background: app.channel === 'ONLINE' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                      color: app.channel === 'ONLINE' ? '#a78bfa' : '#38bdf8',
                      fontSize: '0.72rem'
                    }}
                  >
                    {app.channel || 'OFFLINE'}
                  </span>
                </td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {new Date(app.appointmentDate).toLocaleString()}
                </td>
                <td>
                  <span className={`status-tag ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem', fontWeight: 800 }}>
            {role === 'ADMIN' && 'Hospital Executive Command Center'}
            {role === 'DOCTOR' && 'Doctor Clinical Queue & Workstation'}
            {role === 'RECEPTIONIST' && 'Front Desk & Patient Intake'}
            {role === 'PHARMACIST' && 'Pharmacy Inventory & Dispensing'}
            {role === 'LAB_TECHNICIAN' && 'Laboratory Diagnostics Terminal'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Multi-department real-time synchronization • S3 KMS Security Enabled
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="user-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <Sparkles size={14} style={{ marginRight: '0.25rem' }} /> System Operational
          </span>
        </div>
      </div>

      {/* Global Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="Total Registered Patients" value={stats?.totalPatients || 0} icon={Users} color="#10b981" />
        <StatCard title="Active Duty Doctors" value={`${stats?.activeDoctors || 0} / ${stats?.totalDoctors || 0}`} icon={UserCheck} color="#0284c7" />
        <StatCard title="Today's Appointments" value={stats?.scheduledAppointments || 0} icon={Calendar} color="#f59e0b" />
        <StatCard title="Today's Revenue Flow" value={`$${stats?.todayRevenue || '0.00'}`} icon={DollarSign} color="#10b981" />
      </div>

      {/* Executive Command Matrix */}
      {role === 'ADMIN' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Clinical Staff Roster */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#0284c7" /> Clinical & Ground Staff Roster
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span>Doctors (Consultants)</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{stats?.staffBreakdown?.doctors?.available} On Duty / {stats?.staffBreakdown?.doctors?.total} Total</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span>Nursing & Patient Care</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{stats?.staffBreakdown?.nurses?.available} Active / {stats?.staffBreakdown?.nurses?.total} Total</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span>Lab & Pharmacy Technicians</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats?.staffBreakdown?.technicalStaff?.available} Active / {stats?.staffBreakdown?.technicalStaff?.total} Total</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span>Sanitation & Cleaners</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{stats?.staffBreakdown?.cleaners?.available} Available / {stats?.staffBreakdown?.cleaners?.total} Total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Panel Doctor Appointment Queues */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="#10b981" /> Doctor Appointment Workstations & Token Queues
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Dedicated doctor panels with independent token queues starting at #101
            </p>
          </div>

          {/* View Filter Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'SPLIT' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('SPLIT')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Two Panels (Side-by-Side)
            </button>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'SARAH' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('SARAH')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Dr. Sarah Smith ({sarahAppointments.length})
            </button>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'RAJESH' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('RAJESH')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Dr. Rajesh Patel ({rajeshAppointments.length})
            </button>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'ALL' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('ALL')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              All Combined
            </button>
          </div>
        </div>

        {/* Split Two Panels Mode */}
        {doctorPanelMode === 'SPLIT' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
            {/* PANEL 1: DR. SARAH SMITH */}
            <div style={{ background: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(5, 150, 105, 0.2)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🫀</span>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#34d399' }}>
                      Dr. Sarah Smith
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Cardiology Clinic • Suite 302 • Fee: $150.00
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="user-badge" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', borderColor: '#059669' }}>
                    Queue: {sarahAppointments.length} Tokens
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Tokens start: #101
                  </div>
                </div>
              </div>
              {renderDoctorTable(sarahAppointments, '#059669')}
            </div>

            {/* PANEL 2: DR. RAJESH PATEL */}
            <div style={{ background: 'rgba(2, 132, 199, 0.03)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(2, 132, 199, 0.2)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🧠</span>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#38bdf8' }}>
                      Dr. Rajesh Patel
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Neurology Clinic • Suite 410 • Fee: $175.00
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="user-badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', borderColor: '#0284c7' }}>
                    Queue: {rajeshAppointments.length} Tokens
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Tokens start: #101
                  </div>
                </div>
              </div>
              {renderDoctorTable(rajeshAppointments, '#0284c7')}
            </div>
          </div>
        )}

        {/* Single Doctor Mode: Sarah Smith */}
        {doctorPanelMode === 'SARAH' && (
          <div style={{ background: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🫀</span>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#34d399' }}>
                    Dr. Sarah Smith — Cardiology Clinic Workstation
                  </h4>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Location: Ground Floor, Suite 302 • Consultation Fee: $150.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', borderColor: '#059669' }}>
                {sarahAppointments.length} Total Appointments (Tokens #101 - #{100 + sarahAppointments.length})
              </span>
            </div>
            {renderDoctorTable(sarahAppointments, '#059669')}
          </div>
        )}

        {/* Single Doctor Mode: Rajesh Patel */}
        {doctorPanelMode === 'RAJESH' && (
          <div style={{ background: 'rgba(2, 132, 199, 0.03)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(2, 132, 199, 0.2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🧠</span>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8' }}>
                    Dr. Rajesh Patel — Neurology Clinic Workstation
                  </h4>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Location: Ground Floor, Suite 410 • Consultation Fee: $175.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', borderColor: '#0284c7' }}>
                {rajeshAppointments.length} Total Appointments (Tokens #101 - #{100 + rajeshAppointments.length})
              </span>
            </div>
            {renderDoctorTable(rajeshAppointments, '#0284c7')}
          </div>
        )}

        {/* All Combined Table Mode */}
        {doctorPanelMode === 'ALL' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Doctor</th>
                  <th>Patient</th>
                  <th>Channel</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAllAppointments?.map((app) => (
                  <tr key={app.id}>
                    <td><span className="user-badge">#{app.tokenNumber}</span></td>
                    <td style={{ fontWeight: 600 }}>{app.doctor?.user?.name || 'Assigned Doctor'} ({app.doctor?.specialization || 'General'})</td>
                    <td>{app.patient?.firstName} {app.patient?.lastName} ({app.patient?.mrn || 'N/A'})</td>
                    <td>
                      <span className="user-badge" style={{ background: app.channel === 'ONLINE' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(2, 132, 199, 0.2)', color: app.channel === 'ONLINE' ? '#a78bfa' : '#38bdf8' }}>
                        {app.channel || 'OFFLINE'}
                      </span>
                    </td>
                    <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                    <td><span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
