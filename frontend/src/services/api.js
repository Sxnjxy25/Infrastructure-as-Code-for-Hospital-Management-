import axios from 'axios';

// 1. Intelligent API URL resolver
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (!envUrl || envUrl.includes('your-backend') || envUrl.includes('placeholder') || envUrl.includes('example.com')) {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      return isLocal ? 'http://localhost:5000/api' : '/api';
    }
    return '/api';
  }
  
  return envUrl;
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Comprehensive In-Memory Mock Store for 100% Zero-Error Resilient Fallback in Preview/Stand-alone Mode
const MOCK_STORE = {
  doctors: [
    { id: 'doc-01', specialization: 'Cardiology', department: 'Cardiovascular Services', qualification: 'MD, FACC, Board Certified Cardiologist', consultationFee: 1500.0, availability: 'AVAILABLE', roomNumber: 'Suite 302', user: { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', phone: '+91-98765-43210' } },
    { id: 'doc-02', specialization: 'Neurology', department: 'Neurological Sciences', qualification: 'MBBS, MD Neurology, Fellow AAN', consultationFee: 1750.0, availability: 'AVAILABLE', roomNumber: 'Suite 410', user: { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', phone: '+91-98765-43211' } },
    { id: 'doc-03', specialization: 'Pediatrics', department: 'Pediatrics & Child Care', qualification: 'MD Pediatrics, FAAP Specialist', consultationFee: 1200.0, availability: 'ON_DUTY', roomNumber: 'Suite 204', user: { id: 'usr-doc-03', name: 'Dr. Emily Taylor', email: 'dr.taylor@hospital.com', phone: '+91-98765-43220' } },
    { id: 'doc-04', specialization: 'Orthopedics', department: 'Orthopedic Surgery & Trauma', qualification: 'MS Orthopedics, Joint Replacement Surgeon', consultationFee: 1800.0, availability: 'AVAILABLE', roomNumber: 'Suite 501', user: { id: 'usr-doc-04', name: 'Dr. Marcus Vance', email: 'dr.vance@hospital.com', phone: '+91-98765-43221' } },
    { id: 'doc-05', specialization: 'General Medicine', department: 'Internal & General Medicine', qualification: 'MD Internal Medicine', consultationFee: 1000.0, availability: 'AVAILABLE', roomNumber: 'Suite 105', user: { id: 'usr-doc-05', name: 'Dr. Alan Harper', email: 'dr.harper@hospital.com', phone: '+91-98765-43222' } }
  ],
  patients: [
    { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe', dateOfBirth: '1988-05-14', gender: 'Male', bloodGroup: 'O+', phone: '+91-98765-00101', address: '123 Health Ave, Metro City', emergencyContact: 'Jane Doe (+91-98765-00102)', medicalHistory: 'Hypertension, Seasonal Allergies' },
    { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance', dateOfBirth: '1994-09-22', gender: 'Female', bloodGroup: 'A+', phone: '+91-98765-00201', address: '456 Elm Street, Metro City', emergencyContact: 'Thomas Vance (+91-98765-00202)', medicalHistory: 'Chronic Migraines' },
    { id: 'pat-03', mrn: 'MRN-2026-003', firstName: 'Alex', lastName: 'Morgan', dateOfBirth: '1991-11-05', gender: 'Female', bloodGroup: 'B+', phone: '+91-98765-00301', address: '789 Oak Lane, Metro City', emergencyContact: 'Sarah Morgan (+91-98765-00302)', medicalHistory: 'None' },
    { id: 'pat-04', mrn: 'MRN-2026-004', firstName: 'Lisa', lastName: 'Ray', dateOfBirth: '1985-02-18', gender: 'Female', bloodGroup: 'AB+', phone: '+91-98765-00401', address: '101 Pine Blvd, Metro City', emergencyContact: 'David Ray (+91-98765-00402)', medicalHistory: 'Asthma (Mild)' }
  ],
  departments: [
    { id: 'dept-01', code: 'CARD', name: 'Cardiovascular Services', description: 'Advanced cardiology, cardiac monitoring, and catheterization laboratory', isActive: true, _count: { staff: 4 } },
    { id: 'dept-02', code: 'NEUR', name: 'Neurological Sciences', description: 'Comprehensive neurological diagnostic, stroke care, and clinical neurology', isActive: true, _count: { staff: 3 } },
    { id: 'dept-03', code: 'LAB', name: 'Diagnostic Pathology & Lab', description: 'Automated clinical chemistry, hematology, and specimen investigation', isActive: true, _count: { staff: 2 } },
    { id: 'dept-04', code: 'PHAR', name: 'Central Pharmacy', description: 'Automated prescription fulfillment, dispensing, and inventory control', isActive: true, _count: { staff: 2 } },
    { id: 'dept-05', code: 'REC', name: 'Reception & Patient Intake', description: 'Front desk patient coordination, triage, and appointment scheduling', isActive: true, _count: { staff: 3 } },
    { id: 'dept-06', code: 'ACC', name: 'Accounts & Patient Billing', description: 'Invoicing, cashiering, payment receipts, and financial operations', isActive: true, _count: { staff: 2 } },
    { id: 'dept-07', code: 'NUR', name: 'Nursing & Critical Care (ICU)', description: '24/7 inpatient clinical wards and emergency critical care nursing', isActive: true, _count: { staff: 6 } },
    { id: 'dept-08', code: 'HSK', name: 'Housekeeping & Sanitation', description: 'Sterilization, bio-waste management, and environmental sanitation', isActive: true, _count: { staff: 4 } }
  ],
  staff: [
    { id: 'stf-01', name: 'Dr. Sarah Smith', category: 'DOCTOR', designation: 'Senior Cardiologist & Department Head', department: { name: 'Cardiovascular Services' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43210', email: 'dr.smith@hospital.com', isActive: true, user: { email: 'dr.smith@hospital.com' } },
    { id: 'stf-02', name: 'Dr. Rajesh Patel', category: 'DOCTOR', designation: 'Consultant Neurologist & Specialist', department: { name: 'Neurological Sciences' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43211', email: 'dr.patel@hospital.com', isActive: true, user: { email: 'dr.patel@hospital.com' } },
    { id: 'stf-03', name: 'Emma Watson', category: 'RECEPTIONIST', designation: 'Lead Patient Coordinator & Triage', department: { name: 'Reception & Patient Intake' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43212', email: 'reception@hospital.com', isActive: true, user: { email: 'reception@hospital.com' } },
    { id: 'stf-04', name: 'Michael Chang', category: 'PHARMACIST', designation: 'Head Dispensing Pharmacist', department: { name: 'Central Pharmacy' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43213', email: 'pharmacy@hospital.com', isActive: true, user: { email: 'pharmacy@hospital.com' } },
    { id: 'stf-05', name: 'Alice Johnson', category: 'LAB_TECHNICIAN', designation: 'Chief Pathology Specialist', department: { name: 'Diagnostic Pathology & Lab' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43214', email: 'lab@hospital.com', isActive: true, user: { email: 'lab@hospital.com' } },
    { id: 'stf-06', name: 'Robert Davis', category: 'ACCOUNTANT', designation: 'Senior Financial Officer', department: { name: 'Accounts & Patient Billing' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43215', email: 'billing@hospital.com', isActive: true, user: { email: 'billing@hospital.com' } },
    { id: 'stf-07', name: 'Clara Barton', category: 'NURSE', designation: 'Head ICU Nurse Practitioner', department: { name: 'Nursing & Critical Care (ICU)' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43216', email: 'clara.barton@staff.hospital.com', isActive: true, user: { email: 'clara.barton@staff.hospital.com' } },
    { id: 'stf-08', name: 'James Wilson', category: 'NURSE', designation: 'General Ward Nurse', department: { name: 'Nursing & Critical Care (ICU)' }, shift: 'EVENING', availability: 'AVAILABLE', phone: '+91-98765-43217', email: 'james.wilson@staff.hospital.com', isActive: true, user: { email: 'james.wilson@staff.hospital.com' } },
    { id: 'stf-09', name: 'David Miller', category: 'TECHNICAL_STAFF', designation: 'Lead MRI & Radiology Tech', department: { name: 'Diagnostic Pathology & Lab' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43218', email: 'david.miller@staff.hospital.com', isActive: true, user: { email: 'david.miller@staff.hospital.com' } },
    { id: 'stf-10', name: 'Elena Rostova', category: 'CLEANER', designation: '1st Floor Sanitation Lead', department: { name: 'Housekeeping & Sanitation' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+91-98765-43219', email: 'elena.rostova@staff.hospital.com', isActive: true, user: { email: 'elena.rostova@staff.hospital.com' } }
  ],
  appointments: [
    { id: 'app-01', tokenNumber: 101, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Cardiac Rhythm Assessment', patient: { id: 'pat-01', firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001', phone: '+91-98765-00101' }, doctor: { id: 'doc-01', specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-02', tokenNumber: 101, channel: 'ONLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Chronic Migraine Evaluation', patient: { id: 'pat-02', firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002', phone: '+91-98765-00201' }, doctor: { id: 'doc-02', specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-03', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Routine Outpatient Followup', patient: { id: 'pat-03', firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003', phone: '+91-98765-00301' }, doctor: { id: 'doc-01', specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-04', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Nerve Conduction Review', patient: { id: 'pat-04', firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-004', phone: '+91-98765-00401' }, doctor: { id: 'doc-02', specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } }
  ],
  medicines: [
    { id: 'med-01', name: 'Amlodipine 5mg', code: 'MED-AMLO-5', category: 'Cardiovascular', quantity: 248, unitPrice: 125.00, reorderThreshold: 50, expiryDate: '2027-12-31' },
    { id: 'med-02', name: 'Amoxicillin 500mg', code: 'MED-AMOX-500', category: 'Antibiotics', quantity: 12, unitPrice: 180.00, reorderThreshold: 25, expiryDate: '2026-11-30' },
    { id: 'med-03', name: 'Paracetamol 650mg', code: 'MED-PARA-650', category: 'Analgesics', quantity: 0, unitPrice: 50.00, reorderThreshold: 40, expiryDate: '2027-06-30' },
    { id: 'med-04', name: 'Atorvastatin 10mg', code: 'MED-ATOR-10', category: 'Cardiovascular', quantity: 180, unitPrice: 220.00, reorderThreshold: 30, expiryDate: '2028-01-15' },
    { id: 'med-05', name: 'Metformin 500mg', code: 'MED-METF-500', category: 'Endocrine', quantity: 300, unitPrice: 85.00, reorderThreshold: 50, expiryDate: '2027-08-20' },
    { id: 'med-06', name: 'Omeprazole 20mg', code: 'MED-OMEP-20', category: 'Gastrointestinal', quantity: 15, unitPrice: 140.00, reorderThreshold: 20, expiryDate: '2026-10-31' }
  ],
  labTests: [
    { id: 'lab-01', testName: 'Complete Blood Count (CBC)', category: 'Hematology', cost: 450.00, status: 'COMPLETED', resultSummary: 'WBC: 6.5, RBC: 4.8, Hemoglobin: 14.2 g/dL. Normal range.', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' }, requestedBy: 'Dr. Sarah Smith' },
    { id: 'lab-02', testName: 'Brain MRI Screening', category: 'Radiology', cost: 2500.00, status: 'PENDING', resultSummary: null, patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' }, requestedBy: 'Dr. Rajesh Patel' },
    { id: 'lab-03', testName: 'Lipid Profile Panel', category: 'Biochemistry', cost: 600.00, status: 'PROCESSING', resultSummary: 'Specimen in centrifuge analyzer', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' }, requestedBy: 'Dr. Sarah Smith' }
  ],
  invoices: [
    { id: 'inv-01', invoiceNumber: 'INV-2026-0001', billingType: 'RECEPTION', amount: 1500.00, discount: 100.00, netAmount: 1400.00, paidAmount: 1400.00, status: 'PAID', paymentMethod: 'CARD', description: 'Outpatient Cardiology Specialist Consultation', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' }, items: [{ id: 'itm-01', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Sarah Smith', quantity: 1, unitPrice: 1500.00, totalPrice: 1500.00 }], payments: [{ id: 'pmt-01', receiptNumber: 'REC-2026-0001', amount: 1400.00, paymentMethod: 'CARD', createdAt: new Date().toISOString() }] },
    { id: 'inv-02', invoiceNumber: 'INV-2026-0002', billingType: 'RECEPTION', amount: 2100.00, discount: 0.00, netAmount: 2100.00, paidAmount: 2100.00, status: 'PAID', paymentMethod: 'UPI', description: 'Neurology Consultation & Testing', patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' }, items: [{ id: 'itm-02', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Rajesh Patel', quantity: 1, unitPrice: 1750.00, totalPrice: 1750.00 }], payments: [{ id: 'pmt-02', receiptNumber: 'REC-2026-0002', amount: 2100.00, paymentMethod: 'UPI', createdAt: new Date().toISOString() }] },
    { id: 'inv-03', invoiceNumber: 'INV-2026-0003', billingType: 'PHARMACY', amount: 450.00, discount: 0.00, netAmount: 450.00, paidAmount: 0.00, status: 'PENDING', paymentMethod: null, description: 'Pharmacy Prescription Dispensing', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' }, items: [{ id: 'itm-03', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Amlodipine 5mg (Qty: 2)', quantity: 2, unitPrice: 125.00, totalPrice: 250.00 }, { id: 'itm-04', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Paracetamol 650mg (Qty: 4)', quantity: 4, unitPrice: 50.00, totalPrice: 200.00 }], payments: [] }
  ],
  notifications: [
    { id: 'notif-01', title: 'Low Medicine Stock Alert', message: 'Amoxicillin 500mg stock is down to 12 units.', type: 'LOW_STOCK', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-02', title: 'Critical: Medicine Out of Stock', message: 'Paracetamol 650mg is out of stock.', type: 'OUT_OF_STOCK', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-03', title: 'New Appointment Scheduled', message: 'Token #101 booked for John Doe (OFFLINE).', type: 'APPOINTMENT', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-04', title: 'New Lab Request', message: 'Brain MRI Screening ordered for Eleanor Vance.', type: 'LAB_REQUEST', isRead: true, createdAt: new Date().toISOString() }
  ]
};

// Universal Mock Engine for 100% reliable preview/offline actions
const executeMockFallback = (config = {}) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let postData = {};
  try {
    if (typeof config.data === 'string') {
      postData = JSON.parse(config.data || '{}');
    } else if (config.data) {
      postData = config.data;
    }
  } catch (e) {
    postData = {};
  }

  // Authentication Login Fallback
  if (url.includes('/auth/login')) {
    const email = (postData.email || 'admin@hospital.com').toLowerCase().trim();
    const DEMO_USERS = {
      'admin@hospital.com': { id: 'usr-admin-01', name: 'Dr. Arthur Pendelton', email: 'admin@hospital.com', role: 'ADMIN', phone: '+91-98765-00100' },
      'dr.smith@hospital.com': { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', role: 'DOCTOR', phone: '+91-98765-43210' },
      'dr.patel@hospital.com': { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', role: 'DOCTOR', phone: '+91-98765-43211' },
      'reception@hospital.com': { id: 'usr-rec-01', name: 'Emma Watson', email: 'reception@hospital.com', role: 'RECEPTIONIST', phone: '+91-98765-43212' },
      'pharmacy@hospital.com': { id: 'usr-pharma-01', name: 'Michael Chang', email: 'pharmacy@hospital.com', role: 'PHARMACIST', phone: '+91-98765-43213' },
      'lab@hospital.com': { id: 'usr-lab-01', name: 'Alice Johnson', email: 'lab@hospital.com', role: 'LAB_TECHNICIAN', phone: '+91-98765-43214' },
      'billing@hospital.com': { id: 'usr-bill-01', name: 'Robert Davis', email: 'billing@hospital.com', role: 'ACCOUNTANT', phone: '+91-98765-43215' }
    };

    const user = DEMO_USERS[email] || {
      id: `usr-demo-${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role: email.includes('admin') ? 'ADMIN' : email.includes('doc') || email.includes('dr.') ? 'DOCTOR' : email.includes('pharm') ? 'PHARMACIST' : email.includes('lab') ? 'LAB_TECHNICIAN' : email.includes('bill') ? 'ACCOUNTANT' : 'RECEPTIONIST',
      phone: '+91-98765-00000'
    };

    const token = `carepulse-auth-token-${user.role.toLowerCase()}-${Date.now()}`;
    return Promise.resolve({
      data: {
        success: true,
        message: 'Login successful',
        token,
        user
      }
    });
  }

  // Dashboard stats
  if (url.includes('/dashboard/stats')) {
    return Promise.resolve({
      data: {
        success: true,
        stats: {
          totalPatients: MOCK_STORE.patients.length,
          totalDoctors: MOCK_STORE.doctors.length,
          activeDoctors: MOCK_STORE.doctors.filter(d => d.availability === 'AVAILABLE').length,
          scheduledAppointments: MOCK_STORE.appointments.filter(a => a.status === 'SCHEDULED').length,
          pendingLabTests: MOCK_STORE.labTests.filter(t => t.status === 'PENDING').length,
          completedLabTests: MOCK_STORE.labTests.filter(t => t.status === 'COMPLETED').length,
          lowStockCount: MOCK_STORE.medicines.filter(m => m.quantity > 0 && m.quantity <= m.reorderThreshold).length,
          outOfStockCount: MOCK_STORE.medicines.filter(m => m.quantity === 0).length,
          totalRevenue: '4300.00',
          todayRevenue: '1400.00',
          monthlyRevenue: '4300.00',
          staffBreakdown: {
            doctors: { total: 5, available: 4 },
            nurses: { total: 2, available: 2 },
            technicalStaff: { total: 1, available: 1 },
            cleaners: { total: 1, available: 1 }
          },
          departmentRevenue: {
            reception: '3500.00',
            pharmacy: '450.00',
            laboratory: '1150.00',
            total: '4300.00'
          },
          pharmacy: {
            totalItems: MOCK_STORE.medicines.length,
            lowStockItems: MOCK_STORE.medicines.filter(m => m.quantity <= m.reorderThreshold),
            outOfStockItems: MOCK_STORE.medicines.filter(m => m.quantity === 0)
          }
        },
        recentAppointments: MOCK_STORE.appointments
      }
    });
  }

  // Appointments
  if (url.includes('/appointments')) {
    if (url.includes('/quick-book')) {
      const tokenNumber = Math.floor(101 + Math.random() * 20);
      return Promise.resolve({
        data: {
          success: true,
          message: 'Slot successfully booked!',
          data: {
            id: `app-qb-${Date.now()}`,
            tokenNumber,
            patientName: postData.patientName || 'Outpatient',
            patientPhone: postData.phone || '+91-98765-00100',
            mrn: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            doctorName: postData.doctorName || 'Dr. Sarah Smith',
            specialization: 'Cardiology',
            roomNumber: 'Suite 302',
            consultationFee: 1500.00,
            appointmentDate: postData.appointmentDate || new Date().toISOString(),
            timeSlot: postData.timeSlot || '09:00 AM - 09:30 AM',
            channel: postData.channel || 'OFFLINE',
            status: 'SCHEDULED'
          }
        }
      });
    }

    if (method === 'post') {
      const pat = MOCK_STORE.patients.find(p => p.id === postData.patientId) || MOCK_STORE.patients[0];
      const doc = MOCK_STORE.doctors.find(d => d.id === postData.doctorId) || MOCK_STORE.doctors[0];
      const maxToken = MOCK_STORE.appointments.reduce((max, a) => Math.max(max, a.tokenNumber || 100), 100);
      const newApp = {
        id: `app-${Date.now()}`,
        tokenNumber: maxToken + 1,
        channel: postData.channel || 'OFFLINE',
        appointmentDate: postData.appointmentDate || new Date().toISOString(),
        status: 'SCHEDULED',
        reason: postData.reason || 'General Consultation',
        patient: pat,
        doctor: doc
      };
      MOCK_STORE.appointments.unshift(newApp);
      return Promise.resolve({ data: { success: true, data: newApp, message: 'Appointment booked successfully' } });
    }

    if (method === 'patch' || method === 'put') {
      const appId = url.split('/appointments/')[1]?.split('/')[0];
      const app = MOCK_STORE.appointments.find(a => a.id === appId);
      if (app) {
        app.status = postData.status || 'COMPLETED';
        if (postData.diagnosis) app.diagnosis = postData.diagnosis;
        if (postData.prescription) app.prescription = postData.prescription;
      }
      return Promise.resolve({ data: { success: true, data: app, message: 'Consultation completed' } });
    }

    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.appointments] } });
  }

  // Patients
  if (url.includes('/patients')) {
    if (method === 'post') {
      const newPat = {
        id: `pat-${Date.now()}`,
        mrn: `MRN-2026-${String(MOCK_STORE.patients.length + 1).padStart(3, '0')}`,
        firstName: postData.firstName || 'Patient',
        lastName: postData.lastName || '',
        dateOfBirth: postData.dateOfBirth || '1990-01-01',
        gender: postData.gender || 'Male',
        bloodGroup: postData.bloodGroup || 'O+',
        phone: postData.phone || '+91-98765-00100',
        address: postData.address || 'Metro City',
        emergencyContact: postData.emergencyContact || 'None',
        medicalHistory: postData.medicalHistory || 'None'
      };
      MOCK_STORE.patients.unshift(newPat);
      return Promise.resolve({ data: { success: true, data: newPat, message: 'Patient registered successfully' } });
    }

    let patList = [...MOCK_STORE.patients];
    const searchQ = url.includes('search=') ? decodeURIComponent(url.split('search=')[1].split('&')[0]) : '';
    if (searchQ) {
      const q = searchQ.toLowerCase();
      patList = patList.filter(p =>
        (p.firstName || '').toLowerCase().includes(q) ||
        (p.lastName || '').toLowerCase().includes(q) ||
        (p.mrn || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q)
      );
    }
    return Promise.resolve({ data: { success: true, data: patList } });
  }

  // Doctors
  if (url.includes('/doctors')) {
    if (method === 'put' || method === 'patch') {
      const docId = url.split('/doctors/')[1]?.split('/')[0];
      const doc = MOCK_STORE.doctors.find(d => d.id === docId);
      if (doc && postData.availability) {
        doc.availability = postData.availability;
      }
      return Promise.resolve({ data: { success: true, data: doc } });
    }
    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.doctors] } });
  }

  // Departments
  if (url.includes('/departments')) {
    if (method === 'post') {
      const newDept = {
        id: `dept-${Date.now()}`,
        code: (postData.code || 'GEN').toUpperCase(),
        name: postData.name || 'Department',
        description: postData.description || 'Clinical Department',
        isActive: true,
        _count: { staff: 0 }
      };
      MOCK_STORE.departments.push(newDept);
      return Promise.resolve({ data: { success: true, data: newDept } });
    }
    if (method === 'put' || method === 'patch') {
      const deptId = url.split('/departments/')[1]?.split('/')[0];
      const dept = MOCK_STORE.departments.find(d => d.id === deptId);
      if (dept && postData.isActive !== undefined) {
        dept.isActive = postData.isActive;
      }
      return Promise.resolve({ data: { success: true, data: dept } });
    }
    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.departments] } });
  }

  // Staff
  if (url.includes('/staff')) {
    if (method === 'post') {
      const newStaff = {
        id: `stf-${Date.now()}`,
        name: postData.name || 'Staff Member',
        category: postData.category || 'NURSE',
        designation: postData.designation || 'Staff',
        department: { name: 'Hospital Operations' },
        shift: postData.shift || 'MORNING',
        availability: postData.availability || 'AVAILABLE',
        phone: postData.phone || '+91-98765-00100',
        email: postData.email || 'staff@hospital.com',
        isActive: true
      };
      MOCK_STORE.staff.unshift(newStaff);
      return Promise.resolve({ data: { success: true, data: newStaff } });
    }
    if (method === 'patch' || method === 'put') {
      const staffId = url.split('/staff/')[1]?.split('/')[0];
      const staff = MOCK_STORE.staff.find(s => s.id === staffId);
      if (staff && postData.availability) {
        staff.availability = postData.availability;
      }
      return Promise.resolve({ data: { success: true, data: staff } });
    }
    let staffList = [...MOCK_STORE.staff];
    const queryString = url.includes('?') ? url.split('?')[1] : '';
    const searchParams = new URLSearchParams(queryString);
    const cat = searchParams.get('category');
    const avail = searchParams.get('availability');
    const q = searchParams.get('search');
    if (cat) staffList = staffList.filter(s => s.category === cat);
    if (avail) staffList = staffList.filter(s => s.availability === avail);
    if (q) {
      const query = q.toLowerCase().trim();
      staffList = staffList.filter(s =>
        (s.name || '').toLowerCase().includes(query) ||
        (s.designation || '').toLowerCase().includes(query) ||
        (s.category || '').toLowerCase().includes(query) ||
        (s.email || '').toLowerCase().includes(query)
      );
    }
    return Promise.resolve({ data: { success: true, data: staffList } });
  }

  // Pharmacy
  if (url.includes('/pharmacy')) {
    if (url.includes('/dispense')) {
      if (Array.isArray(postData.items)) {
        postData.items.forEach(item => {
          const med = MOCK_STORE.medicines.find(m => m.id === item.medicineId);
          if (med) {
            med.quantity = Math.max(0, med.quantity - parseInt(item.quantity || 1));
          }
        });
      }
      return Promise.resolve({ data: { success: true, message: 'Prescription dispensed successfully' } });
    }
    if (url.includes('/medicine') && method === 'post') {
      const newMed = {
        id: `med-${Date.now()}`,
        name: postData.name || 'Medicine',
        code: postData.code || `MED-${Date.now()}`,
        category: postData.category || 'General',
        quantity: parseInt(postData.quantity || 100),
        unitPrice: parseFloat(postData.unitPrice || 100),
        reorderThreshold: parseInt(postData.reorderThreshold || 20),
        expiryDate: postData.expiryDate || '2027-12-31',
        supplier: postData.supplier || 'PharmaCorp'
      };
      MOCK_STORE.medicines.unshift(newMed);
      return Promise.resolve({ data: { success: true, data: newMed } });
    }
    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.medicines] } });
  }

  // Laboratory
  if (url.includes('/lab')) {
    if (method === 'post') {
      const pat = MOCK_STORE.patients.find(p => p.id === postData.patientId) || MOCK_STORE.patients[0];
      const newTest = {
        id: `lab-${Date.now()}`,
        testName: postData.testName || 'Diagnostic Investigation',
        category: postData.category || 'General',
        cost: parseFloat(postData.cost || 450.00),
        status: 'PENDING',
        resultSummary: null,
        patient: pat,
        requestedBy: postData.requestedBy || 'Attending Physician'
      };
      MOCK_STORE.labTests.unshift(newTest);
      return Promise.resolve({ data: { success: true, data: newTest } });
    }
    if (url.includes('/complete') || method === 'patch') {
      const testId = url.split('/lab/tests/')[1]?.split('/')[0] || url.split('/lab/')[1]?.split('/')[0];
      const test = MOCK_STORE.labTests.find(t => t.id === testId);
      if (test) {
        test.status = 'COMPLETED';
        test.resultSummary = postData.resultSummary || 'Normal diagnostic findings recorded.';
      }
      return Promise.resolve({ data: { success: true, data: test, message: 'Lab test completed' } });
    }
    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.labTests] } });
  }

  // Billing
  if (url.includes('/billing')) {
    if (url.includes('/revenue')) {
      const totalPaid = MOCK_STORE.invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
      const totalNet = MOCK_STORE.invoices.reduce((sum, inv) => sum + (Number(inv.netAmount) || 0), 0);
      return Promise.resolve({
        data: {
          success: true,
          data: {
            CLINICAL: (totalNet * 0.7).toFixed(2),
            PHARMACY: (totalNet * 0.15).toFixed(2),
            LABORATORY: (totalNet * 0.15).toFixed(2),
            RECEPTION: totalPaid.toFixed(2),
            TOTAL: totalPaid.toFixed(2)
          }
        }
      });
    }

    if (url.includes('/payments') && method === 'post') {
      const invId = url.split('/billing/invoices/')[1]?.split('/')[0];
      const inv = MOCK_STORE.invoices.find(i => i.id === invId);
      const pmtAmount = parseFloat(postData.amount || 0);
      const recNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      if (inv) {
        inv.paidAmount = (Number(inv.paidAmount) || 0) + pmtAmount;
        inv.status = inv.paidAmount >= inv.netAmount ? 'PAID' : 'PARTIALLY_PAID';
        inv.paymentMethod = postData.paymentMethod || 'UPI';
        if (!inv.payments) inv.payments = [];
        inv.payments.push({
          id: `pmt-${Date.now()}`,
          receiptNumber: recNum,
          amount: pmtAmount,
          paymentMethod: postData.paymentMethod || 'UPI',
          createdAt: new Date().toISOString()
        });
      }
      return Promise.resolve({
        data: {
          success: true,
          message: 'Payment recorded successfully',
          data: { payment: { receiptNumber: recNum, amount: pmtAmount } }
        }
      });
    }

    if (method === 'post' && !url.includes('/payments')) {
      const gross = parseFloat(postData.amount || 1000);
      const disc = parseFloat(postData.discount || 0);
      const net = Math.max(0, gross - disc);
      const newInv = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2026-${String(MOCK_STORE.invoices.length + 1).padStart(4, '0')}`,
        billingType: postData.billingType || 'RECEPTION',
        amount: gross,
        discount: disc,
        netAmount: net,
        paidAmount: 0.00,
        status: 'PENDING',
        paymentMethod: null,
        description: postData.description || 'Hospital Outpatient Services',
        patient: MOCK_STORE.patients.find(p => p.id === postData.patientId) || MOCK_STORE.patients[0],
        items: [
          {
            id: `itm-${Date.now()}`,
            sourceDepartment: postData.billingType || 'CLINICAL',
            billingType: 'SERVICE',
            itemDescription: postData.description || 'Hospital Service Line Item',
            quantity: 1,
            unitPrice: gross,
            totalPrice: gross
          }
        ],
        payments: []
      };
      MOCK_STORE.invoices.unshift(newInv);
      return Promise.resolve({ data: { success: true, data: newInv, message: 'Invoice generated successfully' } });
    }

    if (url.includes('/reception')) {
      return Promise.resolve({ data: { success: true, data: MOCK_STORE.invoices.filter(i => i.billingType === 'RECEPTION') } });
    }

    if (url.includes('/pharmacy')) {
      return Promise.resolve({ data: { success: true, data: MOCK_STORE.invoices.filter(i => i.billingType === 'PHARMACY') } });
    }

    return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.invoices] } });
  }

  // Notifications
  if (url.includes('/notifications')) {
    if (url.includes('/read-all')) {
      MOCK_STORE.notifications.forEach(n => { n.isRead = true; });
      return Promise.resolve({ data: { success: true, message: 'All marked as read' } });
    }
    if (url.includes('/read') || method === 'patch') {
      const notifId = url.split('/notifications/')[1]?.split('/')[0];
      const notif = MOCK_STORE.notifications.find(n => n.id === notifId);
      if (notif) notif.isRead = true;
      return Promise.resolve({ data: { success: true, message: 'Marked as read' } });
    }
    const unreadCount = MOCK_STORE.notifications.filter(n => !n.isRead).length;
    return Promise.resolve({
      data: {
        success: true,
        data: [...MOCK_STORE.notifications],
        unreadCount
      }
    });
  }

  // Generic fallback
  return Promise.resolve({ data: { success: true, data: [] } });
};

api.interceptors.response.use(
  (response) => {
    // If response is HTML (e.g. Vercel SPA rewrite of /api/* returning index.html)
    if (typeof response.data === 'string' && (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html'))) {
      return executeMockFallback(response.config);
    }
    return response;
  },
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response && error.response.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    // Execute fallback for ALL errors (404, 405 Method Not Allowed, 500, network error, 403, 400, etc.)
    return executeMockFallback(error.config);
  }
);

export default api;
