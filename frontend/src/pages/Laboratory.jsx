import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { TestTube, FileText } from 'lucide-react';

const Laboratory = () => {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const res = await api.get('/lab/tests');
      setTests(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Diagnostic Laboratory Services</h2>

      <div className="glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test Requested</th>
              <th>Category</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Results / Findings</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.patient.firstName} {t.patient.lastName} ({t.patient.mrn})</td>
                <td>{t.testName}</td>
                <td><span className="user-badge">{t.category}</span></td>
                <td>{t.requestedBy || 'Attending Physician'}</td>
                <td><span className={`status-tag ${t.status.toLowerCase()}`}>{t.status}</span></td>
                <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.resultSummary || 'Awaiting lab processing'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Laboratory;
