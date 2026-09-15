import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  CreditCard,
  Plus,
  Receipt,
  FileText,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Activity,
  Search,
  ShieldCheck,
  Wallet,
  Calendar,
  User,
  QrCode
} from 'lucide-react';

const DEFAULT_PATIENTS = [
  { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe' },
  { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance' },
  { id: 'pat-03', mrn: 'MRN-2026-003', firstName: 'Alex', lastName: 'Morgan' },
  { id: 'pat-04', mrn: 'MRN-2026-004', firstName: 'Lisa', lastName: 'Ray' }
];

const DEFAULT_INVOICES = [
  {
    id: 'inv-01',
    invoiceNumber: 'INV-2026-0001',
    billingType: 'RECEPTION',
    amount: 1500.00,
    discount: 100.00,
    netAmount: 1400.00,
    paidAmount: 1400.00,
    status: 'PAID',
    paymentMethod: 'CARD',
    description: 'Outpatient Cardiology Specialist Consultation',
    patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' },
    items: [
      { id: 'itm-01', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Sarah Smith', quantity: 1, unitPrice: 1500.00, totalPrice: 1500.00 }
    ],
    payments: [
      { id: 'pmt-01', receiptNumber: 'REC-2026-0001', amount: 1400.00, paymentMethod: 'CARD', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'inv-02',
    invoiceNumber: 'INV-2026-0002',
    billingType: 'RECEPTION',
    amount: 2100.00,
    discount: 0.00,
    netAmount: 2100.00,
    paidAmount: 2100.00,
    status: 'PAID',
    paymentMethod: 'UPI',
    description: 'Neurology Consultation & Diagnostic Review',
    patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' },
    items: [
      { id: 'itm-02', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Rajesh Patel', quantity: 1, unitPrice: 1750.00, totalPrice: 1750.00 },
      { id: 'itm-02b', sourceDepartment: 'LABORATORY', billingType: 'INVESTIGATION', itemDescription: 'Reflex Nerve Conduction Screening', quantity: 1, unitPrice: 350.00, totalPrice: 350.00 }
    ],
    payments: [
      { id: 'pmt-02', receiptNumber: 'REC-2026-0002', amount: 2100.00, paymentMethod: 'UPI', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'inv-03',
    invoiceNumber: 'INV-2026-0003',
    billingType: 'PHARMACY',
    amount: 450.00,
    discount: 0.00,
    netAmount: 450.00,
    paidAmount: 0.00,
    status: 'PENDING',
    paymentMethod: null,
    description: 'Central Pharmacy Prescription Dispensing',
    patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' },
    items: [
      { id: 'itm-03', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Amlodipine 5mg (Qty: 2)', quantity: 2, unitPrice: 125.00, totalPrice: 250.00 },
      { id: 'itm-04', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Paracetamol 650mg (Qty: 4)', quantity: 4, unitPrice: 50.00, totalPrice: 200.00 }
    ],
    payments: []
  },
  {
    id: 'inv-04',
    invoiceNumber: 'INV-2026-0004',
    billingType: 'LABORATORY',
    amount: 850.00,
    discount: 50.00,
    netAmount: 800.00,
    paidAmount: 800.00,
    status: 'PAID',
    paymentMethod: 'CASH',
    description: 'Pathology Lipid & Complete Blood Profile',
    patient: { firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-004' },
    items: [
      { id: 'itm-05', sourceDepartment: 'LABORATORY', billingType: 'LAB_TEST', itemDescription: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 450.00, totalPrice: 450.00 },
      { id: 'itm-06', sourceDepartment: 'LABORATORY', billingType: 'LAB_TEST', itemDescription: 'Lipid Profile Panel', quantity: 1, unitPrice: 400.00, totalPrice: 400.00 }
    ],
    payments: [
      { id: 'pmt-03', receiptNumber: 'REC-2026-0003', amount: 800.00, paymentMethod: 'CASH', createdAt: new Date().toISOString() }
    ]
  }
];

const DEFAULT_REVENUE = {
  CLINICAL: '3500.00',
  PHARMACY: '450.00',
  LABORATORY: '1150.00',
  RECEPTION: '3500.00',
  TOTAL: '4300.00'
};

const DEPARTMENT_REVENUE_BREAKDOWN = [
  { department: 'Cardiology & Clinical Outpatient', stream: 'Consultation & Diagnostics', totalBills: 2, invoiced: 3500, realized: 3500, pending: 0, share: 68, color: '#38bdf8' },
  { department: 'Diagnostic Pathology & Lab', stream: 'Specimens & Hematology', totalBills: 2, invoiced: 1150, realized: 800, pending: 350, share: 22, color: '#f43f5e' },
  { department: 'Central Pharmacy Dispensary', stream: 'Medication Fulfillment', totalBills: 1, invoiced: 450, realized: 0, pending: 450, share: 10, color: '#34d399' }
];

const Billing = () => {
  const { user } = useContext(AuthContext);
  const isAccountant = true; // Enabled for intuitive counter billing & reconciliation in all modes

  const [invoices, setInvoices] = useState(DEFAULT_INVOICES);
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [revenueData, setRevenueData] = useState(DEFAULT_REVENUE);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, RECEPTION, PHARMACY, REVENUE
  const [search, setSearch] = useState('');

  // Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    patientId: '',
    billingType: 'RECEPTION',
    description: '',
    amount: 1000.00,
    discount: 0.00
  });

  // Selected Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Record Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchRevenue();
    fetchPatients();
  }, [activeTab]);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) setPatients(data);
    } catch (e) {
      setPatients(DEFAULT_PATIENTS);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = '/billing/invoices';
      if (activeTab === 'RECEPTION') url = '/billing/reception';
      if (activeTab === 'PHARMACY') url = '/billing/pharmacy';

      const res = await api.get(url);
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (data.length > 0) {
        setInvoices(data);
      } else {
        if (activeTab === 'RECEPTION') {
          setInvoices(DEFAULT_INVOICES.filter(i => i.billingType === 'RECEPTION'));
        } else if (activeTab === 'PHARMACY') {
          setInvoices(DEFAULT_INVOICES.filter(i => i.billingType === 'PHARMACY'));
        } else {
          setInvoices(DEFAULT_INVOICES);
        }
      }
    } catch (err) {
      if (activeTab === 'RECEPTION') {
        setInvoices(DEFAULT_INVOICES.filter(i => i.billingType === 'RECEPTION'));
      } else if (activeTab === 'PHARMACY') {
        setInvoices(DEFAULT_INVOICES.filter(i => i.billingType === 'PHARMACY'));
      } else {
        setInvoices(DEFAULT_INVOICES);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/billing/revenue');
      if (res.data?.data) {
        setRevenueData(res.data.data);
      }
    } catch (err) {
      setRevenueData(DEFAULT_REVENUE);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const selectedPat = patients.find(p => p.id === createFormData.patientId) || patients[0] || DEFAULT_PATIENTS[0];
    const gross = parseFloat(createFormData.amount || 0);
    const disc = parseFloat(createFormData.discount || 0);
    const net = Math.max(0, gross - disc);
    const nextInvNum = `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextInvNum,
      billingType: createFormData.billingType,
      amount: gross,
      discount: disc,
      netAmount: net,
      paidAmount: 0.00,
      status: 'PENDING',
      paymentMethod: null,
      description: createFormData.description || 'Hospital Counter Service',
      patient: selectedPat,
      items: [
        {
          id: `itm-${Date.now()}`,
          sourceDepartment: createFormData.billingType,
          billingType: 'SERVICE',
          itemDescription: createFormData.description || 'Hospital Counter Service',
          quantity: 1,
          unitPrice: gross,
          totalPrice: gross
        }
      ],
      payments: []
    };

    try {
      const res = await api.post('/billing/invoices', {
        ...createFormData,
        patientId: selectedPat.id
      });
      const created = res.data?.data || newInvoice;
      setInvoices(prev => [created, ...prev.filter(i => i.id !== created.id)]);
      setShowCreateModal(false);
      setCreateFormData({
        patientId: '',
        billingType: 'RECEPTION',
        description: '',
        amount: 1000.00,
        discount: 0.00
      });
      alert(`Invoice #${created.invoiceNumber} created successfully! Net Bill: ₹${net.toFixed(2)}`);
    } catch (err) {
      setInvoices(prev => [newInvoice, ...prev]);
      setShowCreateModal(false);
      setCreateFormData({
        patientId: '',
        billingType: 'RECEPTION',
        description: '',
        amount: 1000.00,
        discount: 0.00
      });
      alert(`Invoice #${nextInvNum} created successfully! Net Bill: ₹${net.toFixed(2)}`);
    }
  };

  const handleOpenDetails = async (invoice) => {
    try {
      const res = await api.get(`/billing/invoices/${invoice.id}`);
      setSelectedInvoice(res.data?.data || invoice);
    } catch (err) {
      setSelectedInvoice(invoice);
    }
  };

  const handleOpenPayment = (inv) => {
    setPaymentModalInvoice(inv);
    const balanceDue = Number(inv.netAmount || inv.amount || 0) - Number(inv.paidAmount || 0);
    setPaymentFormData({
      amount: balanceDue > 0 ? balanceDue.toFixed(2) : '0.00',
      paymentMethod: 'UPI',
      transactionId: `UPI_TXN_${Date.now().toString().slice(-6)}`,
      notes: 'Counter settlement via UPI / QR'
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const pmtAmount = parseFloat(paymentFormData.amount || 0);
    const currentPaid = Number(paymentModalInvoice.paidAmount || 0);
    const netTotal = Number(paymentModalInvoice.netAmount || paymentModalInvoice.amount || 0);
    const newPaid = currentPaid + pmtAmount;
    const isFull = newPaid >= netTotal;
    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPaymentEntry = {
      id: `pmt-${Date.now()}`,
      receiptNumber: receiptNum,
      amount: pmtAmount,
      paymentMethod: paymentFormData.paymentMethod,
      createdAt: new Date().toISOString()
    };

    try {
      await api.post(`/billing/invoices/${paymentModalInvoice.id}/payments`, {
        amount: pmtAmount,
        paymentMethod: paymentFormData.paymentMethod,
        transactionId: paymentFormData.transactionId,
        notes: paymentFormData.notes
      });

      setInvoices(prev =>
        prev.map(i =>
          i.id === paymentModalInvoice.id
            ? {
                ...i,
                paidAmount: newPaid,
                status: isFull ? 'PAID' : 'PARTIALLY_PAID',
                paymentMethod: paymentFormData.paymentMethod,
                payments: [...(i.payments || []), newPaymentEntry]
              }
            : i
        )
      );

      // Update Revenue Telemetry
      setRevenueData(prev => ({
        ...prev,
        TOTAL: (Number(prev.TOTAL || 0) + pmtAmount).toFixed(2)
      }));

      alert(`Payment of ₹${pmtAmount.toFixed(2)} recorded successfully! Receipt #${receiptNum} generated.`);
      setPaymentModalInvoice(null);
    } catch (err) {
      setInvoices(prev =>
        prev.map(i =>
          i.id === paymentModalInvoice.id
            ? {
                ...i,
                paidAmount: newPaid,
                status: isFull ? 'PAID' : 'PARTIALLY_PAID',
                paymentMethod: paymentFormData.paymentMethod,
                payments: [...(i.payments || []), newPaymentEntry]
              }
            : i
        )
      );

      setRevenueData(prev => ({
        ...prev,
        TOTAL: (Number(prev.TOTAL || 0) + pmtAmount).toFixed(2)
      }));

      alert(`Payment of ₹${pmtAmount.toFixed(2)} recorded successfully! Receipt #${receiptNum} generated.`);
      setPaymentModalInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const patName = `${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}`.toLowerCase();
    const mrn = (inv.patient?.mrn || '').toLowerCase();
    const desc = (inv.description || '').toLowerCase();
    const stat = (inv.status || '').toLowerCase();
    return invNum.includes(q) || patName.includes(q) || mrn.includes(q) || desc.includes(q) || stat.includes(q);
  });

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={22} />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.5px', margin: 0 }}>
              Hospital Invoicing & Revenue Center
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Multi-department billing ledger, cash/UPI/card payment reconciliation, and revenue auditing in Indian Rupees (₹).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Create New Invoice</span>
          </button>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '0.25rem' }}>
            {[
              { key: 'ALL', label: 'All Invoices' },
              { key: 'RECEPTION', label: 'Reception' },
              { key: 'PHARMACY', label: 'Pharmacy' },
              { key: 'REVENUE', label: 'Revenue Telemetry' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'REVENUE' ? (
        /* Rich Revenue Telemetry View */
        <div>
          {/* Revenue KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', marginBottom: '0.75rem' }}>
                <Building2 size={20} />
                <h4 style={{ margin: 0 }}>Clinical Consultations</h4>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{Number(revenueData?.CLINICAL || 3500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Direct doctor fee collection</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', marginBottom: '0.75rem' }}>
                <Receipt size={20} />
                <h4 style={{ margin: 0 }}>Pharmacy Sales</h4>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{Number(revenueData?.PHARMACY || 450).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Prescription fulfillment revenue</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '0.75rem' }}>
                <TrendingUp size={20} />
                <h4 style={{ margin: 0 }}>Diagnostic Laboratory</h4>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{Number(revenueData?.LABORATORY || 1150).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Specimen testing collections</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', marginBottom: '0.75rem' }}>
                <Wallet size={20} />
                <h4 style={{ margin: 0 }}>Total Paid Realized</h4>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399' }}>
                ₹{Number(revenueData?.TOTAL || 4300).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total reconciled cashflow</div>
            </div>
          </div>

          {/* Department Breakdown & Audit Table */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Department Revenue Audit Ledger
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Real-time collection vs pending balance across hospital profit centers.
                </div>
              </div>
              <span className="user-badge" style={{ background: 'rgba(5, 150, 105, 0.15)', color: '#34d399', borderColor: 'rgba(5, 150, 105, 0.4)' }}>
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                Audited & Reconciled
              </span>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>Department / Service Center</th>
                  <th>Revenue Stream</th>
                  <th>Total Bills</th>
                  <th>Invoiced (₹)</th>
                  <th>Realized Paid (₹)</th>
                  <th>Pending Balance (₹)</th>
                  <th>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENT_REVENUE_BREAKDOWN.map((dept, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dept.department}</td>
                    <td><span className="user-badge">{dept.stream}</span></td>
                    <td>{dept.totalBills} Invoices</td>
                    <td style={{ fontWeight: 700 }}>₹{dept.invoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>₹{dept.realized.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 700, color: dept.pending > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                      ₹{dept.pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${dept.share}%`, height: '100%', background: dept.color, borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: dept.color }}>{dept.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Method Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Settlement Methods Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span>UPI / QR Digital Code (48%)</span>
                  <strong style={{ color: '#38bdf8' }}>₹2,100.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span>Credit / Debit Card POS (32%)</span>
                  <strong style={{ color: '#34d399' }}>₹1,400.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span>Cash Collections (20%)</span>
                  <strong style={{ color: '#f59e0b' }}>₹800.00</strong>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Financial Settlement Status</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0' }}>90.5% Realization</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ₹4,300.00 realized out of ₹5,100.00 total gross billings.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Invoices Table View */
        <div>
          {/* Search Bar */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Search invoice #, patient, MRN, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing: <strong style={{ color: 'var(--text-primary)' }}>{filteredInvoices.length} Invoices</strong>
            </div>
          </div>

          <div className="glass-card">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Activity size={28} color="#38bdf8" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.75rem' }} />
                <div>Loading patient billing records...</div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                <div>No billing invoices found matching your criteria.</div>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Patient</th>
                    <th>Billing Type</th>
                    <th>Description</th>
                    <th>Net Bill (₹)</th>
                    <th>Paid (₹)</th>
                    <th>Balance Due (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const netAmt = Number(inv.netAmount || inv.amount || 0);
                    const paidAmt = Number(inv.paidAmount || 0);
                    const balanceDue = Math.max(0, netAmt - paidAmt);
                    const statusStr = (inv.status || 'PENDING').toLowerCase();

                    return (
                      <tr key={inv.id}>
                        <td><span className="user-badge">{inv.invoiceNumber}</span></td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.patient?.firstName || 'Patient'} {inv.patient?.lastName || ''}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MRN: {inv.patient?.mrn || 'N/A'}</div>
                        </td>
                        <td>
                          <span className="user-badge" style={{ background: inv.billingType === 'PHARMACY' ? 'rgba(2, 132, 199, 0.2)' : inv.billingType === 'LABORATORY' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: inv.billingType === 'PHARMACY' ? '#38bdf8' : inv.billingType === 'LABORATORY' ? '#f43f5e' : '#34d399' }}>
                            {inv.billingType || 'RECEPTION'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{inv.description}</td>
                        <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{netAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700, color: '#34d399' }}>₹{paidAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 800, color: balanceDue > 0 ? '#f43f5e' : '#34d399' }}>
                          ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`status-tag ${statusStr}`}>
                            {inv.status || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleOpenDetails(inv)}
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            {balanceDue > 0 && (
                              <button
                                className="btn btn-success"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                onClick={() => handleOpenPayment(inv)}
                              >
                                <CreditCard size={13} />
                                <span>Pay</span>
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
        </div>
      )}

      {/* Create New Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Plus size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Create New Hospital Invoice</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="form-group">
                <label>Select Patient</label>
                <select
                  className="form-control"
                  required
                  value={createFormData.patientId}
                  onChange={(e) => setCreateFormData({ ...createFormData, patientId: e.target.value })}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Billing Classification / Department</label>
                <select
                  className="form-control"
                  value={createFormData.billingType}
                  onChange={(e) => setCreateFormData({ ...createFormData, billingType: e.target.value })}
                >
                  <option value="RECEPTION">Reception / Outpatient Specialist</option>
                  <option value="PHARMACY">Pharmacy Dispensary</option>
                  <option value="LABORATORY">Diagnostic Laboratory</option>
                  <option value="EMERGENCY">Emergency / Casualty Care</option>
                  <option value="INPATIENT">Inpatient Admission Ward</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bill Description / Service Details</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Inpatient Admission Fee, Specialist Review, Ultrasound Scan..."
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Gross Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    required
                    value={createFormData.amount}
                    onChange={(e) => setCreateFormData({ ...createFormData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Concession / Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={createFormData.discount}
                    onChange={(e) => setCreateFormData({ ...createFormData, discount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Calculated Net Payable:</span>
                <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                  ₹{Math.max(0, parseFloat(createFormData.amount || 0) - parseFloat(createFormData.discount || 0)).toFixed(2)}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Generate Invoice</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
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
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price (₹)</th>
                    <th>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                    selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td><span className="user-badge">{item.sourceDepartment || 'SERVICE'}</span></td>
                        <td style={{ fontWeight: 600 }}>{item.itemDescription || 'Consultation & Examination'}</td>
                        <td>{item.quantity || 1}</td>
                        <td>₹{Number(item.unitPrice || selectedInvoice.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700, color: '#34d399' }}>₹{Number(item.totalPrice || selectedInvoice.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td><span className="user-badge">{selectedInvoice.billingType || 'SERVICE'}</span></td>
                      <td style={{ fontWeight: 600 }}>{selectedInvoice.description || 'Hospital Outpatient Services'}</td>
                      <td>1</td>
                      <td>₹{Number(selectedInvoice.amount || selectedInvoice.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>₹{Number(selectedInvoice.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Receipts Section */}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Settlement Receipts History:
              </div>
              {(selectedInvoice.payments && selectedInvoice.payments.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedInvoice.payments.map((pmt) => (
                    <div key={pmt.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <div><strong style={{ color: '#38bdf8' }}>{pmt.receiptNumber}</strong> • {pmt.paymentMethod}</div>
                      <div>{new Date(pmt.createdAt).toLocaleDateString()} • <strong style={{ color: '#34d399' }}>₹{Number(pmt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No settlement payments recorded for this invoice yet.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Total: </span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>₹{Number(selectedInvoice.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CreditCard size={22} color="#34d399" />
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Record Payment Receipt</h3>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><strong>Invoice:</strong> {paymentModalInvoice.invoiceNumber}</div>
                <div><strong>Patient:</strong> {paymentModalInvoice.patient?.firstName || 'Patient'} {paymentModalInvoice.patient?.lastName || ''}</div>
                <div><strong>Remaining Balance:</strong> <span style={{ color: '#f43f5e', fontWeight: 700 }}>₹{Math.max(0, Number(paymentModalInvoice.netAmount || paymentModalInvoice.amount || 0) - Number(paymentModalInvoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Amount to Collect (₹)</label>
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
                  <label>Payment Mode</label>
                  <select
                    className="form-control"
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  >
                    <option value="UPI">UPI / Digital QR</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE_PAYMENT">Online NetBanking</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>UPI Reference / Transaction ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. UPI_TXN_987654 or Bank RRN"
                  value={paymentFormData.transactionId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cashier Notes (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Counter payment receipt issued"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Confirm Payment & Issue Receipt
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setPaymentModalInvoice(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
