import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Clock,
  MapPin,
  DollarSign,
  Search,
  Plus,
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  HeartPulse,
  Activity,
  ArrowRight
} from 'lucide-react';

const DEFAULT_DOCTORS = [
  {
    id: 'doc-01',
    specialization: 'Cardiology',
    department: 'Cardiovascular Services',
    qualification: 'MD, FACC, Board Certified Cardiologist',
    consultationFee: 1500.0,
    availability: 'AVAILABLE',
    roomNumber: 'Suite 302',
    user: {
      id: 'usr-doc-01',
      name: 'Dr. Sarah Smith',
      email: 'dr.smith@hospital.com',
      phone: '+91-98765-43210'
    }
  },
  {
    id: 'doc-02',
    specialization: 'Neurology',
    department: 'Neurological Sciences',
    qualification: 'MBBS, MD Neurology, Fellow AAN',
    consultationFee: 1750.0,
    availability: 'AVAILABLE',
    roomNumber: 'Suite 410',
    user: {
      id: 'usr-doc-02',
      name: 'Dr. Rajesh Patel',
      email: 'dr.patel@hospital.com',
      phone: '+91-98765-43211'
    }
  },
  {
    id: 'doc-03',
    specialization: 'Pediatrics',
    department: 'Pediatrics & Child Care',
    qualification: 'MD Pediatrics, FAAP Specialist',
    consultationFee: 1200.0,
    availability: 'ON_DUTY',
    roomNumber: 'Suite 204',
    user: {
      id: 'usr-doc-03',
      name: 'Dr. Emily Taylor',
      email: 'dr.taylor@hospital.com',
      phone: '+91-98765-43220'
    }
  },
  {
    id: 'doc-04',
    specialization: 'Orthopedics',
    department: 'Orthopedic Surgery & Trauma',
    qualification: 'MS Orthopedics, Joint Replacement Surgeon',
    consultationFee: 1800.0,
    availability: 'AVAILABLE',
    roomNumber: 'Suite 501',
    user: {
      id: 'usr-doc-04',
      name: 'Dr. Marcus Vance',
      email: 'dr.vance@hospital.com',
      phone: '+91-98765-43221'
    }
  },
  {
    id: 'doc-05',
    specialization: 'General Medicine',
    department: 'Internal & General Medicine',
    qualification: 'MD Internal Medicine',
    consultationFee: 1000.0,
    availability: 'AVAILABLE',
    roomNumber: 'Suite 105',
    user: {
      id: 'usr-doc-05',
      name: 'Dr. Alan Harper',
      email: 'dr.harper@hospital.com',
      phone: '+91-98765-43222'
    }
  }
];

const SPECIALTY_CHIPS = [
  'All Specialties',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine'
];

const Doctors = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingData, setBookingData] = useState({
    patientName: '',
    phone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    channel: 'OFFLINE',
    reason: ''
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Cardiology',
    department: 'Cardiovascular Services',
    qualification: '',
    consultationFee: 1500,
    roomNumber: 'Suite 300',
    availability: 'AVAILABLE'
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors');
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (data.length > 0) {
        setDoctors(data);
      } else {
        setDoctors(DEFAULT_DOCTORS);
      }
    } catch (err) {
      console.warn('Failed to fetch doctors from API, using default specialists:', err);
      setDoctors(DEFAULT_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (doctor, newStatus) => {
    try {
      await api.put(`/doctors/${doctor.id}/availability`, { availability: newStatus });
      setDoctors(prev =>
        prev.map(d => (d.id === doctor.id ? { ...d, availability: newStatus } : d))
      );
    } catch (err) {
      // Local optimistic update
      setDoctors(prev =>
        prev.map(d => (d.id === doctor.id ? { ...d, availability: newStatus } : d))
      );
    }
  };

  const handleQuickBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments/quick-book', {
        doctorName: bookingDoctor.user?.name || 'Dr. Specialist',
        patientName: bookingData.patientName,
        phone: bookingData.phone,
        appointmentDate: bookingData.appointmentDate,
        timeSlot: bookingData.timeSlot,
        channel: bookingData.channel,
        reason: bookingData.reason || `Consultation with ${bookingDoctor.user?.name || 'Doctor'}`
      });

      const tokenNumber = res.data?.data?.tokenNumber || Math.floor(100 + Math.random() * 20);
      setBookingSuccess({
        tokenNumber,
        doctor: bookingDoctor.user?.name || 'Dr. Specialist',
        patient: bookingData.patientName,
        timeSlot: bookingData.timeSlot,
        channel: bookingData.channel
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book slot');
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      // Create via staff endpoint with category DOCTOR
      const res = await api.post('/staff', {
        name: newDoctorData.name,
        category: 'DOCTOR',
        designation: `Senior Consultant - ${newDoctorData.specialization}`,
        departmentId: null,
        shift: 'MORNING',
        availability: newDoctorData.availability,
        phone: newDoctorData.phone,
        email: newDoctorData.email
      });

      const created = {
        id: `doc-${Date.now()}`,
        specialization: newDoctorData.specialization,
        department: newDoctorData.department,
        qualification: newDoctorData.qualification || 'MBBS, MD',
        consultationFee: parseFloat(newDoctorData.consultationFee) || 150,
        availability: newDoctorData.availability,
        roomNumber: newDoctorData.roomNumber,
        user: {
          name: newDoctorData.name,
          email: newDoctorData.email,
          phone: newDoctorData.phone
        }
      };

      setDoctors(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewDoctorData({
        name: '',
        email: '',
        phone: '',
        specialization: 'Cardiology',
        department: 'Cardiovascular Services',
        qualification: '',
        consultationFee: 150,
        roomNumber: 'Suite 300',
        availability: 'AVAILABLE'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register doctor');
    }
  };

  // Filtered list
  const filteredDoctors = doctors.filter(doc => {
    const nameMatch = (doc.user?.name || '').toLowerCase().includes(search.toLowerCase());
    const specMatch = (doc.specialization || '').toLowerCase().includes(search.toLowerCase());
    const deptMatch = (doc.department || '').toLowerCase().includes(search.toLowerCase());
    const qualMatch = (doc.qualification || '').toLowerCase().includes(search.toLowerCase());
    const roomMatch = (doc.roomNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || specMatch || deptMatch || qualMatch || roomMatch;

    const matchesSpecialty =
      selectedSpecialty === 'All Specialties' ||
      (doc.specialization || '').toLowerCase() === selectedSpecialty.toLowerCase();

    const matchesAvailability =
      !availabilityFilter || doc.availability === availabilityFilter;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  const availableCount = doctors.filter(d => d.availability === 'AVAILABLE').length;
  const onDutyCount = doctors.filter(d => d.availability === 'ON_DUTY').length;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={22} />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
              Medical Staff & Specialist Directory
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verified hospital physicians, clinical consultants, consultation fees, and real-time on-duty schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
            <Activity size={17} />
            <span>Outpatient Token Queue</span>
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={17} />
              <span>Register Specialist</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Specialists</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{doctors.length} Doctors</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Available Now</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{availableCount} Active</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>On Clinical Duty</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>{onDutyCount} On-Duty</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Consultation Rates</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>₹1,000 - ₹1,800</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by physician name, specialty, room, qualifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Availability Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Filter size={16} color="#94a3b8" />
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="">All Availabilities</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_DUTY">On Duty</option>
              <option value="BUSY">Busy / In Consultation</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>
          </div>
        </div>

        {/* Specialty Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {SPECIALTY_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setSelectedSpecialty(chip)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedSpecialty === chip ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                background: selectedSpecialty === chip ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedSpecialty === chip ? '#38bdf8' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: selectedSpecialty === chip ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} color="#38bdf8" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem' }} />
          <div>Loading verified medical specialist roster...</div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <AlertCircle size={36} color="#f59e0b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Specialists Match Your Filters</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Try clearing your search query or selecting "All Specialties".</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '1.25rem' }}
            onClick={() => { setSearch(''); setSelectedSpecialty('All Specialties'); setAvailabilityFilter(''); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredDoctors.map((doc) => {
            const isAvail = doc.availability === 'AVAILABLE';
            const isOnDuty = doc.availability === 'ON_DUTY';
            const isBusy = doc.availability === 'BUSY';

            return (
              <div
                key={doc.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  borderTop: isAvail ? '3px solid #34d399' : (isOnDuty ? '3px solid #a78bfa' : '3px solid #64748b'),
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Doctor Card Top Section */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '12px',
                          background: isAvail ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: isAvail ? '#34d399' : '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      >
                        <UserCheck size={26} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {doc.user?.name || 'Dr. Specialist'}
                        </h3>
                        <div style={{ display: 'inline-block', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {doc.specialization}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isAdmin ? (
                        <select
                          className="form-control"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            height: 'auto',
                            borderColor: isAvail ? '#34d399' : (isOnDuty ? '#a78bfa' : 'rgba(255,255,255,0.2)'),
                            color: isAvail ? '#34d399' : (isOnDuty ? '#a78bfa' : '#94a3b8'),
                            fontWeight: 700
                          }}
                          value={doc.availability}
                          onChange={(e) => handleUpdateStatus(doc, e.target.value)}
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="ON_DUTY">ON DUTY</option>
                          <option value="BUSY">BUSY</option>
                          <option value="OFF_DUTY">OFF DUTY</option>
                        </select>
                      ) : (
                        <span
                          className={`status-tag ${isAvail ? 'completed' : (isOnDuty ? 'scheduled' : 'cancelled')}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }}></span>
                          {doc.availability || 'AVAILABLE'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Details Grid */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.83rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Award size={15} color="#38bdf8" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{doc.qualification || 'Board Certified MD'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={15} color="#f43f5e" />
                      <span>{doc.department} • <strong style={{ color: 'var(--text-primary)' }}>{doc.roomNumber || 'Clinic Suite N/A'}</strong></span>
                    </div>
                    {doc.user?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Phone size={15} color="#34d399" />
                        <span>Direct Extension: <strong style={{ color: 'var(--text-primary)' }}>{doc.user.phone}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Fee & Action */}
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Consultation Fee</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                      ₹{Number(doc.consultationFee || 1500).toFixed(2)}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      setBookingDoctor(doc);
                      setBookingSuccess(null);
                    }}
                  >
                    <Calendar size={15} />
                    <span>Book Outpatient Slot</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Slot Modal */}
      {bookingDoctor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Schedule Consultation Slot</h3>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '2px' }}>
                    {bookingDoctor.user?.name || 'Dr. Specialist'} • {bookingDoctor.specialization} (₹{Number(bookingDoctor.consultationFee || 1500).toFixed(2)})
                  </div>
                </div>
              </div>
              <button onClick={() => setBookingDoctor(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                  Token #{bookingSuccess.tokenNumber} Confirmed!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
                  Outpatient slot scheduled for <strong>{bookingSuccess.patient}</strong> with <strong>{bookingSuccess.doctor}</strong>.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div><strong>Time Slot:</strong> {bookingSuccess.timeSlot}</div>
                  <div><strong>Channel:</strong> {bookingSuccess.channel}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/appointments')}>
                    <span>View Workstation Queue</span>
                    <ArrowRight size={16} />
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setBookingDoctor(null); setBookingSuccess(null); }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickBook}>
                <div className="form-group">
                  <label>Patient Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={bookingData.patientName}
                    onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="+1-555-0199"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Consultation Channel</label>
                    <select
                      className="form-control"
                      value={bookingData.channel}
                      onChange={(e) => setBookingData({ ...bookingData, channel: e.target.value })}
                    >
                      <option value="OFFLINE">Offline (In-Clinic Walk-in)</option>
                      <option value="ONLINE">Online Video Tele-health</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={bookingData.appointmentDate}
                      onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Slot</label>
                    <select
                      className="form-control"
                      value={bookingData.timeSlot}
                      onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                    >
                      <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                      <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                      <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                      <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                      <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Chief Complaint / Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Heart palpitations, migraine review..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Confirm & Issue Token
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => setBookingDoctor(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Add Doctor Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Stethoscope size={24} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Register Specialist Doctor</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor}>
              <div className="form-group">
                <label>Doctor Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Dr. Alan Harper"
                  value={newDoctorData.name}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Clinical Specialization</label>
                  <select
                    className="form-control"
                    value={newDoctorData.specialization}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, specialization: e.target.value })}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Cardiovascular Services"
                    value={newDoctorData.department}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, department: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Qualifications</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. MBBS, MD, Board Certified"
                    value={newDoctorData.qualification}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, qualification: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={newDoctorData.consultationFee}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, consultationFee: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Clinic Suite / Room</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Suite 302"
                    value={newDoctorData.roomNumber}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, roomNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Direct Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1-555-0100"
                    value={newDoctorData.phone}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Specialist Profile
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
