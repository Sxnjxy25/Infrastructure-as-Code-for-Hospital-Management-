import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Pill, AlertTriangle, Plus } from 'lucide-react';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', category: 'Cardiovascular', quantity: 50, unitPrice: 10.00, expiryDate: '2027-12-31', supplier: '' });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/pharmacy/inventory');
      setMedicines(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/medicine', formData);
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert('Failed to add medicine');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800 }}>Pharmacy Inventory & Stock Tracker</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Add Medicine Item</span>
        </button>
      </div>

      <div className="glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>In Stock</th>
              <th>Unit Price ($)</th>
              <th>Expiry Date</th>
              <th>Alert</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med) => (
              <tr key={med.id}>
                <td><span className="user-badge">{med.code}</span></td>
                <td style={{ fontWeight: 600 }}>{med.name}</td>
                <td>{med.category}</td>
                <td style={{ fontWeight: 700 }}>{med.quantity} units</td>
                <td>${Number(med.unitPrice).toFixed(2)}</td>
                <td>{new Date(med.expiryDate).toLocaleDateString()}</td>
                <td>
                  {med.quantity <= 20 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>
                      <AlertTriangle size={14} /> Low Stock
                    </span>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>Optimal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="login-box" style={{ maxWidth: '450px' }}>
            <h3>Add New Inventory Medicine</h3>
            <form onSubmit={handleAdd} style={{ marginTop: '1rem' }}>
              <div className="form-group"><label>Medicine Code</label><input type="text" className="form-control" required placeholder="MED-AMOX-500" onChange={(e) => setFormData({...formData, code: e.target.value})} /></div>
              <div className="form-group"><label>Medicine Name</label><input type="text" className="form-control" required placeholder="Amoxicillin 500mg" onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Quantity</label><input type="number" className="form-control" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} /></div>
                <div className="form-group"><label>Unit Price ($)</label><input type="number" step="0.01" className="form-control" required value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Expiry Date</label><input type="date" className="form-control" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Item</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
