import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  TestTube,
  Plus,
  Play,
  CheckCircle2,
  FileCheck,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';

const Laboratory = () => {
  const { user } = useContext(AuthContext);
  const isLabTech = user?.role === 'LAB_TECHNICIAN' || user?.role === 'ADMIN';

  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Add Test Request Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    category: 'Hematology',
    cost: 50.00,
    requestedBy: ''
  });

  // Complete Results Modal
  const [completeModalTest, setCompleteModalTest] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [reportUrl, setReportUrl] = useState('');

  useEffect(() => {
    fetchLabTests();
    fetchPatients();
  }, [statusFilter]);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/lab/tests?status=${statusFilter}` : '/lab/tests';
      const res = await api.get(url);
      setTests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lab/tests', formData);
      setShowAddModal(false);
      setFormData({ patientId: '', testName: '', category: 'Hematology', cost: 50.00, requestedBy: '' });
      fetchLabTests();
    } catch (err) {
      alert('Failed to create lab request');
    }
  };

  const handleStartProcessing = async (testId) => {
    try {
      await api.patch(`/lab/tests/${testId}/status`, { status: 'PROCESSING' });
      fetchLabTests();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCompleteTest = async (e) => {
    e.preventDefault();
    if (!completeModalTest) return;

    try {
      await api.patch(`/lab/tests/${completeModalTest.id}/complete`, {
        resultSummary,
        reportUrl
      });
      alert('Lab investigation completed! Laboratory billing line automatically recorded.');
      setCompleteModalTest(null);
      setResultSummary('');
      setReportUrl('');
      fetchLabTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete lab test');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Diagnostic Laboratory & Pathology Services
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Process medical investigations, enter findings, and trigger automated diagnostic billing.
          </p>
        </div>
        {isLabTech && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Order Diagnostic Test</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { id: '', label: 'All Investigations' },
          { id: 'PENDING', label: 'Pending Requests' },
          { id: 'PROCESSING', label: 'In Processing' },
          { id: 'COMPLETED', label: 'Completed Reports' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`filter-chip ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <TestTube size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Lab Tests Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading lab investigation queue...</div>
        ) : tests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No lab tests found.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test Requested</th>
                <th>Category</th>
                <th>Cost ($)</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Findings / Report</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.patient.firstName} {t.patient.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MRN: {t.patient.mrn}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.testName}</td>
                  <td><span className="user-badge">{t.category}</span></td>
                  <td style={{ fontWeight: 700, color: '#34d399' }}>${Number(t.cost || 50).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.requestedBy || 'Attending Physician'}</td>
                  <td><span className={`status-tag ${t.status.toLowerCase()}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                    {t.resultSummary || 'Awaiting laboratory technician findings...'}
                  </td>
                  <td>
                    {isLabTech && t.status === 'PENDING' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleStartProcessing(t.id)}
                      >
                        <Play size={12} /> Start Testing
                      </button>
                    )}
                    {isLabTech && t.status === 'PROCESSING' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => {
                          setCompleteModalTest(t);
                          setResultSummary(t.resultSummary || '');
                        }}
                      >
                        <FileCheck size={14} /> Enter Results
                      </button>
                    )}
                    {t.status === 'COMPLETED' && (
                      <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TestTube size={22} color="#f43f5e" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Order Diagnostic Investigation</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTest}>
              <div className="form-group">
                <label>Select Patient</label>
                <select className="form-control" required onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}>
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Test Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Thyroid Stimulating Hormone (TSH)"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Radiology">Radiology & Imaging</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pathology">Pathology</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Service Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ordering Physician</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Sarah Smith"
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Results Modal */}
      {completeModalTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Enter Diagnostic Findings</h3>
                <div style={{ fontSize: '0.85rem', color: '#f43f5e', marginTop: '2px' }}>
                  {completeModalTest.testName} • Patient: {completeModalTest.patient.firstName} {completeModalTest.patient.lastName}
                </div>
              </div>
              <button onClick={() => setCompleteModalTest(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCompleteTest}>
              <div className="form-group">
                <label>Diagnostic Findings & Observations</label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="e.g. Platelets: 250k, RBC: 4.9M, Hemoglobin: 14.5 g/dL. Normal ranges."
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label>S3 Report URL / Reference (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="s3://hms-medical-docs/reports/lab_001.pdf"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                />
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', color: '#34d399', marginBottom: '1.25rem' }}>
                ✓ Submitting will complete the test, add the ${Number(completeModalTest.cost || 50).toFixed(2)} charge to the patient's invoice, and notify the attending physician.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Publish Findings & Trigger Billing
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setCompleteModalTest(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laboratory;
