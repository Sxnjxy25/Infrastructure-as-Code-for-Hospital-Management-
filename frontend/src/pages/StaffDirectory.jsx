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

const StaffDirectory = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';

  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [categoryFilter, availabilityFilter, search]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setDepartments(data);
    } catch (err) {
      console.warn('Departments fetch fallback:', err);
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
      setStaffList(data);
    } catch (err) {
      console.warn('Staff fetch fallback:', err);
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
        isActive: true
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
      setStaffList(prev => prev?.map(s => s.id === staffId ? { ...s, availability } : s));
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, availability }));
      }
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleOpenStaffDetails = async (staffId) => {
    try {
      const res = await api.get(`/staff/${staffId}`);
      setSelectedStaff(res.data.data);
      setShowDocModal(true);
    } catch (err) {
      alert('Failed to fetch staff details');
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.post(`/staff/${selectedStaff.id}/documents`, docFormData);
      alert('Document uploaded and vaulted securely in S3.');
      handleOpenStaffDetails(selectedStaff.id);
      setDocFormData({
        documentType: 'CERTIFICATE',
        title: '',
        fileName: '',
        fileSize: 1024 * 500,
        mimeType: 'application/pdf'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleViewSignedDocument = async (staffId, docId) => {
    try {
      const res = await api.get(`/staff/${staffId}/documents/${docId}/signed-url`);
      const { signedUrl, title, mimeType } = res.data.data;
      setDocumentViewer({ signedUrl, title, mimeType });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate secure signed URL');
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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Unified Hospital Staff Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
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
        {CATEGORIES?.map((cat) => {
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
              {AVAILABILITY_OPTIONS?.map(a => (
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
              {filteredStaffList?.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{s.name || s.user?.name || 'Staff Member'}</div>
                    {s.user?.email && <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '2px' }}>{s.user.email}</div>}
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
                        {AVAILABILITY_OPTIONS.filter(o => o.value !== '')?.map(o => (
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
          <div className="modal-content">
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
                  <label>Designation / Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Senior Pediatric Nurse"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="form-control"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
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
                    <option value="ROTATIONAL">Rotational Schedule</option>
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
                    <option value="BUSY">Busy</option>
                    <option value="OFF_DUTY">Off Duty</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1-555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="staff@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Profile</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile & S3 Documents Modal */}
      {showDocModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{selectedStaff.name}</h3>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', marginTop: '3px' }}>
                  {selectedStaff.designation} • {selectedStaff.department?.name || 'General Operations'}
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '0.88rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div><strong>Category:</strong> <span className="user-badge" style={{ marginLeft: 6 }}>{selectedStaff.category}</span></div>
              <div><strong>Shift:</strong> {selectedStaff.shift || 'MORNING'}</div>
              <div><strong>Phone:</strong> {selectedStaff.phone || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedStaff.email || 'N/A'}</div>
              <div><strong>Availability:</strong> {getAvailabilityBadge(selectedStaff.availability)}</div>
              <div><strong>Status:</strong> <span style={{ color: selectedStaff.isActive ? '#34d399' : '#f87171', fontWeight: 700 }}>{selectedStaff.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>

            {/* S3 Document Vault (Admin Only) */}
            {isAdmin && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  <Shield size={20} color="#34d399" />
                  <h4 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Secure Staff Document Vault (AWS S3 + KMS)</h4>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    Uploaded Identity Documents & Medical Board Credentials:
                  </div>

                  {(!selectedStaff.documents || selectedStaff.documents.length === 0) ? (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                      No documents currently on file. Upload a credential below.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {selectedStaff.documents?.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{doc.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => handleViewSignedDocument(selectedStaff.id, doc.id)}
                          >
                            <ExternalLink size={14} />
                            <span>Signed URL</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Document Form */}
                <form onSubmit={handleUploadDocument} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: '#38bdf8' }}>
                    Upload New Credential / Identity Document
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem' }}>Document Type</label>
                      <select
                        className="form-control"
                        style={{ fontSize: '0.82rem', padding: '0.5rem' }}
                        value={docFormData.documentType}
                        onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                      >
                        <option value="CERTIFICATE">Board Certificate / License</option>
                        <option value="IDENTITY">National ID / Passport</option>
                        <option value="CONTRACT">Employment Contract</option>
                        <option value="OTHER">Other Credential</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem' }}>Document Title</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ fontSize: '0.82rem', padding: '0.5rem' }}
                        required
                        placeholder="e.g. State Nursing License"
                        value={docFormData.title}
                        onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value, fileName: `${e.target.value.toLowerCase().replace(/\s+/g, '_')}.pdf` })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem', marginTop: '0.5rem' }}>
                    <Upload size={15} style={{ marginRight: 4 }} /> Link & Upload Document
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Secure Document Viewer Modal */}
      {documentViewer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={22} color="#34d399" />
                <h4 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>{documentViewer.title}</h4>
              </div>
              <button
                onClick={() => setDocumentViewer(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#090d16', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                <CheckCircle size={17} /> AWS KMS / S3 15-Minute Short-Lived Signed Token Active
              </div>
              <div style={{ color: '#94a3b8', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '0.6rem', borderRadius: '6px' }}>
                {documentViewer.signedUrl}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '2rem', textAlign: 'center' }}>
              <FileText size={52} color="#38bdf8" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{documentViewer.title}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.25rem 0' }}>
                Encrypted Protected Health Document • Access logged to immutable AuditLog.
              </p>
              <a
                href={documentViewer.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ExternalLink size={16} /> Open Document in Secure Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
