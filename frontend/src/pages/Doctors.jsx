import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { UserCheck, Clock, MapPin, DollarSign } from 'lucide-react';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Medical Staff & Specialist Directory</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {doctors?.map((doc) => (
          <div key={doc.id} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.user?.name || 'Dr. Specialist'}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>{doc.specialization}</p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Department:</strong> {doc.department}</div>
              <div><strong>Qualifications:</strong> {doc.qualification}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> <span>{doc.availability}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> <span>{doc.roomNumber || 'Room N/A'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700 }}><DollarSign size={14} /> <span>Fee: ${doc.consultationFee}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
