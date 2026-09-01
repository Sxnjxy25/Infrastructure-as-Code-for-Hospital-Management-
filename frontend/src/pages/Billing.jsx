import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  CreditCard,
  Plus,
  DollarSign,
  Receipt,
  FileText,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

const Billing = () => {
  const { user } = useContext(AuthContext);
  const isAccountant = user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  const [invoices, setInvoices] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, RECEPTION, PHARMACY, REVENUE

  // Selected Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Record Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'CARD',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    if (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') {
      fetchRevenue();
    }
  }, [activeTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = '/billing/invoices';
      if (activeTab === 'RECEPTION') url = '/billing/reception';
      if (activeTab === 'PHARMACY') url = '/billing/pharmacy';

      const res = await api.get(url);
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/billing/revenue');
      setRevenueData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetails = async (invoiceId) => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}`);
      setSelectedInvoice(res.data.data);
    } catch (err) {
      alert('Failed to load invoice line items');
    }
  };

  const handleOpenPayment = (inv) => {
    setPaymentModalInvoice(inv);
    const balanceDue = inv.netAmount - (inv.paidAmount || 0);
    setPaymentFormData({
      amount: balanceDue > 0 ? balanceDue.toFixed(2) : '0.00',
      paymentMethod: 'CARD',
      transactionId: '',
      notes: ''
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    try {
      const res = await api.post(`/billing/invoices/${paymentModalInvoice.id}/payments`, {
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        transactionId: paymentFormData.transactionId,
        notes: paymentFormData.notes
      });
      alert(`Payment of $${paymentFormData.amount} recorded! Generated Receipt #${res.data.data.payment.receiptNumber}`);
      setPaymentModalInvoice(null);
      fetchInvoices();
      if (user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') fetchRevenue();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px', margin: 0 }}>
            Hospital Financial & Billing Command
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Multi-department invoice tracking, automated clinical line items, and receipt processing.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { id: 'ALL', label: 'All Invoices' },
          { id: 'RECEPTION', label: 'Reception & Hospital Bills' },
          { id: 'PHARMACY', label: 'Pharmacy Sales Bills' },
          { id: 'REVENUE', label: 'Department Revenue Analytics' }
        ]?.map((tab) => (
          <button
            key={tab.id}
            className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Department Revenue View Tab */}
      {activeTab === 'REVENUE' && revenueData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Clinical & Consultations</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.85rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
              ${Number(revenueData.CLINICAL || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Doctor visit consultation fees</div>
          </div>
          <div className="glass-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Pharmacy Dispensing</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>
              ${Number(revenueData.PHARMACY || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Prescription drug retail</div>
          </div>
          <div className="glass-card">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Diagnostic Laboratory</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.85rem', fontWeight: 800, color: '#f43f5e', margin: '0.25rem 0' }}>
              ${Number(revenueData.LABORATORY || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Pathology & imaging assays</div>
          </div>
          <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Settled Revenue</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0' }}>
              ${Number(revenueData.TOTAL || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>Cumulative payments collected</div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {activeTab !== 'REVENUE' && (
        <div className="glass-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading financial ledger...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Department / Type</th>
                  <th>Description</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((inv) => {
                  const balanceDue = inv.netAmount - (inv.paidAmount || 0);
                  return (
                    <tr key={inv.id}>
                      <td><span className="user-badge">{inv.invoiceNumber}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.patient?.firstName || 'Patient'} {inv.patient?.lastName || ''}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MRN: {inv.patient?.mrn || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="user-badge" style={{ background: inv.billingType === 'PHARMACY' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: inv.billingType === 'PHARMACY' ? '#38bdf8' : '#34d399' }}>
                          {inv.billingType}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{inv.description}</td>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>${Number(inv.netAmount).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>${Number(inv.paidAmount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`status-tag ${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{inv.paymentMethod || 'Pending'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => handleOpenDetails(inv.id)}
                            title="View line items"
                          >
                            <Eye size={13} />
                            <span>Items</span>
                          </button>
                          {isAccountant && inv.status !== 'PAID' && (
                            <button
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleOpenPayment(inv)}
                              title="Process payment"
                            >
                              <DollarSign size={13} />
                              <span>Pay (${balanceDue.toFixed(2)})</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoice Line Items & Receipts Modal */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Invoice: {selectedInvoice.invoiceNumber}</h3>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', marginTop: '3px' }}>
                  Patient: {selectedInvoice.patient?.firstName || 'Patient'} {selectedInvoice.patient?.lastName || ''} ({selectedInvoice.patient?.mrn || 'N/A'})
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                Itemized Clinical & Pharmacy Line Items:
              </div>
              <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Service / Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((itm) => (
                    <tr key={itm.id}>
                      <td><span className="user-badge">{itm.sourceDepartment}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{itm.itemDescription}</td>
                      <td>{itm.quantity}</td>
                      <td>${Number(itm.unitPrice).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>${Number(itm.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem', fontSize: '0.95rem', fontWeight: 800 }}>
                Total Net Amount: <span style={{ color: '#34d399', marginLeft: '0.5rem' }}>${Number(selectedInvoice.netAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Ledger Section */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', color: '#38bdf8' }}>
                Payment & Receipt History:
              </div>
              {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) ? (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selectedInvoice.payments?.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#34d399' }}>Receipt #{p.receiptNumber}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                          Method: {p.paymentMethod} • {new Date(p.createdAt).toLocaleString()} {p.receivedBy?.name ? `• Cashier: ${p.receivedBy.name}` : ''}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>
                        +${Number(p.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Receipt size={22} color="#34d399" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Process Invoice Settlement</h3>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Invoice: <strong>{paymentModalInvoice.invoiceNumber}</strong> • Balance Due: <strong>${(paymentModalInvoice.netAmount - (paymentModalInvoice.paidAmount || 0)).toFixed(2)}</strong>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div className="form-group">
                <label>Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  required
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  className="form-control"
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="ONLINE_PAYMENT">Online Netbanking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction ID / POS Reference</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TXN_987654321"
                  value={paymentFormData.transactionId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cashier Notes (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Cleared at front desk cashier"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Generate Receipt & Settle
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setPaymentModalInvoice(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
