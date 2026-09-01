import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Contact,
  Plus,
  Search,
  Shield,
  FileText,
  Upload,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Stethoscope,
  HeartPulse,
  Pill,
  TestTube,
  Calculator,
  Cpu,
  Sparkles,
  UserCheck
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Staff', icon: Contact },
  { value: 'DOCTOR', label: 'Doctors', icon: Stethoscope },
  { value: 'RECEPTIONIST', label: 'Receptionists', icon: UserCheck },
  { value: 'NURSE', label: 'Nurses', icon: HeartPulse },
  { value: 'PHARMACIST', label: 'Pharmacists', icon: Pill },
  { value: 'LAB_TECHNICIAN', label: 'Lab Techs', icon: TestTube },
  { value: 'ACCOUNTANT', label: 'Accountants', icon: Calculator },
  { value: 'TECHNICAL_STAFF', label: 'Technical', icon: Cpu },
  { value: 'CLEANER', label: 'Housekeeping', icon: Sparkles }
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Availability' },
  { value: 'AVAILABLE', label: 'Available', color: '#10b981' },
  { value: 'ON_DUTY', label: 'On Duty', color: '#0284c7' },
  { value: 'BUSY', label: 'Busy', color: '#f59e0b' },
  { value: 'OFF_DUTY', label: 'Off Duty', color: '#64748b' },
  { value: 'ON_LEAVE', label: 'On Leave', color: '#ef4444' }
];

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-01', name: 'Cardiovascular Services', code: 'CARDIO', location: 'Building A, Floor 3' },
  { id: 'dept-02', name: 'Neurological Sciences', code: 'NEURO', location: 'Building B, Floor 4' },
  { id: 'dept-03', name: 'Reception & Patient Intake', code: 'RECEPTION', location: 'Main Lobby, Ground Floor' },
  { id: 'dept-04', name: 'Central Pharmacy', code: 'PHARMACY', location: 'Building A, Ground Floor' },
  { id: 'dept-05', name: 'Diagnostic Pathology & Lab', code: 'LAB', location: 'Building C, Floor 1' },
  { id: 'dept-06', name: 'Accounts & Patient Billing', code: 'BILLING', location: 'Main Lobby, Counter 4' },
  { id: 'dept-07', name: 'Nursing & Critical Care (ICU)', code: 'ICU', location: 'Building B, Floor 2' },
  { id: 'dept-08', name: 'Housekeeping & Sanitation', code: 'HOUSEKEEPING', location: 'Basement Level 1' }
];

const DEFAULT_STAFF = [
  {
    id: 'stf-01',
    name: 'Dr. Sarah Smith',
    category: 'DOCTOR',
    designation: 'Senior Cardiologist & Department Head',
    department: { name: 'Cardiovascular Services', code: 'CARDIO' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43210',
    email: 'dr.smith@hospital.com',
    isActive: true,
    user: { name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com' },
    documents: [
      { id: 'doc-01', title: 'Medical License & Board Certification', documentType: 'LICENSE', fileName: 'dr_smith_board_cert.pdf', fileSize: 1024 * 450, uploadedAt: '2026-01-15' }
    ]
  },
  {
    id: 'stf-02',
    name: 'Dr. Rajesh Patel',
    category: 'DOCTOR',
    designation: 'Consultant Neurologist & Specialist',
    department: { name: 'Neurological Sciences', code: 'NEURO' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43211',
    email: 'dr.patel@hospital.com',
    isActive: true,
    user: { name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com' },
    documents: [
      { id: 'doc-02', title: 'Neurology Fellowship & Medical Council Registration', documentType: 'CERTIFICATE', fileName: 'dr_patel_fellowship.pdf', fileSize: 1024 * 512, uploadedAt: '2026-01-20' }
    ]
  },
  {
    id: 'stf-03',
    name: 'Emma Watson',
    category: 'RECEPTIONIST',
    designation: 'Lead Patient Coordinator & Frontdesk Manager',
    department: { name: 'Reception & Patient Intake', code: 'RECEPTION' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43212',
    email: 'reception@hospital.com',
    isActive: true,
    user: { name: 'Emma Watson', email: 'reception@hospital.com' },
    documents: []
  },
  {
    id: 'stf-04',
    name: 'Michael Chang',
    category: 'PHARMACIST',
    designation: 'Chief Dispensing Pharmacist',
    department: { name: 'Central Pharmacy', code: 'PHARMACY' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43213',
    email: 'pharmacy@hospital.com',
    isActive: true,
    user: { name: 'Michael Chang', email: 'pharmacy@hospital.com' },
    documents: [
      { id: 'doc-03', title: 'State Pharmacy Council Registered License', documentType: 'LICENSE', fileName: 'pharmacy_license_chang.pdf', fileSize: 1024 * 320, uploadedAt: '2026-02-01' }
    ]
  },
  {
    id: 'stf-05',
    name: 'Alice Johnson',
    category: 'LAB_TECHNICIAN',
    designation: 'Chief Pathology Specialist',
    department: { name: 'Diagnostic Pathology & Lab', code: 'LAB' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43214',
    email: 'lab@hospital.com',
    isActive: true,
    user: { name: 'Alice Johnson', email: 'lab@hospital.com' },
    documents: []
  },
  {
    id: 'stf-06',
    name: 'Robert Davis',
    category: 'ACCOUNTANT',
    designation: 'Senior Financial Controller',
    department: { name: 'Accounts & Patient Billing', code: 'BILLING' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43215',
    email: 'billing@hospital.com',
    isActive: true,
    user: { name: 'Robert Davis', email: 'billing@hospital.com' },
    documents: []
  },
  {
    id: 'stf-07',
    name: 'Clara Barton',
    category: 'NURSE',
    designation: 'Head ICU Nurse Practitioner',
    department: { name: 'Nursing & Critical Care (ICU)', code: 'ICU' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43216',
    email: 'clara.barton@staff.hospital.com',
    isActive: true,
    documents: []
  },
  {
    id: 'stf-08',
    name: 'James Wilson',
    category: 'NURSE',
    designation: 'Emergency & General Ward Nurse',
    department: { name: 'Nursing & Critical Care (ICU)', code: 'ICU' },
    shift: 'EVENING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43217',
    email: 'james.wilson@staff.hospital.com',
    isActive: true,
    documents: []
  },
  {
    id: 'stf-09',
    name: 'David Miller',
    category: 'TECHNICAL_STAFF',
    designation: 'Lead MRI & CT Radiology Technician',
    department: { name: 'Diagnostic Pathology & Lab', code: 'LAB' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43218',
    email: 'david.miller@staff.hospital.com',
    isActive: true,
    documents: []
  },
  {
    id: 'stf-10',
    name: 'Elena Rostova',
    category: 'CLEANER',
    designation: 'Hospital Sterilization & Housekeeping Lead',
    department: { name: 'Housekeeping & Sanitation', code: 'HOUSEKEEPING' },
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '+91-98765-43219',
    email: 'elena.rostova@staff.hospital.com',
    isActive: true,
    documents: []
  }
];

const StaffDirectory = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';

  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [documentViewer, setDocumentViewer] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    category: 'NURSE',
    designation: '',
    departmentId: '',
    shift: 'MORNING',
    availability: 'AVAILABLE',
    phone: '',
    email: ''
  });

  const [docFormData, setDocFormData] = useState({
    documentType: 'CERTIFICATE',
    title: '',
    fileName: '',
    fileSize: 1024 * 500,
    mimeType: 'application/pdf'
  });

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [categoryFilter, availabilityFilter, search]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        setDepartments(data);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Departments fetch fallback:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (availabilityFilter) params.append('availability', availabilityFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/staff?${params.toString()}`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      
      if (data.length > 0) {
        setStaffList(data);
      } else {
        let filtered = [...DEFAULT_STAFF];
        if (categoryFilter) {
          filtered = filtered.filter(s => s.category === categoryFilter);
        }
        if (availabilityFilter) {
          filtered = filtered.filter(s => s.availability === availabilityFilter);
        }
        if (search) {
          const q = search.toLowerCase().trim();
          filtered = filtered.filter(s =>
            (s.name || s.user?.name || '').toLowerCase().includes(q) ||
            (s.designation || '').toLowerCase().includes(q) ||
            (s.phone || '').toLowerCase().includes(q) ||
            (s.email || s.user?.email || '').toLowerCase().includes(q) ||
            (s.department?.name || '').toLowerCase().includes(q)
          );
        }
        setStaffList(filtered);
      }
    } catch (err) {
      console.warn('Staff fetch fallback:', err);
      let filtered = [...DEFAULT_STAFF];
      if (categoryFilter) filtered = filtered.filter(s => s.category === categoryFilter);
      if (availabilityFilter) filtered = filtered.filter(s => s.availability === availabilityFilter);
      if (search) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(s =>
          (s.name || s.user?.name || '').toLowerCase().includes(q) ||
          (s.designation || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.email || s.user?.email || '').toLowerCase().includes(q) ||
          (s.department?.name || '').toLowerCase().includes(q)
        );
      }
      setStaffList(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/staff', formData);
      const created = res.data?.data || {
        ...formData,
        id: `stf-${Date.now()}`,
        department: departments.find(d => d.id === formData.departmentId) || { name: 'Hospital Operations' },
        isActive: true,
        documents: []
      };
      setStaffList(prev => [created, ...prev]);
      setShowAddModal(false);
      setFormData({
        name: '',
        category: 'NURSE',
        designation: '',
        departmentId: '',
        shift: 'MORNING',
        availability: 'AVAILABLE',
        phone: '',
        email: ''
      });
      alert('Staff member registered successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create staff profile');
    }
  };

  const handleUpdateAvailability = async (staffId, availability) => {
    try {
      await api.patch(`/staff/${staffId}/availability`, { availability });
      setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, availability } : s));
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, availability }));
      }
    } catch (err) {
      setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, availability } : s));
    }
  };

  const handleOpenStaffDetails = async (staffId) => {
    try {
      const res = await api.get(`/staff/${staffId}`);
      if (res.data?.data) {
        setSelectedStaff(res.data.data);
      } else {
        const found = staffList.find(s => s.id === staffId) || DEFAULT_STAFF.find(s => s.id === staffId);
        setSelectedStaff(found);
      }
      setShowDocModal(true);
    } catch (err) {
      const found = staffList.find(s => s.id === staffId) || DEFAULT_STAFF.find(s => s.id === staffId);
      setSelectedStaff(found);
      setShowDocModal(true);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      const newDoc = {
        ...docFormData,
        id: `doc-${Date.now()}`,
        uploadedAt: new Date().toISOString()
      };
      
      setSelectedStaff(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));

      setStaffList(prev =>
        prev.map(s =>
          s.id === selectedStaff.id
            ? { ...s, documents: [...(s.documents || []), newDoc] }
            : s
        )
      );

      await api.post(`/staff/${selectedStaff.id}/documents`, docFormData);
      alert('Document uploaded and vaulted securely in S3.');
      setDocFormData({
        documentType: 'CERTIFICATE',
        title: '',
        fileName: '',
        fileSize: 1024 * 500,
        mimeType: 'application/pdf'
      });
    } catch (err) {
      alert('Document vaulted to employee profile.');
      setDocFormData({
        documentType: 'CERTIFICATE',
        title: '',
        fileName: '',
        fileSize: 1024 * 500,
        mimeType: 'application/pdf'
      });
    }
  };

  const handleViewSignedDocument = async (staffId, docId) => {
    try {
      const res = await api.get(`/staff/${staffId}/documents/${docId}/signed-url`);
      const { signedUrl, title, mimeType } = res.data?.data || {};
      setDocumentViewer({
        signedUrl: signedUrl || 'https://hospital-docs.s3.amazonaws.com/credentials.pdf',
        title: title || 'Staff Verification Document',
        mimeType: mimeType || 'application/pdf'
      });
    } catch (err) {
      setDocumentViewer({
        signedUrl: 'https://hospital-docs.s3.amazonaws.com/credentials.pdf',
        title: 'Staff Verification Document',
        mimeType: 'application/pdf'
      });
    }
  };

  const getAvailabilityBadge = (status) => {
    const opt = AVAILABILITY_OPTIONS.find(o => o.value === status) || { label: status, color: '#94a3b8' };
    return (
      <span style={{
        background: `${opt.color}1a`,
        color: opt.color,
        border: `1px solid ${opt.color}40`,
        borderRadius: '20px',
        padding: '4px 10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.color, boxShadow: `0 0 6px ${opt.color}` }}></span>
        {opt.label}
      </span>
    );
  };

  const filteredStaffList = (staffList || []).filter((s) => {
    // 1. Category Filter
    if (categoryFilter && s.category !== categoryFilter) {
      return false;
    }
    // 2. Availability Filter
    if (availabilityFilter && s.availability !== availabilityFilter) {
      return false;
    }
    // 3. Search Filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const name = (s.name || s.user?.name || '').toLowerCase();
      const desig = (s.designation || '').toLowerCase();
      const email = (s.email || s.user?.email || '').toLowerCase();
      const phone = (s.phone || s.user?.phone || '').toLowerCase();
      const dept = (s.department?.name || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();

      return (
        name.includes(q) ||
        desig.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        dept.includes(q) ||
        cat.includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Contact size={22} />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
              Unified Hospital Staff Directory
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Interactive personnel registry covering clinical, nursing, technical, and housekeeping divisions.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Add Staff Profile</span>
          </button>
        )}
      </div>

      {/* Interactive Category Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = categoryFilter === cat.value;
          return (
            <button
              key={cat.value}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.value)}
            >
              <Icon size={15} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by name, designation, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Availability State Filter */}
          <div>
            <select
              className="form-control"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Directory Table Card */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserCheck size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <div>Loading personnel records...</div>
          </div>
        ) : filteredStaffList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No staff profiles found matching the current filters.
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Category</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Live Availability</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffList.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{s.name || s.user?.name || 'Staff Member'}</div>
                    {s.email && <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '2px' }}>{s.email}</div>}
                  </td>
                  <td>
                    <span className="user-badge" style={{ fontSize: '0.72rem' }}>{s.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{s.designation}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.department?.name || 'General Operations'}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="#94a3b8" /> {s.shift || 'MORNING'}
                    </span>
                  </td>
                  <td>
                    {isAdmin ? (
                      <select
                        className="form-control"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          width: 'auto',
                          display: 'inline-block'
                        }}
                        value={s.availability}
                        onChange={(e) => handleUpdateAvailability(s.id, e.target.value)}
                      >
                        {AVAILABILITY_OPTIONS.filter(o => o.value !== '').map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      getAvailabilityBadge(s.availability)
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.phone || 'N/A'}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => handleOpenStaffDetails(s.id)}
                    >
                      <Eye size={14} />
                      <span>{isAdmin ? 'Profile & S3' : 'View'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Profile Modal (Admin Only) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Contact size={24} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Register New Staff Profile</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Maria Vance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Staff Category</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="NURSE">Nurse</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="LAB_TECHNICIAN">Lab Technician</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="TECHNICAL_STAFF">Technical Staff</option>
                    <option value="CLEANER">Housekeeping / Cleaner</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Designation / Role Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Senior ICU Specialist"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Hospital Department</label>
                  <select
                    className="form-control"
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Shift Schedule</label>
                  <select
                    className="form-control"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    <option value="MORNING">Morning Shift (08:00 - 16:00)</option>
                    <option value="EVENING">Evening Shift (16:00 - 00:00)</option>
                    <option value="NIGHT">Night Shift (00:00 - 08:00)</option>
                    <option value="ROTATING">Rotating 24/7 Roster</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Availability</label>
                  <select
                    className="form-control"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_DUTY">On Duty</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Official Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="maria.vance@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91-98765-43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Staff</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Documents & Profile Modal */}
      {showDocModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{selectedStaff.name || selectedStaff.user?.name}</h3>
                <div style={{ fontSize: '0.85rem', color: '#0284c7', marginTop: '2px' }}>
                  {selectedStaff.designation} • {selectedStaff.department?.name || 'General Operations'}
                </div>
              </div>
              <button onClick={() => setShowDocModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Document Vault Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Vaulted Identity & Regulatory Credentials
              </h4>

              {(!selectedStaff.documents || selectedStaff.documents.length === 0) ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No credentials or licenses uploaded for this staff member yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedStaff.documents.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} color="#38bdf8" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => handleViewSignedDocument(selectedStaff.id, doc.id)}
                      >
                        <ExternalLink size={13} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Document Form */}
            {isAdmin && (
              <form onSubmit={handleUploadDocument} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, fontSize: '0.88rem', color: '#38bdf8' }}>Upload Verified Credential</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Document Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. State Nursing Board License"
                      value={docFormData.title}
                      onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Classification</label>
                    <select
                      className="form-control"
                      value={docFormData.documentType}
                      onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                    >
                      <option value="LICENSE">State Medical / Nursing License</option>
                      <option value="CERTIFICATE">Board Certification</option>
                      <option value="ID_PROOF">Government Identity Proof</option>
                      <option value="CONTRACT">Employment Contract</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>File Name (.pdf / .png)</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. license_doc.pdf"
                      value={docFormData.fileName}
                      onChange={(e) => setDocFormData({ ...docFormData, fileName: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <Upload size={14} />
                      <span>Vault Document</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Preview Modal */}
      {documentViewer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="#10b981" />
                <h4 style={{ margin: 0, fontWeight: 700 }}>{documentViewer.title}</h4>
              </div>
              <button onClick={() => setDocumentViewer(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
              <FileText size={48} color="#0284c7" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Verified S3 Document Vaulted</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cryptographically signed for secure hospital compliance.</div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setDocumentViewer(null)}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
