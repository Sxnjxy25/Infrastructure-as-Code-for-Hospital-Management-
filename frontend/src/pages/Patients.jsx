import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { Plus } from 'lucide-react';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '1990-01-01', gender: 'Male', bloodGroup: 'O+', phone: '', address: '', medicalHistory: ''
  });

  // Debounce search to avoid firing API on every keystroke
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchPatients();
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const fetchPatients = async () => {
    try {
      const res = await api.get(`/patients?search=${search}`);
      setPatients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients', formData);
      setShowModal(false);
      fetchPatients();
    } catch (err) {
      alert('Failed to register patient');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800 }}>Patient Records & Admissions</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Register New Patient</span>
        </button>
      </div>

      <div className="glass-card">
        <div className="form-group" style={{ maxWidth: '350px', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by MRN, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Blood Group</th>
              <th>Contact Phone</th>
              <th>Medical History</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td><span className="user-badge">{p.mrn}</span></td>
                <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                <td>{p.gender}</td>
                <td><span style={{ color: '#ef4444', fontWeight: 700 }}>{p.bloodGroup || 'N/A'}</span></td>
                <td>{p.phone}</td>
                <td style={{ color: '#94a3b8' }}>{p.medicalHistory || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="login-box" style={{ maxWidth: '500px' }}>
            <h3>Register Patient</h3>
            <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>First Name</label><input type="text" className="form-control" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" className="form-control" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Date of Birth</label><input type="date" className="form-control" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
                <div className="form-group"><label>Gender</label><select className="form-control" onChange={(e) => setFormData({...formData, gender: e.target.value})}><option>Male</option><option>Female</option></select></div>
              </div>
              <div className="form-group"><label>Phone Number</label><input type="text" className="form-control" required onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Medical History</label><textarea className="form-control" onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}></textarea></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Patient</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
