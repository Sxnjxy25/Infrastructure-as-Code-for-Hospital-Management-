import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, Plus } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', appointmentDate: '', reason: '' });

  useEffect(() => {
    fetchAppointments();
    fetchDropdowns();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
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
      fetchAppointments();
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800 }}>Outpatient Appointment Queue</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Book Appointment</span>
        </button>
      </div>

      <div className="glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Token #</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app) => (
              <tr key={app.id}>
                <td><span className="user-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>#{app.tokenNumber}</span></td>
                <td style={{ fontWeight: 600 }}>{app.patient.firstName} {app.patient.lastName}</td>
                <td>{app.doctor.user.name} ({app.doctor.specialization})</td>
                <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                <td>{app.reason || 'General Consultation'}</td>
                <td><span className={`status-tag ${app.status.toLowerCase()}`}>{app.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="login-box" style={{ maxWidth: '450px' }}>
            <h3>Book Appointment</h3>
            <form onSubmit={handleBook} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Select Patient</label>
                <select className="form-control" required onChange={(e) => setFormData({...formData, patientId: e.target.value})}>
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Doctor</label>
                <select className="form-control" required onChange={(e) => setFormData({...formData, doctorId: e.target.value})}>
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.user.name} ({d.specialization})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Appointment Date & Time</label>
                <input type="datetime-local" className="form-control" required onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Reason for Visit</label>
                <input type="text" className="form-control" onChange={(e) => setFormData({...formData, reason: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Booking</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
