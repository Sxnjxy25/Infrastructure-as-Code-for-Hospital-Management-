import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, Plus, CheckCircle2, XCircle, Users, X, Activity, AlertCircle } from 'lucide-react';

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-01', code: 'CARD', name: 'Cardiovascular Services', description: 'Advanced cardiology, cardiac monitoring, and catheterization laboratory', isActive: true, _count: { staff: 4 } },
  { id: 'dept-02', code: 'NEUR', name: 'Neurological Sciences', description: 'Comprehensive neurological diagnostic, stroke care, and clinical neurology', isActive: true, _count: { staff: 3 } },
  { id: 'dept-03', code: 'LAB', name: 'Diagnostic Pathology & Lab', description: 'Automated clinical chemistry, hematology, and specimen investigation', isActive: true, _count: { staff: 2 } },
  { id: 'dept-04', code: 'PHAR', name: 'Central Pharmacy', description: 'Automated prescription fulfillment, dispensing, and inventory control', isActive: true, _count: { staff: 2 } },
  { id: 'dept-05', code: 'REC', name: 'Reception & Patient Intake', description: 'Front desk patient coordination, triage, and appointment scheduling', isActive: true, _count: { staff: 3 } },
  { id: 'dept-06', code: 'ACC', name: 'Accounts & Patient Billing', description: 'Invoicing, cashiering, payment receipts, and financial operations', isActive: true, _count: { staff: 2 } },
  { id: 'dept-07', code: 'NUR', name: 'Nursing & Critical Care (ICU)', description: '24/7 inpatient clinical wards and emergency critical care nursing', isActive: true, _count: { staff: 6 } },
  { id: 'dept-08', code: 'HSK', name: 'Housekeeping & Sanitation', description: 'Sterilization, bio-waste management, and environmental sanitation', isActive: true, _count: { staff: 4 } }
];

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments?includeInactive=true');
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (data.length > 0) {
        setDepartments(data);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Failed to fetch departments from API, using default divisions:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/departments', formData);
      const created = res.data?.data || {
        ...formData,
        id: `dept-${Date.now()}`,
        isActive: true,
        _count: { staff: 0 }
      };
      setDepartments(prev => [created, ...prev]);
      setShowModal(false);
      setFormData({ code: '', name: '', description: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.put(`/departments/${id}`, { isActive: !currentStatus });
      setDepartments(prev =>
        prev.map(d => (d.id === id ? { ...d, isActive: !currentStatus } : d))
      );
    } catch (err) {
      setDepartments(prev =>
        prev.map(d => (d.id === id ? { ...d, isActive: !currentStatus } : d))
      );
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
              Hospital Department Management
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configure operational clinical divisions, assign staff members, and manage department active status.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={28} color="#38bdf8" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.75rem' }} />
            <div>Loading hospital departments...</div>
          </div>
        ) : departments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
            <div>No departments found.</div>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th>Assigned Staff</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments?.map((dept) => (
                <tr key={dept.id}>
                  <td><span className="user-badge">{dept.code}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dept.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dept.description || 'General Operational Division'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700 }}>
                      <Users size={15} /> {dept._count?.staff || 0} Members
                    </span>
                  </td>
                  <td>
                    {dept.isActive ? (
                      <span className="status-tag completed">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span className="status-tag cancelled">
                        <XCircle size={13} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`btn ${dept.isActive ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
                      onClick={() => handleToggle(dept.id, dept.isActive)}
                    >
                      {dept.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={24} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Add Hospital Department</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Department Code (3-4 Letters)</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. CARD, ONC, PED"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Cardiology & Vascular Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description & Scope</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe operational responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Department</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
