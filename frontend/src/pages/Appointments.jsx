import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  CheckCircle,
  FileText,
  TestTube,
  Pill,
  User,
  Clock,
  Globe,
  MapPin,
  X,
  Stethoscope
} from 'lucide-react';

const COMMON_LAB_TESTS = [
  { testName: 'Complete Blood Count (CBC)', category: 'Hematology', cost: 45.00 },
  { testName: 'Lipid Profile Panel', category: 'Biochemistry', cost: 60.00 },
  { testName: 'Fasting Blood Glucose', category: 'Biochemistry', cost: 30.00 },
  { testName: 'Liver Function Test (LFT)', category: 'Biochemistry', cost: 65.00 },
  { testName: 'Chest X-Ray Digital', category: 'Radiology', cost: 85.00 },
  { testName: 'Electrocardiogram (ECG)', category: 'Cardiology', cost: 50.00 }
];

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    channel: 'OFFLINE',
    reason: ''
  });

  // Completion Modal
  const [completeAppModal, setCompleteAppModal] = useState(null);
  const [completeFormData, setCompleteFormData] = useState({
    diagnosis: '',
    prescription: '',
    selectedTests: []
  });

  useEffect(() => {
    fetchAppointments();
    fetchDropdowns();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [pRes, dRes] = await Promise.all([api.get('/patients'), api.get('/doctors')]);
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', formData);
      setShowModal(false);
      setFormData({ patientId: '', doctorId: '', appointmentDate: '', channel: 'OFFLINE', reason: '' });
      fetchAppointments();
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  const handleOpenCompleteModal = (app) => {
    setCompleteAppModal(app);
    setCompleteFormData({
      diagnosis: app.diagnosis || '',
      prescription: app.prescription || '',
      selectedTests: []
    });
  };

  const handleToggleTest = (test) => {
    setCompleteFormData(prev => {
      const exists = prev.selectedTests.some(t => t.testName === test.testName);
      if (exists) {
        return { ...prev, selectedTests: prev.selectedTests.filter(t => t.testName !== test.testName) };
      } else {
        return { ...prev, selectedTests: [...prev.selectedTests, test] };
      }
    });
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!completeAppModal) return;

    try {
      await api.patch(`/appointments/${completeAppModal.id}/complete`, {
        diagnosis: completeFormData.diagnosis,
        prescription: completeFormData.prescription,
        orderedTests: completeFormData.selectedTests
      });
      alert('Consultation completed! Automated billing recorded and orders dispatched.');
      setCompleteAppModal(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const [doctorPanelMode, setDoctorPanelMode] = useState('SPLIT'); // 'SPLIT', 'SARAH', 'RAJESH', 'ALL'

  // Filter appointments for Doctor 1 (Dr. Sarah Smith) and Doctor 2 (Dr. Rajesh Patel) sorted in ASCENDING order
  const sarahAppointments = appointments
    .filter(
      (a) => a.doctor?.user?.name?.toLowerCase().includes('sarah') || a.doctor?.specialization?.toLowerCase().includes('cardio')
    )
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const rajeshAppointments = appointments
    .filter(
      (a) => a.doctor?.user?.name?.toLowerCase().includes('rajesh') || a.doctor?.specialization?.toLowerCase().includes('neuro')
    )
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const sortedAllAppointments = [...appointments].sort((a, b) => a.tokenNumber - b.tokenNumber);

  const renderAppointmentsTable = (apps, doctorColor = '#059669') => {
    if (!apps || apps.length === 0) {
      return (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          No appointments scheduled for this doctor workstation yet.
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
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
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
                    MRN: {app.patient?.mrn || 'N/A'} • Ph: {app.patient?.phone || 'N/A'}
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
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {app.reason || 'General Consultation'}
                </td>
                <td>
                  <span className={`status-tag ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
                <td>
                  {app.status !== 'COMPLETED' && isDoctor ? (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => handleOpenCompleteModal(app)}
                    >
                      <Stethoscope size={13} />
                      <span>Complete</span>
                    </button>
                  ) : app.status === 'COMPLETED' ? (
                    <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>✓ Billed</span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Waiting</span>
                  )}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Outpatient & Clinical Workstation
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Two-panel doctor workstation queues • Doctor 1 and Doctor 2 independent token streams starting at #101
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading appointment queues...</div>
        ) : doctorPanelMode === 'SPLIT' ? (
          /* Split Two Doctor Panels Mode */
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
              {renderAppointmentsTable(sarahAppointments, '#059669')}
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
              {renderAppointmentsTable(rajeshAppointments, '#0284c7')}
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
                  Location: Ground Floor, Suite 302 • Consultation Fee: $150.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', borderColor: '#059669' }}>
                {sarahAppointments.length} Total Appointments (Tokens #101 - #{100 + sarahAppointments.length})
              </span>
            </div>
            {renderAppointmentsTable(sarahAppointments, '#059669')}
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
                  Location: Ground Floor, Suite 410 • Consultation Fee: $175.00 • Active Queue
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', borderColor: '#0284c7' }}>
                {rajeshAppointments.length} Total Appointments (Tokens #101 - #{100 + rajeshAppointments.length})
              </span>
            </div>
            {renderAppointmentsTable(rajeshAppointments, '#0284c7')}
          </div>
        ) : (
          /* All Combined Appointments */
          <table className="custom-table">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Channel</th>
                <th>Date & Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Clinical Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAllAppointments?.map((app) => (
                <tr key={app.id}>
                  <td>
                    <span className="user-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                      #{app.tokenNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.patient?.firstName} {app.patient?.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MRN: {app.patient?.mrn || 'N/A'}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{app.doctor?.user?.name || 'Assigned Doctor'} ({app.doctor?.specialization || 'General'})</td>
                  <td>
                    <span className="user-badge" style={{ background: app.channel === 'ONLINE' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(2, 132, 199, 0.2)', color: app.channel === 'ONLINE' ? '#a78bfa' : '#38bdf8' }}>
                      {app.channel === 'ONLINE' ? <Globe size={12} style={{ display: 'inline', marginRight: 3 }} /> : <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />}
                      {app.channel || 'OFFLINE'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(app.appointmentDate).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{app.reason || 'General Consultation'}</td>
                  <td><span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span></td>
                  <td>
                    {app.status !== 'COMPLETED' && isDoctor ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleOpenCompleteModal(app)}
                      >
                        <Stethoscope size={14} />
                        <span>Complete Visit</span>
                      </button>
                    ) : app.status === 'COMPLETED' ? (
                      <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>✓ Billed & Done</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>In Queue</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Book Outpatient Visit</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBook}>
              <div className="form-group">
                <label>Select Patient</label>
                <select className="form-control" required onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}>
                  <option value="">-- Choose Patient --</option>
                  {patients?.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Attending Doctor</label>
                <select className="form-control" required onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                  <option value="">-- Choose Doctor --</option>
                  {doctors?.map(d => <option key={d.id} value={d.id}>{d.user?.name || 'Doctor'} ({d.specialization}) - Fee: ${d.consultationFee}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Channel</label>
                  <select
                    className="form-control"
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  >
                    <option value="OFFLINE">Offline (Walk-in)</option>
                    <option value="ONLINE">Online Video</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Chief Complaint / Reason</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Routine checkup, fever..."
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Booking</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      {completeAppModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Clinical Visit Completion</h3>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', marginTop: '3px' }}>
                  Patient: {completeAppModal.patient?.firstName} {completeAppModal.patient?.lastName} ({completeAppModal.patient?.mrn || 'N/A'})
                </div>
              </div>
              <button onClick={() => setCompleteAppModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion}>
              <div className="form-group">
                <label>Clinical Diagnosis & Observations</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Enter medical diagnosis, vitals, and findings..."
                  value={completeFormData.diagnosis}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, diagnosis: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Electronic Prescription (Routes to Pharmacy)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Amlodipine 5mg - 1 tab daily (30 days)"
                  value={completeFormData.prescription}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, prescription: e.target.value })}
                ></textarea>
              </div>

              {/* Lab Tests Section */}
              <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem', color: '#f43f5e' }}>
                  <TestTube size={16} /> Order Diagnostic Investigations (Routes to Lab)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {COMMON_LAB_TESTS?.map((test) => {
                    const isSelected = completeFormData.selectedTests.some(t => t.testName === test.testName);
                    return (
                      <div
                        key={test.testName}
                        onClick={() => handleToggleTest(test)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          background: isSelected ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? '#f43f5e' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{test.testName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{test.category} • ${test.cost.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', color: '#34d399' }}>
                ✓ Submitting will generate consultation billing (${completeAppModal.doctor?.consultationFee || 150}), mark doctor as Available, and notify Pharmacy & Lab.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Complete & Dispatch Orders</button>
                <button type="button" className="btn btn-danger" onClick={() => setCompleteAppModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
