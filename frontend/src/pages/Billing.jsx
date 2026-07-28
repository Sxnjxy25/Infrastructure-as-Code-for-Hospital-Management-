import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CreditCard, DollarSign } from 'lucide-react';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices');
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Hospital Invoicing & Revenue Management</h2>

      <div className="glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Patient Name</th>
              <th>Description</th>
              <th>Gross Amount</th>
              <th>Discount</th>
              <th>Net Amount ($)</th>
              <th>Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td><span className="user-badge">{inv.invoiceNumber}</span></td>
                <td style={{ fontWeight: 600 }}>{inv.patient.firstName} {inv.patient.lastName}</td>
                <td style={{ color: '#94a3b8' }}>{inv.description || 'General Service'}</td>
                <td>${Number(inv.amount).toFixed(2)}</td>
                <td style={{ color: '#ef4444' }}>-${Number(inv.discount).toFixed(2)}</td>
                <td style={{ fontWeight: 800, color: '#10b981' }}>${Number(inv.netAmount).toFixed(2)}</td>
                <td><span className={`status-tag ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                <td>{inv.paymentMethod || 'Credit Card'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Billing;
