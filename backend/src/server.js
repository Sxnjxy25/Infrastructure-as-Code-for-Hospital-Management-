const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const labRoutes = require('./routes/labRoutes');
const billingRoutes = require('./routes/billingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));
app.use('/api', apiLimiter);

// Health Check Endpoint for ALB / Monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Hospital Management System REST API',
    uptime: process.uptime()
  });
});

// API Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Database Seed Endpoint (Protected: development or authenticated ADMIN)
app.get('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    return res.status(403).json({ success: false, message: 'Seed endpoint is disabled in production' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const prisma = require('./config/db');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Departments
    const departmentsData = [
      { code: 'ADM', name: 'Administration', description: 'Hospital Executive & HR' },
      { code: 'REC', name: 'Reception', description: 'Front desk and patient triage' },
      { code: 'DOC', name: 'Doctors', description: 'Clinical specialists' },
      { code: 'NUR', name: 'Nursing', description: 'Inpatient wards and critical care' },
      { code: 'PHM', name: 'Pharmacy', description: 'Prescription fulfillment' },
      { code: 'LAB', name: 'Laboratory', description: 'Diagnostic pathology' },
      { code: 'TEC', name: 'Technical Services', description: 'Biomedical engineering' },
      { code: 'HSK', name: 'Housekeeping', description: 'Room sterilization and sanitation' },
      { code: 'ACC', name: 'Accounts', description: 'Hospital accounting' },
      { code: 'BIL', name: 'Billing', description: 'Patient invoicing' }
    ];

    for (const d of departmentsData) {
      await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name, description: d.description },
        create: d
      });
    }

    // 2. Users
    const users = [
      { email: 'admin@hospital.com', name: 'System Administrator', role: 'ADMIN', phone: '+1-555-0101' },
      { email: 'dr.smith@hospital.com', name: 'Dr. Sarah Smith', role: 'DOCTOR', phone: '+1-555-0102' },
      { email: 'dr.patel@hospital.com', name: 'Dr. Rajesh Patel', role: 'DOCTOR', phone: '+1-555-0108' },
      { email: 'reception@hospital.com', name: 'Emma Watson', role: 'RECEPTIONIST', phone: '+1-555-0103' },
      { email: 'john.doe@patient.com', name: 'John Doe', role: 'PATIENT', phone: '+1-555-0104' },
      { email: 'pharmacy@hospital.com', name: 'Michael Chang', role: 'PHARMACIST', phone: '+1-555-0105' },
      { email: 'lab@hospital.com', name: 'Alice Johnson', role: 'LAB_TECHNICIAN', phone: '+1-555-0106' },
      { email: 'billing@hospital.com', name: 'Robert Davis', role: 'ACCOUNTANT', phone: '+1-555-0107' }
    ];

    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { password: hashedPassword, name: u.name, role: u.role, phone: u.phone },
        create: { email: u.email, password: hashedPassword, name: u.name, role: u.role, phone: u.phone }
      });
    }

    // 3. Doctors
    const docSmith = await prisma.user.findUnique({ where: { email: 'dr.smith@hospital.com' } });
    if (docSmith) {
      await prisma.doctor.upsert({
        where: { userId: docSmith.id },
        update: {},
        create: { userId: docSmith.id, specialization: 'Cardiology', department: 'Cardiovascular Services', qualification: 'MD, FACC', consultationFee: 150.00, availability: 'AVAILABLE', roomNumber: 'Suite 302' }
      });
    }

    const docPatel = await prisma.user.findUnique({ where: { email: 'dr.patel@hospital.com' } });
    if (docPatel) {
      await prisma.doctor.upsert({
        where: { userId: docPatel.id },
        update: {},
        create: { userId: docPatel.id, specialization: 'Neurology', department: 'Neurology & Brain Sciences', qualification: 'MBBS, MD Neurology', consultationFee: 175.00, availability: 'AVAILABLE', roomNumber: 'Suite 410' }
      });
    }

    res.json({ success: true, message: 'Database seeded successfully! You can log in with admin@hospital.com / password123' });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});

// Global Error Handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Hospital Management System API Server Running `);
    console.log(` Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
