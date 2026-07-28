const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Hospital System Database Seeding ---');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create System Users for All 7 Roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      phone: '+1-555-0101'
    }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr.smith@hospital.com' },
    update: {},
    create: {
      email: 'dr.smith@hospital.com',
      password: hashedPassword,
      name: 'Dr. Sarah Smith',
      role: 'DOCTOR',
      phone: '+1-555-0102'
    }
  });

  const recepUser = await prisma.user.upsert({
    where: { email: 'reception@hospital.com' },
    update: {},
    create: {
      email: 'reception@hospital.com',
      password: hashedPassword,
      name: 'Emma Watson',
      role: 'RECEPTIONIST',
      phone: '+1-555-0103'
    }
  });

  const patientUser = await prisma.user.upsert({
    where: { email: 'john.doe@patient.com' },
    update: {},
    create: {
      email: 'john.doe@patient.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'PATIENT',
      phone: '+1-555-0104'
    }
  });

  const pharmUser = await prisma.user.upsert({
    where: { email: 'pharmacy@hospital.com' },
    update: {},
    create: {
      email: 'pharmacy@hospital.com',
      password: hashedPassword,
      name: 'Michael Chang',
      role: 'PHARMACIST',
      phone: '+1-555-0105'
    }
  });

  const labUser = await prisma.user.upsert({
    where: { email: 'lab@hospital.com' },
    update: {},
    create: {
      email: 'lab@hospital.com',
      password: hashedPassword,
      name: 'Alice Johnson',
      role: 'LAB_TECHNICIAN',
      phone: '+1-555-0106'
    }
  });

  const acctUser = await prisma.user.upsert({
    where: { email: 'billing@hospital.com' },
    update: {},
    create: {
      email: 'billing@hospital.com',
      password: hashedPassword,
      name: 'Robert Davis',
      role: 'ACCOUNTANT',
      phone: '+1-555-0107'
    }
  });

  // 2. Create Doctor Entity
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: 'Cardiology',
      department: 'Cardiovascular Services',
      qualification: 'MD, FACC',
      consultationFee: 150.00,
      availability: 'Mon-Fri 09:00 - 16:00',
      roomNumber: 'Suite 302'
    }
  });

  // 3. Create Patient Entity
  const patient = await prisma.patient.upsert({
    where: { mrn: 'MRN-2026-001' },
    update: {},
    create: {
      userId: patientUser.id,
      mrn: 'MRN-2026-001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1988-05-14'),
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+1-555-0104',
      address: '123 Health Ave, Metro City',
      emergencyContact: 'Jane Doe (+1-555-0999)',
      medicalHistory: 'Hypertension, Seasonal Allergies'
    }
  });

  // 4. Create Sample Appointment
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      tokenNumber: 101,
      appointmentDate: new Date(),
      reason: 'Routine Cardiology Consultation',
      status: 'SCHEDULED'
    }
  });

  // 5. Create Sample Pharmacy Medicines
  await prisma.medicine.upsert({
    where: { code: 'MED-AMLO-5' },
    update: {},
    create: {
      code: 'MED-AMLO-5',
      name: 'Amlodipine 5mg',
      category: 'Cardiovascular',
      quantity: 250,
      unitPrice: 12.50,
      expiryDate: new Date('2027-12-31'),
      supplier: 'PharmaSupply Corp'
    }
  });

  await prisma.medicine.upsert({
    where: { code: 'MED-AMOX-500' },
    update: {},
    create: {
      code: 'MED-AMOX-500',
      name: 'Amoxicillin 500mg',
      category: 'Antibiotic',
      quantity: 15, // Trigger low stock warning
      unitPrice: 18.00,
      expiryDate: new Date('2026-11-30'),
      supplier: 'MediTech Supplies'
    }
  });

  // 6. Create Sample Lab Test
  await prisma.labTest.create({
    data: {
      patientId: patient.id,
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      status: 'COMPLETED',
      resultSummary: 'WBC: 6.5, RBC: 4.8, Hemoglobin: 14.2 g/dL. All parameters within normal ranges.',
      requestedBy: 'Dr. Sarah Smith'
    }
  });

  // 7. Create Sample Invoice
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      patientId: patient.id,
      invoiceNumber: 'INV-2026-0001',
      amount: 150.00,
      discount: 10.00,
      netAmount: 140.00,
      status: 'PAID',
      paymentMethod: 'Credit Card',
      description: 'Outpatient Consultation & Laboratory Test'
    }
  });

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
