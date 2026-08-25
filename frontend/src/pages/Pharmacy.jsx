import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Pill,
  AlertTriangle,
  Plus,
  ShoppingCart,
  Search,
  CheckCircle,
  Package,
  X
} from 'lucide-react';

const Pharmacy = () => {
  const { user } = useContext(AuthContext);
  const isPharmacist = user?.role === 'PHARMACIST' || user?.role === 'ADMIN';

  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Cardiovascular',
    quantity: 50,
    unitPrice: 10.00,
    reorderThreshold: 25,
    expiryDate: '2028-12-31',
    supplier: ''
  });

  // Dispense Modal
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispensePatientId, setDispensePatientId] = useState('');
  const [dispenseItems, setDispenseItems] = useState([{ medicineId: '', quantity: 1 }]);

  useEffect(() => {
    fetchInventory();
    fetchPatients();
  }, [search, lowStockOnly]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pharmacy/inventory?search=${search}&lowStockOnly=${lowStockOnly}`);
      setMedicines(res.data.data);
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

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/medicine', formData);
      setShowAddModal(false);
      setFormData({
        code: '',
        name: '',
        category: 'Cardiovascular',
        quantity: 50,
        unitPrice: 10.00,
        reorderThreshold: 25,
        expiryDate: '2028-12-31',
        supplier: ''
      });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  const handleAddDispenseRow = () => {
    setDispenseItems([...dispenseItems, { medicineId: '', quantity: 1 }]);
  };

  const handleRemoveDispenseRow = (index) => {
    setDispenseItems(dispenseItems.filter((_, i) => i !== index));
  };

  const handleDispenseItemChange = (index, field, value) => {
    const updated = [...dispenseItems];
    updated[index][field] = value;
    setDispenseItems(updated);
  };

  const handleExecuteDispense = async (e) => {
    e.preventDefault();
    if (!dispensePatientId) {
      return alert('Please select a patient to dispense medicines to');
    }

    try {
      await api.post('/pharmacy/dispense', {
        patientId: dispensePatientId,
        items: dispenseItems
      });
      alert('Medicines dispensed! Inventory deducted atomically and Pharmacy Invoice created.');
      setShowDispenseModal(false);
      setDispenseItems([{ medicineId: '', quantity: 1 }]);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Dispense failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Pharmacy Inventory & Dispensing Command
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Real-time stock tracking, automated reorder alerts, and transactional prescription fulfillment.
          </p>
        </div>
        {isPharmacist && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-success" onClick={() => setShowDispenseModal(true)}>
              <ShoppingCart size={18} />
              <span>Dispense Prescription</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>Add Medicine</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs / Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`filter-chip ${!lowStockOnly ? 'active' : ''}`}
          onClick={() => setLowStockOnly(false)}
        >
          <Package size={15} />
          <span>All Medicines</span>
        </button>
        <button
          className={`filter-chip ${lowStockOnly ? 'active' : ''}`}
          style={lowStockOnly ? { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.5)' } : {}}
          onClick={() => setLowStockOnly(true)}
        >
          <AlertTriangle size={15} color={lowStockOnly ? '#f87171' : '#f59e0b'} />
          <span>Low & Out of Stock Alerts</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by drug name, item code, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading pharmacy inventory...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Unit Price ($)</th>
                <th>Expiry Date</th>
                <th>Stock Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id}>
                  <td><span className="user-badge">{med.code}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{med.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.category}</td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: med.quantity === 0 ? '#f87171' : med.quantity <= med.reorderThreshold ? '#fbbf24' : '#34d399' }}>
                      {med.quantity} units
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{med.reorderThreshold} units</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${Number(med.unitPrice).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(med.expiryDate).toLocaleDateString()}</td>
                  <td>
                    {med.quantity === 0 ? (
                      <span className="status-tag cancelled">
                        <AlertTriangle size={13} /> OUT OF STOCK
                      </span>
                    ) : med.quantity <= med.reorderThreshold ? (
                      <span className="status-tag pending">
                        <AlertTriangle size={13} /> Low Stock
                      </span>
                    ) : (
                      <span className="status-tag completed">
                        <CheckCircle size={13} /> Optimal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Pill size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Add Medicine to Formulary</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine}>
              <div className="form-group">
                <label>Medicine Item Code</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. MED-AMOX-500"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Medicine Name & Dosage</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Initial Stock (Units)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Reorder Threshold</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save to Formulary</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Prescription Modal */}
      {showDispenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShoppingCart size={22} color="#34d399" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Dispense Prescription</h3>
              </div>
              <button onClick={() => setShowDispenseModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteDispense}>
              <div className="form-group">
                <label>Select Patient</label>
                <select
                  className="form-control"
                  required
                  value={dispensePatientId}
                  onChange={(e) => setDispensePatientId(e.target.value)}
                >
                  <option value="">-- Choose Patient (MRN) --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Prescribed Items</label>
                  <button
                    type="button"
                    onClick={handleAddDispenseRow}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                {dispenseItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '0.6rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      required
                      value={item.medicineId}
                      onChange={(e) => handleDispenseItemChange(idx, 'medicineId', e.target.value)}
                    >
                      <option value="">-- Select Medicine --</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id} disabled={m.quantity === 0}>
                          {m.name} (${Number(m.unitPrice).toFixed(2)}) - {m.quantity} in stock {m.quantity === 0 ? '[OUT OF STOCK]' : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleDispenseItemChange(idx, 'quantity', e.target.value)}
                    />
                    {dispenseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDispenseRow(idx)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', color: '#34d399', marginBottom: '1.25rem' }}>
                ✓ Atomically deducts inventory, monitors stock thresholds, and generates Pharmacy Invoice lines.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Execute Dispense & Bill Patient
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setShowDispenseModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
