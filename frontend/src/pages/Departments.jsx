import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, Plus, CheckCircle2, XCircle, Users, X } from 'lucide-react';

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
      const res = await api.get('/departments?includeInactive=true');
      setDepartments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', formData);
      setShowModal(false);
      setFormData({ code: '', name: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.put(`/departments/${id}`, { isActive: !currentStatus });
      fetchDepartments();
    } catch (err) {
      alert('Failed to update department status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Hospital Department Management
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configure hospital operational divisions, assign clinical staff, and manage department availability.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading departments...</div>
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
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dept.description || 'General Operational Department'}</td>
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
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={24} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Add Hospital Department</h3>
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
                  placeholder="e.g. CARD, ONC, PAI"
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
