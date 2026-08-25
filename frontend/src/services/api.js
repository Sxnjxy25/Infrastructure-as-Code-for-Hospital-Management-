import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

// Mock Data Cache for standalone Vercel preview
const MOCK_DATA = {
  doctors: [
    { id: 'doc-01', specialization: 'Cardiology', department: 'Cardiovascular Services', consultationFee: 150.0, availability: 'Mon-Fri 09:00 - 16:00', roomNumber: 'Suite 302', user: { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', phone: '+1-555-0102' } },
    { id: 'doc-02', specialization: 'Neurology', department: 'Neurological Sciences', consultationFee: 175.0, availability: 'Mon-Sat 10:00 - 17:00', roomNumber: 'Suite 410', user: { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@hospital.com', phone: '+1-555-0108' } }
  ],
  patients: [
    { id: 'pat-01', mrn: 'MRN-2026-001', firstName: 'John', lastName: 'Doe', phone: '+1-555-0199', gender: 'Male', bloodGroup: 'O+' },
    { id: 'pat-02', mrn: 'MRN-2026-002', firstName: 'Eleanor', lastName: 'Vance', phone: '+1-555-0200', gender: 'Female', bloodGroup: 'A+' },
    { id: 'pat-03', mrn: 'MRN-2026-6222', firstName: 'Alex', lastName: 'Morgan', phone: '+1-555-6492', gender: 'Female', bloodGroup: 'B+' },
    { id: 'pat-04', mrn: 'MRN-2026-8981', firstName: 'Lisa', lastName: 'Ray', phone: '+1-555-4411', gender: 'Female', bloodGroup: 'AB+' }
  ],
  appointments: [
    { id: 'app-01', tokenNumber: 101, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Cardiac Rhythm Assessment', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001', phone: '+1-555-0199' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-02', tokenNumber: 101, channel: 'ONLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Chronic Migraine Evaluation', patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002', phone: '+1-555-0200' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-03', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Routine Outpatient Followup', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6222', phone: '+1-555-6492' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-04', tokenNumber: 102, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Nerve Conduction Review', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6492', phone: '+1-555-6492' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-05', tokenNumber: 103, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Echo Stress Follow-up', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6492', phone: '+1-555-6492' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-06', tokenNumber: 103, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Neuropathy Assessment', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6492', phone: '+1-555-6492' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } },
    { id: 'app-07', tokenNumber: 104, channel: 'OFFLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Hypertension Consultation', patient: { firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-8981', phone: '+1-555-4411' }, doctor: { specialization: 'Cardiology', roomNumber: 'Suite 302', user: { name: 'Dr. Sarah Smith' } } },
    { id: 'app-08', tokenNumber: 104, channel: 'ONLINE', appointmentDate: new Date().toISOString(), status: 'SCHEDULED', reason: 'Sleep Disorder Consult', patient: { firstName: 'Lisa', lastName: 'Ray', mrn: 'MRN-2026-8981', phone: '+1-555-4411' }, doctor: { specialization: 'Neurology', roomNumber: 'Suite 410', user: { name: 'Dr. Rajesh Patel' } } }
  ]
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLoginPage = window.location.pathname === '/login';

    if (error.response && error.response.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Graceful fallback for standalone Vercel preview (404/Network errors when backend is not deployed)
    if (error.response?.status === 404 || !error.response) {
      const url = error.config?.url || '';

      if (url.includes('/dashboard/stats')) {
        return Promise.resolve({
          data: {
            success: true,
            stats: {
              totalPatients: 42,
              totalDoctors: 2,
              activeDoctors: 2,
              scheduledAppointments: 8,
              todayRevenue: '1,450.00',
              totalRevenue: '18,720.00',
              staffBreakdown: {
                doctors: { total: 2, available: 2 },
                nurses: { total: 8, available: 7 },
                technicalStaff: { total: 4, available: 4 },
                cleaners: { total: 6, available: 6 }
              },
              departmentRevenue: {
                reception: '1,300.00',
                pharmacy: '620.00',
                laboratory: '450.00',
                total: '2,370.00'
              }
            },
            recentAppointments: MOCK_DATA.appointments
          }
        });
      }

      if (url.includes('/appointments')) {
        return Promise.resolve({ data: { success: true, data: MOCK_DATA.appointments } });
      }

      if (url.includes('/patients')) {
        return Promise.resolve({ data: { success: true, data: MOCK_DATA.patients } });
      }

      if (url.includes('/doctors')) {
        return Promise.resolve({ data: { success: true, data: MOCK_DATA.doctors } });
      }

      if (url.includes('/departments')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'dept-01', name: 'Cardiovascular Services', code: 'CARDIO', headDoctor: 'Dr. Sarah Smith', description: 'Advanced cardiology and cardiac monitoring suite' },
              { id: 'dept-02', name: 'Neurological Sciences', code: 'NEURO', headDoctor: 'Dr. Rajesh Patel', description: 'Comprehensive neurological diagnostic and clinical care' },
              { id: 'dept-03', name: 'Diagnostic Pathology', code: 'LAB', headDoctor: 'Dr. Nathan Drake', description: 'Automated clinical chemistry and specimen testing' },
              { id: 'dept-04', name: 'Central Pharmacy', code: 'PHARMA', headDoctor: 'Marcus Vance', description: 'Automated prescription fulfillment and stock management' }
            ]
          }
        });
      }

      if (url.includes('/staff')) {
        let staffList = [
          { id: 'stf-01', name: 'Dr. Sarah Smith', category: 'DOCTOR', role: 'DOCTOR', designation: 'Senior Cardiologist & Department Head', department: { name: 'Cardiovascular Services' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0102', user: { email: 'dr.smith@hospital.com' } },
          { id: 'stf-02', name: 'Dr. Rajesh Patel', category: 'DOCTOR', role: 'DOCTOR', designation: 'Consultant Neurologist & Specialist', department: { name: 'Neurological Sciences' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0108', user: { email: 'dr.patel@hospital.com' } },
          { id: 'stf-03', name: 'Emma Watson', category: 'RECEPTIONIST', role: 'RECEPTIONIST', designation: 'Lead Patient Coordinator & Triage', department: { name: 'Front Desk & Reception' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0103', user: { email: 'reception@hospital.com' } },
          { id: 'stf-04', name: 'Marcus Vance', category: 'PHARMACIST', role: 'PHARMACIST', designation: 'Head Dispensing Pharmacist', department: { name: 'Central Pharmacy' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0104', user: { email: 'pharmacy@hospital.com' } },
          { id: 'stf-05', name: 'Dr. Nathan Drake', category: 'LAB_TECHNICIAN', role: 'LAB_TECHNICIAN', designation: 'Chief Pathology Specialist', department: { name: 'Diagnostic Pathology' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0105', user: { email: 'lab@hospital.com' } },
          { id: 'stf-06', name: 'Sophia Loren', category: 'ACCOUNTANT', role: 'ACCOUNTANT', designation: 'Senior Financial Officer', department: { name: 'Accounts & Billing' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0106', user: { email: 'billing@hospital.com' } },
          { id: 'stf-07', name: 'Clara Barton', category: 'NURSE', role: 'NURSE', designation: 'Head ICU Nurse Practitioner', department: { name: 'Nursing & Critical Care' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0201', user: { email: 'clara.barton@staff.hospital.com' } },
          { id: 'stf-08', name: 'James Wilson', category: 'NURSE', role: 'NURSE', designation: 'General Ward Nurse', department: { name: 'Nursing & Critical Care' }, shift: 'EVENING', availability: 'AVAILABLE', phone: '+1-555-0202', user: { email: 'james.wilson@staff.hospital.com' } },
          { id: 'stf-09', name: 'David Miller', category: 'TECHNICAL_STAFF', role: 'TECHNICAL_STAFF', designation: 'Lead MRI & Radiology Tech', department: { name: 'Technical Services' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0301', user: { email: 'david.miller@staff.hospital.com' } },
          { id: 'stf-10', name: 'Elena Rostova', category: 'CLEANER', role: 'CLEANER', designation: '1st Floor Sanitation Lead', department: { name: 'Housekeeping & Sterilization' }, shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0401', user: { email: 'elena.rostova@staff.hospital.com' } }
        ];

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
            s.name.toLowerCase().includes(query) ||
            s.designation.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query) ||
            s.user?.email.toLowerCase().includes(query)
          );
        }

        return Promise.resolve({
          data: {
            success: true,
            data: staffList
          }
        });
      }

      if (url.includes('/pharmacy/medicines') || url.includes('/pharmacy')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'med-01', name: 'Amoxicillin 500mg', code: 'MED-AMOX-500', category: 'Antibiotics', quantity: 150, unitPrice: 12.50, reorderThreshold: 30 },
              { id: 'med-02', name: 'Atorvastatin 20mg', code: 'MED-ATOR-20', category: 'Cardiovascular', quantity: 95, unitPrice: 18.00, reorderThreshold: 25 },
              { id: 'med-03', name: 'Paracetamol 650mg', code: 'MED-PARA-650', category: 'Analgesics', quantity: 240, unitPrice: 4.50, reorderThreshold: 50 },
              { id: 'med-04', name: 'Metformin 500mg', code: 'MED-METF-500', category: 'Antidiabetic', quantity: 110, unitPrice: 8.00, reorderThreshold: 20 }
            ]
          }
        });
      }

      if (url.includes('/lab/tests') || url.includes('/lab')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'lab-01', testName: 'Complete Blood Count (CBC)', testCode: 'TEST-CBC-01', category: 'Hematology', status: 'COMPLETED', result: 'Normal parameters verified', patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' } },
              { id: 'lab-02', testName: 'Lipid Profile Panel', testCode: 'TEST-LIP-02', category: 'Biochemistry', status: 'PROCESSING', result: 'Specimen in centrifuge analyzer', patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' } },
              { id: 'lab-03', testName: 'Fasting Blood Glucose', testCode: 'TEST-GLU-03', category: 'Biochemistry', status: 'PENDING', result: 'Awaiting laboratory sample collection', patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6222' } }
            ]
          }
        });
      }

      if (url.includes('/billing/invoices') || url.includes('/billing')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'inv-01', invoiceNumber: 'INV-2026-1001', totalAmount: 150.00, paidAmount: 150.00, status: 'PAID', billingType: 'CONSULTATION', createdAt: new Date().toISOString(), patient: { firstName: 'John', lastName: 'Doe', mrn: 'MRN-2026-001' } },
              { id: 'inv-02', invoiceNumber: 'INV-2026-1002', totalAmount: 175.00, paidAmount: 175.00, status: 'PAID', billingType: 'CONSULTATION', createdAt: new Date().toISOString(), patient: { firstName: 'Eleanor', lastName: 'Vance', mrn: 'MRN-2026-002' } },
              { id: 'inv-03', invoiceNumber: 'INV-2026-1003', totalAmount: 85.00, paidAmount: 0.00, status: 'PENDING', billingType: 'PHARMACY', createdAt: new Date().toISOString(), patient: { firstName: 'Alex', lastName: 'Morgan', mrn: 'MRN-2026-6222' } }
            ]
          }
        });
      }

      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
