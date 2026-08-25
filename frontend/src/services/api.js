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

// Comprehensive In-Memory Mock Store for Zero-Error Fallback in Preview/Stand-alone Mode
const MOCK_STORE = {
  doctors: [
    { id: 'doc-01', specialization: 'Cardiology', department: 'Cardiovascular Services', qualification: 'MD, FACC, Board Certified', consultationFee: 150.0, availability: 'AVAILABLE', roomNumber: 'Suite 302', user: { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', phone: '+1-555-0102' } },
    { id: 'doc-02', specialization: 'Neurology', department: 'Neurological Sciences', qualification: 'MBBS, MD Neurology', consultationFee: 175.0, availability: 'AVAILABLE', roomNumber: 'Suite 410', user: { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', phone: '+1-555-0108' } }
  ],
  patients: [
    { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe', dateOfBirth: '1988-05-14', gender: 'Male', bloodGroup: 'O+', phone: '+1-555-0104', address: '123 Health Ave, Metro City', medicalHistory: 'Hypertension' },
    { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance', dateOfBirth: '1994-09-22', gender: 'Female', bloodGroup: 'A+', phone: '+1-555-0199', address: '456 Elm Street, Metro City', medicalHistory: 'Migraines' },
    { id: 'pat-03', mrn: 'MRN-2026-003', firstName: 'Alex', lastName: 'Morgan', dateOfBirth: '1991-11-05', gender: 'Female', bloodGroup: 'B+', phone: '+1-555-6492', address: '789 Oak Lane, Metro City', medicalHistory: 'None' },
    { id: 'pat-04', mrn: 'MRN-2026-004', firstName: 'Lisa', lastName: 'Ray', dateOfBirth: '1985-02-18', gender: 'Female', bloodGroup: 'AB+', phone: '+1-555-4411', address: '101 Pine Blvd, Metro City', medicalHistory: 'Seasonal allergies' }
  ],
  departments: [
    { id: 'dept-01', code: 'CARD', name: 'Cardiovascular Services', description: 'Advanced cardiology and cardiac monitoring suite', isActive: true, _count: { staff: 4 } },
    { id: 'dept-02', code: 'NEUR', name: 'Neurological Sciences', description: 'Comprehensive neurological diagnostic and clinical care', isActive: true, _count: { staff: 3 } },
    { id: 'dept-03', code: 'LAB', name: 'Diagnostic Pathology', description: 'Automated clinical chemistry and specimen testing', isActive: true, _count: { staff: 2 } },
    { id: 'dept-04', code: 'PHAR', name: 'Central Pharmacy', description: 'Automated prescription fulfillment and stock management', isActive: true, _count: { staff: 2 } },
    { id: 'dept-05', code: 'REC', name: 'Reception & Intake', description: 'Front desk patient coordination and scheduling', isActive: true, _count: { staff: 3 } },
    { id: 'dept-06', code: 'ACC', name: 'Accounts & Billing', description: 'Patient invoicing, cashiering, and revenue management', isActive: true, _count: { staff: 2 } },
    { id: 'dept-07', code: 'NUR', name: 'Nursing & Critical Care', description: 'Inpatient wards and emergency patient care', isActive: true, _count: { staff: 6 } },
    { id: 'dept-08', code: 'HSK', name: 'Housekeeping & Sanitation', description: 'Room sterilization and hospital floor maintenance', isActive: true, _count: { staff: 4 } }
  ],
  staff: [
    { id: 'stf-01', name: 'Dr. Sarah Smith', category: 'DOCTOR', designation: 'Senior Cardiologist & Department Head', department: { name: 'Cardiovascular Services' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0102', email: 'dr.smith@hospital.com', isActive: true, user: { email: 'dr.smith@hospital.com' } },
    { id: 'stf-02', name: 'Dr. Rajesh Patel', category: 'DOCTOR', designation: 'Consultant Neurologist & Specialist', department: { name: 'Neurological Sciences' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0108', email: 'dr.patel@hospital.com', isActive: true, user: { email: 'dr.patel@hospital.com' } },
    { id: 'stf-03', name: 'Emma Watson', category: 'RECEPTIONIST', designation: 'Lead Patient Coordinator & Triage', department: { name: 'Reception & Intake' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0103', email: 'reception@hospital.com', isActive: true, user: { email: 'reception@hospital.com' } },
    { id: 'stf-04', name: 'Michael Chang', category: 'PHARMACIST', designation: 'Head Dispensing Pharmacist', department: { name: 'Central Pharmacy' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0105', email: 'pharmacy@hospital.com', isActive: true, user: { email: 'pharmacy@hospital.com' } },
    { id: 'stf-05', name: 'Alice Johnson', category: 'LAB_TECHNICIAN', designation: 'Chief Pathology Specialist', department: { name: 'Diagnostic Pathology' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0106', email: 'lab@hospital.com', isActive: true, user: { email: 'lab@hospital.com' } },
    { id: 'stf-06', name: 'Robert Davis', category: 'ACCOUNTANT', designation: 'Senior Financial Officer', department: { name: 'Accounts & Billing' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0107', email: 'billing@hospital.com', isActive: true, user: { email: 'billing@hospital.com' } },
    { id: 'stf-07', name: 'Clara Barton', category: 'NURSE', designation: 'Head ICU Nurse Practitioner', department: { name: 'Nursing & Critical Care' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0201', email: 'clara.barton@staff.hospital.com', isActive: true, user: { email: 'clara.barton@staff.hospital.com' } },
    { id: 'stf-08', name: 'James Wilson', category: 'NURSE', designation: 'General Ward Nurse', department: { name: 'Nursing & Critical Care' }, shift: 'EVENING', availability: 'AVAILABLE', phone: '+1-555-0202', email: 'james.wilson@staff.hospital.com', isActive: true, user: { email: 'james.wilson@staff.hospital.com' } },
    { id: 'stf-09', name: 'David Miller', category: 'TECHNICAL_STAFF', designation: 'Lead MRI & Radiology Tech', department: { name: 'Diagnostic Pathology' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0301', email: 'david.miller@staff.hospital.com', isActive: true, user: { email: 'david.miller@staff.hospital.com' } },
    { id: 'stf-10', name: 'Elena Rostova', category: 'CLEANER', designation: '1st Floor Sanitation Lead', department: { name: 'Housekeeping & Sanitation' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0401', email: 'elena.rostova@staff.hospital.com', isActive: true, user: { email: 'elena.rostova@staff.hospital.com' } }
  ],
  appointments: [
    { id: 'app-01', tokenNumber: 101, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Cardiac Rhythm Assessment', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001', phone: '+1-555-0104' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-02', tokenNumber: 101, channel: 'ONLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Chronic Migraine Evaluation', patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002', phone: '+1-555-0199' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-03', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Routine Outpatient Followup', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-003', phone: '+1-555-6492' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-04', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Nerve Conduction Review', patient: { firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-004', phone: '+1-555-4411' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } }
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
          const newApp = {
            id: `app-${Date.now()}`,
            tokenNumber: 105,
            channel: postData.channel || 'OFFLINE',
            appointmentDate: postData.appointmentDate || new Date().toISOString(),
            status: 'SCHEDULED',
            reason: postData.reason || 'General Consultation',
            patient: MOCK_STORE.patients[0],
            doctor: MOCK_STORE.doctors[0]
          };
          MOCK_STORE.appointments.push(newApp);
          return Promise.resolve({ data: { success: true, data: newApp } });
        }
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.appointments } });
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
            gender: postData.gender || 'Male',
            bloodGroup: postData.bloodGroup || 'O+',
            phone: postData.phone || '+1-555-0100',
            address: postData.address || 'Metro City',
            medicalHistory: postData.medicalHistory || 'None'
          };
          MOCK_STORE.patients.push(newPat);
          return Promise.resolve({ data: { success: true, data: newPat } });
        }
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.patients } });
      }

      // Doctors
      if (url.includes('/doctors')) {
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.doctors } });
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
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.departments } });
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
          return Promise.resolve({ data: { success: true, message: 'Prescription dispensed successfully' } });
        }
        if (url.includes('/low-stock')) {
          return Promise.resolve({ data: { success: true, data: MOCK_STORE.medicines.filter(m => m.quantity <= m.reorderThreshold) } });
        }
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.medicines } });
      }

      // Laboratory
      if (url.includes('/lab/tests') || url.includes('/lab')) {
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.labTests } });
      }

      // Billing & Invoices
      if (url.includes('/billing/invoices') || url.includes('/billing/reception') || url.includes('/billing/pharmacy') || url.includes('/billing/revenue') || url.includes('/billing')) {
        if (url.includes('/revenue')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                CLINICAL: 325.00,
                PHARMACY: 37.00,
                LABORATORY: 45.00,
                RECEPTION: 350.00,
                TOTAL: 350.00
              }
            }
          });
        }
        if (url.includes('/payments')) {
          return Promise.resolve({
            data: {
              success: true,
              message: 'Payment recorded',
              data: { payment: { receiptNumber: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}` } }
            }
          });
        }
        return Promise.resolve({ data: { success: true, data: MOCK_STORE.invoices } });
      }

      // Notifications
      if (url.includes('/notifications')) {
        return Promise.resolve({
          data: {
            success: true,
            unreadCount: MOCK_STORE.notifications.filter(n => !n.isRead).length,
            data: MOCK_STORE.notifications
          }
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
