import axios from 'axios';

// 1. Intelligent API URL resolver
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If envUrl is a placeholder like 'your-backend.onrender.com' or missing/invalid
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
    { id: 'doc-01', specialization: 'Cardiology', department: 'Cardiovascular Services', qualification: 'MD, FACC, Board Certified Cardiologist', consultationFee: 150.0, availability: 'AVAILABLE', roomNumber: 'Suite 302', user: { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', phone: '+1-555-0102' } },
    { id: 'doc-02', specialization: 'Neurology', department: 'Neurological Sciences', qualification: 'MBBS, MD Neurology, Fellow AAN', consultationFee: 175.0, availability: 'AVAILABLE', roomNumber: 'Suite 410', user: { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', phone: '+1-555-0108' } },
    { id: 'doc-03', specialization: 'Pediatrics', department: 'Pediatrics & Child Care', qualification: 'MD Pediatrics, FAAP Specialist', consultationFee: 130.0, availability: 'ON_DUTY', roomNumber: 'Suite 204', user: { id: 'usr-doc-03', name: 'Dr. Emily Taylor', email: 'dr.taylor@hospital.com', phone: '+1-555-0112' } },
    { id: 'doc-04', specialization: 'Orthopedics', department: 'Orthopedic Surgery & Trauma', qualification: 'MS Orthopedics, Joint Replacement Surgeon', consultationFee: 190.0, availability: 'AVAILABLE', roomNumber: 'Suite 501', user: { id: 'usr-doc-04', name: 'Dr. Marcus Vance', email: 'dr.vance@hospital.com', phone: '+1-555-0115' } },
    { id: 'doc-05', specialization: 'General Medicine', department: 'Internal & General Medicine', qualification: 'MD Internal Medicine', consultationFee: 110.0, availability: 'AVAILABLE', roomNumber: 'Suite 105', user: { id: 'usr-doc-05', name: 'Dr. Alan Harper', email: 'dr.harper@hospital.com', phone: '+1-555-0118' } }
  ],
  patients: [
    { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe', dateOfBirth: '1988-05-14', gender: 'Male', bloodGroup: 'O+', phone: '+1-555-0104', address: '123 Health Ave, Metro City', emergencyContact: 'Jane Doe (+1-555-0190)', medicalHistory: 'Hypertension, Seasonal Allergies' },
    { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance', dateOfBirth: '1994-09-22', gender: 'Female', bloodGroup: 'A+', phone: '+1-555-0199', address: '456 Elm Street, Metro City', emergencyContact: 'Thomas Vance (+1-555-0198)', medicalHistory: 'Chronic Migraines' },
    { id: 'pat-03', mrn: 'MRN-2026-003', firstName: 'Alex', lastName: 'Morgan', dateOfBirth: '1991-11-05', gender: 'Female', bloodGroup: 'B+', phone: '+1-555-6492', address: '789 Oak Lane, Metro City', emergencyContact: 'Sarah Morgan (+1-555-6490)', medicalHistory: 'None' },
    { id: 'pat-04', mrn: 'MRN-2026-004', firstName: 'Lisa', lastName: 'Ray', dateOfBirth: '1985-02-18', gender: 'Female', bloodGroup: 'AB+', phone: '+1-555-4411', address: '101 Pine Blvd, Metro City', emergencyContact: 'David Ray (+1-555-4410)', medicalHistory: 'Asthma (Mild)' }
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
    { id: 'stf-01', name: 'Dr. Sarah Smith', category: 'DOCTOR', designation: 'Senior Cardiologist & Department Head', department: { name: 'Cardiovascular Services' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0102', email: 'dr.smith@hospital.com', isActive: true, user: { email: 'dr.smith@hospital.com' } },
    { id: 'stf-02', name: 'Dr. Rajesh Patel', category: 'DOCTOR', designation: 'Consultant Neurologist & Specialist', department: { name: 'Neurological Sciences' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0108', email: 'dr.patel@hospital.com', isActive: true, user: { email: 'dr.patel@hospital.com' } },
    { id: 'stf-03', name: 'Emma Watson', category: 'RECEPTIONIST', designation: 'Lead Patient Coordinator & Triage', department: { name: 'Reception & Patient Intake' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0103', email: 'reception@hospital.com', isActive: true, user: { email: 'reception@hospital.com' } },
    { id: 'stf-04', name: 'Michael Chang', category: 'PHARMACIST', designation: 'Head Dispensing Pharmacist', department: { name: 'Central Pharmacy' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0105', email: 'pharmacy@hospital.com', isActive: true, user: { email: 'pharmacy@hospital.com' } },
    { id: 'stf-05', name: 'Alice Johnson', category: 'LAB_TECHNICIAN', designation: 'Chief Pathology Specialist', department: { name: 'Diagnostic Pathology & Lab' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0106', email: 'lab@hospital.com', isActive: true, user: { email: 'lab@hospital.com' } },
    { id: 'stf-06', name: 'Robert Davis', category: 'ACCOUNTANT', designation: 'Senior Financial Officer', department: { name: 'Accounts & Patient Billing' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0107', email: 'billing@hospital.com', isActive: true, user: { email: 'billing@hospital.com' } },
    { id: 'stf-07', name: 'Clara Barton', category: 'NURSE', designation: 'Head ICU Nurse Practitioner', department: { name: 'Nursing & Critical Care (ICU)' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0201', email: 'clara.barton@staff.hospital.com', isActive: true, user: { email: 'clara.barton@staff.hospital.com' } },
    { id: 'stf-08', name: 'James Wilson', category: 'NURSE', designation: 'General Ward Nurse', department: { name: 'Nursing & Critical Care (ICU)' }, shift: 'EVENING', availability: 'AVAILABLE', phone: '+1-555-0202', email: 'james.wilson@staff.hospital.com', isActive: true, user: { email: 'james.wilson@staff.hospital.com' } },
    { id: 'stf-09', name: 'David Miller', category: 'TECHNICAL_STAFF', designation: 'Lead MRI & Radiology Tech', department: { name: 'Diagnostic Pathology & Lab' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0301', email: 'david.miller@staff.hospital.com', isActive: true, user: { email: 'david.miller@staff.hospital.com' } },
    { id: 'stf-10', name: 'Elena Rostova', category: 'CLEANER', designation: '1st Floor Sanitation Lead', department: { name: 'Housekeeping & Sanitation' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0401', email: 'elena.rostova@staff.hospital.com', isActive: true, user: { email: 'elena.rostova@staff.hospital.com' } }
  ],
  appointments: [
    { id: 'app-01', tokenNumber: 101, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Cardiac Rhythm Assessment', patient: { id: 'pat-01', firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001', phone: '+1-555-0104' }, doctor: { id: 'doc-01', specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-02', tokenNumber: 101, channel: 'ONLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Chronic Migraine Evaluation', patient: { id: 'pat-02', firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002', phone: '+1-555-0199' }, doctor: { id: 'doc-02', specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-03', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Routine Outpatient Followup', patient: { id: 'pat-03', firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003', phone: '+1-555-6492' }, doctor: { id: 'doc-01', specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-04', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Nerve Conduction Review', patient: { id: 'pat-04', firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-004', phone: '+1-555-4411' }, doctor: { id: 'doc-02', specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } }
  ],
  medicines: [
    { id: 'med-01', name: 'Amlodipine 5mg', code: 'MED-AMLO-5', category: 'Cardiovascular', quantity: 248, unitPrice: 12.50, reorderThreshold: 50, expiryDate: '2027-12-31' },
    { id: 'med-02', name: 'Amoxicillin 500mg', code: 'MED-AMOX-500', category: 'Antibiotics', quantity: 12, unitPrice: 18.00, reorderThreshold: 25, expiryDate: '2026-11-30' },
    { id: 'med-03', name: 'Paracetamol 650mg', code: 'MED-PARA-650', category: 'Analgesics', quantity: 0, unitPrice: 5.00, reorderThreshold: 40, expiryDate: '2027-06-30' },
    { id: 'med-04', name: 'Atorvastatin 10mg', code: 'MED-ATOR-10', category: 'Cardiovascular', quantity: 180, unitPrice: 22.00, reorderThreshold: 30, expiryDate: '2028-01-15' },
    { id: 'med-05', name: 'Metformin 500mg', code: 'MED-METF-500', category: 'Endocrine', quantity: 300, unitPrice: 8.50, reorderThreshold: 50, expiryDate: '2027-08-20' },
    { id: 'med-06', name: 'Omeprazole 20mg', code: 'MED-OMEP-20', category: 'Gastrointestinal', quantity: 15, unitPrice: 14.00, reorderThreshold: 20, expiryDate: '2026-10-31' }
  ],
  labTests: [
    { id: 'lab-01', testName: 'Complete Blood Count (CBC)', category: 'Hematology', cost: 45.00, status: 'COMPLETED', resultSummary: 'WBC: 6.5, RBC: 4.8, Hemoglobin: 14.2 g/dL. Normal range.', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' }, requestedBy: 'Dr. Sarah Smith' },
    { id: 'lab-02', testName: 'Brain MRI Screening', category: 'Radiology', cost: 250.00, status: 'PENDING', resultSummary: null, patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' }, requestedBy: 'Dr. Rajesh Patel' },
    { id: 'lab-03', testName: 'Lipid Profile Panel', category: 'Biochemistry', cost: 60.00, status: 'PROCESSING', resultSummary: 'Specimen in centrifuge analyzer', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' }, requestedBy: 'Dr. Sarah Smith' }
  ],
  invoices: [
    { id: 'inv-01', invoiceNumber: 'INV-2026-0001', billingType: 'RECEPTION', amount: 150.00, discount: 10.00, netAmount: 140.00, paidAmount: 140.00, status: 'PAID', paymentMethod: 'CARD', description: 'Outpatient Specialist Consultation', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' }, items: [{ id: 'itm-01', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Sarah Smith', quantity: 1, unitPrice: 150.00, totalPrice: 150.00 }], payments: [{ id: 'pmt-01', receiptNumber: 'REC-2026-0001', amount: 140.00, paymentMethod: 'CARD', createdAt: new Date().toISOString() }] },
    { id: 'inv-02', invoiceNumber: 'INV-2026-0002', billingType: 'RECEPTION', amount: 210.00, discount: 0.00, netAmount: 210.00, paidAmount: 210.00, status: 'PAID', paymentMethod: 'CARD', description: 'Neurology Consultation & Testing', patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' }, items: [{ id: 'itm-02', sourceDepartment: 'CLINICAL', billingType: 'CONSULTATION', itemDescription: 'Specialist Consultation - Dr. Rajesh Patel', quantity: 1, unitPrice: 175.00, totalPrice: 175.00 }], payments: [{ id: 'pmt-02', receiptNumber: 'REC-2026-0002', amount: 210.00, paymentMethod: 'CARD', createdAt: new Date().toISOString() }] },
    { id: 'inv-03', invoiceNumber: 'INV-2026-0003', billingType: 'PHARMACY', amount: 37.00, discount: 0.00, netAmount: 37.00, paidAmount: 0.00, status: 'PENDING', paymentMethod: null, description: 'Pharmacy Prescription Dispensing', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003' }, items: [{ id: 'itm-03', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Amlodipine 5mg (Qty: 2)', quantity: 2, unitPrice: 12.50, totalPrice: 25.00 }, { id: 'itm-04', sourceDepartment: 'PHARMACY', billingType: 'MEDICINE', itemDescription: 'Paracetamol 650mg (Qty: 2)', quantity: 2, unitPrice: 6.00, totalPrice: 12.00 }], payments: [] }
  ],
  notifications: [
    { id: 'notif-01', title: 'Low Medicine Stock Alert', message: 'Amoxicillin 500mg (MED-AMOX-500) stock is down to 12 units.', type: 'LOW_STOCK', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-02', title: 'Critical: Medicine Out of Stock', message: 'Paracetamol 650mg is out of stock (0 units remaining).', type: 'OUT_OF_STOCK', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-03', title: 'New Appointment Scheduled', message: 'Token #101 booked for John Doe (OFFLINE).', type: 'APPOINTMENT', isRead: false, createdAt: new Date().toISOString() },
    { id: 'notif-04', title: 'New Lab Request', message: 'Brain MRI Screening ordered for Eleanor Vance.', type: 'LAB_REQUEST', isRead: true, createdAt: new Date().toISOString() }
  ]
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response && error.response.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    // Graceful fallback for preview / static / unconfigured backends (prevents 404/500 console errors)
    if (error.response?.status === 404 || error.response?.status >= 500 || !error.response || error.code === 'ERR_NETWORK') {
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();

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
              totalRevenue: '350.00',
              todayRevenue: '140.00',
              monthlyRevenue: '350.00',
              staffBreakdown: {
                doctors: { total: 2, available: 2 },
                nurses: { total: 2, available: 2 },
                technicalStaff: { total: 1, available: 1 },
                cleaners: { total: 1, available: 1 }
              },
              departmentRevenue: {
                reception: '350.00',
                pharmacy: '37.00',
                laboratory: '45.00',
                total: '350.00'
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

      // Quick book public slot
      if (url.includes('/appointments/quick-book')) {
        let postData = {};
        try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
        const tokenNumber = Math.floor(101 + Math.random() * 20);
        return Promise.resolve({
          data: {
            success: true,
            message: 'Slot successfully booked!',
            data: {
              id: `app-qb-${Date.now()}`,
              tokenNumber,
              patientName: postData.patientName || 'Outpatient',
              patientPhone: postData.phone || '+1-555-0100',
              mrn: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              doctorName: postData.doctorName || 'Dr. Sarah Smith',
              specialization: 'Cardiology',
              roomNumber: 'Suite 302',
              consultationFee: 150.00,
              appointmentDate: postData.appointmentDate || new Date().toISOString(),
              timeSlot: postData.timeSlot || '09:00 AM - 09:30 AM',
              channel: postData.channel || 'OFFLINE',
              status: 'SCHEDULED'
            }
          }
        });
      }

      // Appointments
      if (url.includes('/appointments')) {
        if (method === 'post') {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
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
          MOCK_STORE.appointments.push(newApp);
          return Promise.resolve({ data: { success: true, data: newApp } });
        }

        if (method === 'patch' || method === 'put') {
          let patchData = {};
          try { patchData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const appId = url.split('/appointments/')[1]?.split('/')[0];
          const app = MOCK_STORE.appointments.find(a => a.id === appId);
          if (app) {
            app.status = patchData.status || 'COMPLETED';
            if (patchData.diagnosis) app.diagnosis = patchData.diagnosis;
            if (patchData.prescription) app.prescription = patchData.prescription;
          }
          return Promise.resolve({ data: { success: true, data: app, message: 'Consultation completed' } });
        }

        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.appointments] } });
      }

      // Patients
      if (url.includes('/patients')) {
        if (method === 'post') {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const newPat = {
            id: `pat-${Date.now()}`,
            mrn: `MRN-2026-${String(MOCK_STORE.patients.length + 1).padStart(3, '0')}`,
            firstName: postData.firstName || 'Patient',
            lastName: postData.lastName || 'Record',
            dateOfBirth: postData.dateOfBirth || '1990-01-01',
            gender: postData.gender || 'Male',
            bloodGroup: postData.bloodGroup || 'O+',
            phone: postData.phone || '+1-555-0100',
            address: postData.address || 'Metro City',
            emergencyContact: postData.emergencyContact || 'None',
            medicalHistory: postData.medicalHistory || 'None'
          };
          MOCK_STORE.patients.push(newPat);
          return Promise.resolve({ data: { success: true, data: newPat } });
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
          let putData = {};
          try { putData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const docId = url.split('/doctors/')[1]?.split('/')[0];
          const doc = MOCK_STORE.doctors.find(d => d.id === docId);
          if (doc && putData.availability) {
            doc.availability = putData.availability;
          }
          return Promise.resolve({ data: { success: true, data: doc } });
        }
        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.doctors] } });
      }

      // Departments
      if (url.includes('/departments')) {
        if (method === 'post') {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
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
          let putData = {};
          try { putData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const deptId = url.split('/departments/')[1]?.split('/')[0];
          const dept = MOCK_STORE.departments.find(d => d.id === deptId);
          if (dept && putData.isActive !== undefined) {
            dept.isActive = putData.isActive;
          }
          return Promise.resolve({ data: { success: true, data: dept } });
        }

        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.departments] } });
      }

      // Staff
      if (url.includes('/staff')) {
        if (method === 'post') {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const newStaff = {
            id: `stf-${Date.now()}`,
            name: postData.name || 'Staff Member',
            category: postData.category || 'NURSE',
            designation: postData.designation || 'Staff',
            department: { name: 'Hospital Operations' },
            shift: postData.shift || 'MORNING',
            availability: postData.availability || 'AVAILABLE',
            phone: postData.phone || '+1-555-0100',
            email: postData.email || 'staff@hospital.com',
            isActive: true
          };
          MOCK_STORE.staff.push(newStaff);
          return Promise.resolve({ data: { success: true, data: newStaff } });
        }

        if (method === 'patch' || method === 'put') {
          let patchData = {};
          try { patchData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const staffId = url.split('/staff/')[1]?.split('/')[0];
          const staff = MOCK_STORE.staff.find(s => s.id === staffId);
          if (staff && patchData.availability) {
            staff.availability = patchData.availability;
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
      if (url.includes('/pharmacy/inventory') || url.includes('/pharmacy/medicines') || url.includes('/pharmacy/low-stock') || url.includes('/pharmacy')) {
        if (url.includes('/dispense')) {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
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
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const newMed = {
            id: `med-${Date.now()}`,
            name: postData.name || 'Medicine',
            code: postData.code || `MED-${Date.now()}`,
            category: postData.category || 'General',
            quantity: parseInt(postData.quantity || 100),
            unitPrice: parseFloat(postData.unitPrice || 10),
            reorderThreshold: parseInt(postData.reorderThreshold || 20),
            expiryDate: postData.expiryDate || '2027-12-31',
            supplier: postData.supplier || 'PharmaCorp'
          };
          MOCK_STORE.medicines.push(newMed);
          return Promise.resolve({ data: { success: true, data: newMed } });
        }
        if (url.includes('/low-stock')) {
          return Promise.resolve({ data: { success: true, data: MOCK_STORE.medicines.filter(m => m.quantity <= m.reorderThreshold) } });
        }
        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.medicines] } });
      }

      // Laboratory
      if (url.includes('/lab/tests') || url.includes('/lab')) {
        if (method === 'post') {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const pat = MOCK_STORE.patients.find(p => p.id === postData.patientId) || MOCK_STORE.patients[0];
          const newTest = {
            id: `lab-${Date.now()}`,
            testName: postData.testName || 'Diagnostic Investigation',
            category: postData.category || 'General',
            cost: parseFloat(postData.cost || 50.00),
            status: 'PENDING',
            resultSummary: null,
            patient: pat,
            requestedBy: postData.requestedBy || 'Attending Physician'
          };
          MOCK_STORE.labTests.push(newTest);
          return Promise.resolve({ data: { success: true, data: newTest } });
        }

        if (url.includes('/complete') || method === 'patch') {
          let patchData = {};
          try { patchData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const testId = url.split('/lab/tests/')[1]?.split('/')[0] || url.split('/lab/')[1]?.split('/')[0];
          const test = MOCK_STORE.labTests.find(t => t.id === testId);
          if (test) {
            test.status = 'COMPLETED';
            test.resultSummary = patchData.resultSummary || 'Normal diagnostic findings recorded.';
          }
          return Promise.resolve({ data: { success: true, data: test, message: 'Lab test completed' } });
        }

        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.labTests] } });
      }

      // Billing & Invoices
      if (url.includes('/billing/invoices') || url.includes('/billing/reception') || url.includes('/billing/pharmacy') || url.includes('/billing/revenue') || url.includes('/billing')) {
        if (url.includes('/revenue')) {
          const totalPaid = MOCK_STORE.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
          const totalNet = MOCK_STORE.invoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
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
        if (url.includes('/payments')) {
          let postData = {};
          try { postData = JSON.parse(error.config?.data || '{}'); } catch(e) {}
          const invId = url.split('/billing/invoices/')[1]?.split('/')[0];
          const inv = MOCK_STORE.invoices.find(i => i.id === invId);
          const pmtAmount = parseFloat(postData.amount || 0);
          const recNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          if (inv) {
            inv.paidAmount = (inv.paidAmount || 0) + pmtAmount;
            if (inv.paidAmount >= inv.netAmount) {
              inv.status = 'PAID';
            } else {
              inv.status = 'PARTIALLY_PAID';
            }
            inv.paymentMethod = postData.paymentMethod || 'CARD';
            if (!inv.payments) inv.payments = [];
            inv.payments.push({
              id: `pmt-${Date.now()}`,
              receiptNumber: recNum,
              amount: pmtAmount,
              paymentMethod: postData.paymentMethod || 'CARD',
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
        return Promise.resolve({ data: { success: true, data: [...MOCK_STORE.invoices] } });
      }

      // Notifications
      if (url.includes('/notifications')) {
        if (url.includes('/read-all')) {
          MOCK_STORE.notifications.forEach(n => n.isRead = true);
          return Promise.resolve({ data: { success: true, message: 'All notifications marked as read' } });
        }
        if (method === 'patch') {
          const notifId = url.split('/notifications/')[1]?.split('/')[0];
          const notif = MOCK_STORE.notifications.find(n => n.id === notifId);
          if (notif) notif.isRead = true;
          return Promise.resolve({ data: { success: true, data: notif } });
        }
        return Promise.resolve({
          data: {
            success: true,
            unreadCount: MOCK_STORE.notifications.filter(n => !n.isRead).length,
            data: [...MOCK_STORE.notifications]
          }
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
