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
  Receipt,
  MapPin,
  Globe
} from 'lucide-react';

const DEFAULT_STATS = {
  totalPatients: 6,
  totalDoctors: 5,
  activeDoctors: 4,
  scheduledAppointments: 4,
  pendingLabTests: 2,
  completedLabTests: 1,
  lowStockCount: 2,
  outOfStockCount: 1,
  totalRevenue: '4300.00',
  todayRevenue: '1400.00',
  monthlyRevenue: '4300.00',
  staffBreakdown: {
    doctors: { total: 5, available: 4 },
    nurses: { total: 2, available: 2 },
    technicalStaff: { total: 1, available: 1 },
    cleaners: { total: 1, available: 1 }
  },
  departmentRevenue: {
    reception: '3500.00',
    pharmacy: '450.00',
    laboratory: '1150.00',
    total: '4300.00'
  },
  pharmacy: {
    totalItems: 6,
    lowStockItems: [
      { name: 'Amoxicillin 500mg', quantity: 12, code: 'MED-AMOX-500' },
      { name: 'Omeprazole 20mg', quantity: 15, code: 'MED-OMEP-20' }
    ],
    outOfStockItems: [
      { name: 'Paracetamol 650mg', quantity: 0, code: 'MED-PARA-650' }
    ]
  }
};

const DEFAULT_RECENT_APPOINTMENTS = [
  {
    id: 'app-01',
    tokenNumber: 101,
    channel: 'OFFLINE',
    appointmentDate: new Date().toISOString(),
    status: 'SCHEDULED',
    reason: 'Cardiac Rhythm Assessment',
    patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' },
    doctor: { specialization: 'Cardiology', user: { name: 'Dr. Sarah Smith' } }
  },
  {
    id: 'app-02',
    tokenNumber: 101,
    channel: 'ONLINE',
    appointmentDate: new Date().toISOString(),
    status: 'SCHEDULED',
    reason: 'Chronic Migraine Evaluation',
    patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' },
    doctor: { specialization: 'Neurology', user: { name: 'Dr. Rajesh Patel' } }
  },
  {
    id: 'app-03',
    tokenNumber: 102,
    channel: 'OFFLINE',
    appointmentDate: new Date().toISOString(),
    status: 'SCHEDULED',
    reason: 'Chest tightness checkup & ECG',
    patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' },
    doctor: { specialization: 'Cardiology', user: { name: 'Dr. Sarah Smith' } }
  },
  {
    id: 'app-04',
    tokenNumber: 102,
    channel: 'OFFLINE',
    appointmentDate: new Date().toISOString(),
    status: 'SCHEDULED',
    reason: 'Nerve Conduction Review',
    patient: { firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-004' },
    doctor: { specialization: 'Neurology', user: { name: 'Dr. Rajesh Patel' } }
  }
];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentAppointments, setRecentAppointments] = useState(DEFAULT_RECENT_APPOINTMENTS);
  const [loading, setLoading] = useState(true);
  const [doctorPanelMode, setDoctorPanelMode] = useState('SPLIT'); // 'SPLIT', 'SARAH', 'RAJESH', 'ALL'

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
      if (Array.isArray(res.data?.recentAppointments) && res.data.recentAppointments.length > 0) {
        setRecentAppointments(res.data.recentAppointments);
      }
    } catch (err) {
      console.warn('Dashboard stats API fallback activated:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role;

  // Filter appointments for Doctor 1 (Dr. Sarah Smith) and Doctor 2 (Dr. Rajesh Patel) sorted in ASCENDING order (#101, #102, #103...)
  const sarahAppointments = recentAppointments
    .filter(
      (a) =>
        a.doctor?.user?.name?.toLowerCase().includes('sarah') ||
        a.doctor?.specialization?.toLowerCase().includes('cardio') ||
        (!a.doctor?.user?.name?.toLowerCase().includes('rajesh') && !a.doctor?.specialization?.toLowerCase().includes('neuro'))
    )
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  const rajeshAppointments = recentAppointments
    .filter(
      (a) =>
        a.doctor?.user?.name?.toLowerCase().includes('rajesh') ||
        a.doctor?.specialization?.toLowerCase().includes('neuro')
    )
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  const sortedAllAppointments = [...recentAppointments].sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

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
                    {app.patient?.firstName} {app.patient?.lastName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    MRN: {app.patient?.mrn || 'N/A'}
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
                    {app.channel === 'ONLINE' ? <Globe size={12} style={{ display: 'inline', marginRight: 3 }} /> : <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />}
                    {app.channel || 'OFFLINE'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
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
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
          Hospital Command Center
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Real-time telemetry, clinical department workflows, outpatient queues, and financial telemetry.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Registered Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="#0284c7"
          subtext="EHR records active"
        />
        <StatCard
          title="Specialists On Duty"
          value={`${stats?.activeDoctors || 0} / ${stats?.totalDoctors || 0}`}
          icon={UserCheck}
          color="#10b981"
          subtext="Physician clinical capacity"
        />
        <StatCard
          title="Outpatient Queue"
          value={stats?.scheduledAppointments || 0}
          icon={Calendar}
          color="#8b5cf6"
          subtext="Tokens in active stream"
        />
        <StatCard
          title="Laboratory Pending"
          value={stats?.pendingLabTests || 0}
          icon={TestTube}
          color="#f43f5e"
          subtext={`${stats?.completedLabTests || 0} completed investigations`}
        />
        <StatCard
          title="Pharmacy Out of Stock"
          value={stats?.outOfStockCount || 0}
          icon={AlertTriangle}
          color="#ef4444"
          subtext={`${stats?.lowStockCount || 0} low stock items`}
        />
        <StatCard
          title="Revenue (Today)"
          value={`₹${Number(stats?.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="#059669"
          subtext={`Total: ₹${Number(stats?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        />
      </div>

      {/* TWO DOCTOR WORKSTATIONS QUEUES SECTION */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#0284c7" />
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem' }}>
                Active Outpatient Doctor Workstations
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Independent token streams starting at #101 for each doctor's workstation.
            </p>
          </div>

          {/* View Filter Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'SPLIT' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('SPLIT')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Two Panels (Split View)
            </button>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'SARAH' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('SARAH')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Dr. Sarah ({sarahAppointments.length})
            </button>
            <button
              className={`btn btn-sm ${doctorPanelMode === 'RAJESH' ? 'btn-emerald' : 'btn-outline'}`}
              onClick={() => setDoctorPanelMode('RAJESH')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              Dr. Rajesh ({rajeshAppointments.length})
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

        {doctorPanelMode === 'SPLIT' ? (
          /* Split Two Doctor Panels Mode */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
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
                    Cardiology Clinic • Suite 302 • Consultation Fee: ₹1,500.00
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
                    Neurology Clinic • Suite 410 • Consultation Fee: ₹1,750.00
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
        ) : doctorPanelMode === 'SARAH' ? (
          /* Single Doctor Mode: Sarah Smith */
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
                  Location: Ground Floor, Suite 302 • Consultation Fee: ₹1,500.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', borderColor: '#059669' }}>
                {sarahAppointments.length} Total Appointments (Tokens #101 - #{100 + sarahAppointments.length})
              </span>
            </div>
            {renderDoctorTable(sarahAppointments, '#059669')}
          </div>
        ) : doctorPanelMode === 'RAJESH' ? (
          /* Single Doctor Mode: Rajesh Patel */
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
                  Location: Ground Floor, Suite 410 • Consultation Fee: ₹1,750.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', borderColor: '#0284c7' }}>
                {rajeshAppointments.length} Total Appointments (Tokens #101 - #{100 + rajeshAppointments.length})
              </span>
            </div>
            {renderDoctorTable(rajeshAppointments, '#0284c7')}
          </div>
        ) : (
          /* All Combined Appointments */
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
