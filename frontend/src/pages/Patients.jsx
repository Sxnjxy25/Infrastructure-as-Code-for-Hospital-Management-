import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { Plus, Search, User, Phone, MapPin, Heart, Activity, AlertCircle, X } from 'lucide-react';

const DEFAULT_PATIENTS = [
  { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe', dateOfBirth: '1988-05-14', gender: 'Male', bloodGroup: 'O+', phone: '+1-555-0104', address: '123 Health Ave, Metro City', emergencyContact: 'Jane Doe (+1-555-0190)', medicalHistory: 'Hypertension, Seasonal Allergies' },
  { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance', dateOfBirth: '1994-09-22', gender: 'Female', bloodGroup: 'A+', phone: '+1-555-0199', address: '456 Elm Street, Metro City', emergencyContact: 'Thomas Vance (+1-555-0198)', medicalHistory: 'Chronic Migraines' },
  { id: 'pat-03', mrn: 'MRN-2026-003', firstName: 'Alex', lastName: 'Morgan', dateOfBirth: '1991-11-05', gender: 'Female', bloodGroup: 'B+', phone: '+1-555-6492', address: '789 Oak Lane, Metro City', emergencyContact: 'Sarah Morgan (+1-555-6490)', medicalHistory: 'None' },
  { id: 'pat-04', mrn: 'MRN-2026-004', firstName: 'Lisa', lastName: 'Ray', dateOfBirth: '1985-02-18', gender: 'Female', bloodGroup: 'AB+', phone: '+1-555-4411', address: '101 Pine Blvd, Metro City', emergencyContact: 'David Ray (+1-555-4410)', medicalHistory: 'Asthma (Mild)' }
];

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    address: '',
    emergencyContact: '',
    medicalHistory: ''
  });

  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients?search=${encodeURIComponent(search)}`);
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (data.length > 0) {
        setPatients(data);
      } else if (!search) {
        setPatients(DEFAULT_PATIENTS);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.warn('Failed to fetch patients from API, using default fallback:', err);
      if (!search) setPatients(DEFAULT_PATIENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', formData);
      const created = res.data?.data || {
        ...formData,
        id: `pat-${Date.now()}`,
        mrn: `MRN-2026-${String(patients.length + 1).padStart(3, '0')}`
      };
      setPatients(prev => [created, ...prev]);
      setShowModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '',
        address: '',
        emergencyContact: '',
        medicalHistory: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register patient');
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
            Patient Records & Admissions
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Comprehensive EHR repository, medical history, blood groups, and demographic records.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Register New Patient</span>
        </button>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by MRN, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Registered: <strong style={{ color: 'var(--text-primary)' }}>{patients.length}</strong>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={28} color="#38bdf8" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.75rem' }} />
            <div>Loading patient registry...</div>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
            <div>No matching patient records found.</div>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>MRN</th>
                <th>Full Name</th>
                <th>Gender / Age</th>
                <th>Blood Group</th>
                <th>Contact Phone</th>
                <th>Address</th>
                <th>Medical History</th>
              </tr>
            </thead>
            <tbody>
              {patients?.map((p) => (
                <tr key={p.id}>
                  <td><span className="user-badge">{p.mrn}</span></td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.gender}</td>
                  <td>
                    <span style={{ color: '#ef4444', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.bloodGroup || 'N/A'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.phone}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.address || 'Metro City'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '240px' }}>
                    {p.medicalHistory || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Register New Inpatient / Outpatient</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" className="form-control" required placeholder="e.g. John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-control" required placeholder="e.g. Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" className="form-control" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select className="form-control" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Primary Phone</label>
                  <input type="tel" className="form-control" required placeholder="+1-555-0100" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input type="text" className="form-control" placeholder="Name & Phone" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Residential Address</label>
                <input type="text" className="form-control" placeholder="123 Health Ave, Metro City" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Medical History & Pre-existing Conditions</label>
                <textarea className="form-control" rows={2} placeholder="Hypertension, asthma, drug allergies..." value={formData.medicalHistory} onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Patient Record</button>
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
