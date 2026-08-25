const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Enterprise Hospital Management System Seeding ---');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Standard Hospital Departments
  const departmentsData = [
    { code: 'ADM', name: 'Administration', description: 'Executive, hospital administration, and human resources' },
    { code: 'REC', name: 'Reception', description: 'Front desk, patient intake, scheduling, and admissions' },
    { code: 'DOC', name: 'Doctors', description: 'Medical specialists, outpatient consultations, and inpatient care' },
    { code: 'NUR', name: 'Nursing', description: 'Inpatient wards, emergency care, vitals, and assistance' },
    { code: 'PHM', name: 'Pharmacy', description: 'Dispensing, prescription fulfillment, and drug inventory' },
    { code: 'LAB', name: 'Laboratory', description: 'Diagnostic pathology, hematology, imaging, and bio-testing' },
    { code: 'TEC', name: 'Technical Services', description: 'Radiology operations, biomedical engineering, and IT systems' },
    { code: 'HSK', name: 'Housekeeping / Cleaners', description: 'Sanitation, room sterilization, and floor maintenance' },
    { code: 'ACC', name: 'Accounts', description: 'Hospital accounting, auditing, and financial records' },
    { code: 'BIL', name: 'Billing', description: 'Patient invoicing, cashiering, and insurance claims' },
  ];

  const deptMap = {};
  for (const dept of departmentsData) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept
    });
    deptMap[dept.code] = d;
  }
  console.log(`✓ Seeded ${departmentsData.length} Departments`);

  // 2. Create System Users for All 7 Portal Roles
  const usersData = [
    { email: 'admin@hospital.com', name: 'System Administrator', role: 'ADMIN', phone: '+1-555-0101', dept: 'ADM', desig: 'Hospital Chief Administrator', shift: 'MORNING' },
    { email: 'dr.smith@hospital.com', name: 'Dr. Sarah Smith', role: 'DOCTOR', phone: '+1-555-0102', dept: 'DOC', desig: 'Senior Cardiologist', shift: 'MORNING' },
    { email: 'dr.patel@hospital.com', name: 'Dr. Rajesh Patel', role: 'DOCTOR', phone: '+1-555-0108', dept: 'DOC', desig: 'Consultant Neurologist', shift: 'EVENING' },
    { email: 'reception@hospital.com', name: 'Emma Watson', role: 'RECEPTIONIST', phone: '+1-555-0103', dept: 'REC', desig: 'Lead Patient Coordinator', shift: 'MORNING' },
    { email: 'john.doe@patient.com', name: 'John Doe', role: 'PATIENT', phone: '+1-555-0104', dept: null, desig: null, shift: null },
    { email: 'pharmacy@hospital.com', name: 'Michael Chang', role: 'PHARMACIST', phone: '+1-555-0105', dept: 'PHM', desig: 'Head Dispensing Pharmacist', shift: 'MORNING' },
    { email: 'lab@hospital.com', name: 'Alice Johnson', role: 'LAB_TECHNICIAN', phone: '+1-555-0106', dept: 'LAB', desig: 'Chief Pathology Specialist', shift: 'ROTATIONAL' },
    { email: 'billing@hospital.com', name: 'Robert Davis', role: 'ACCOUNTANT', phone: '+1-555-0107', dept: 'ACC', desig: 'Senior Financial Officer', shift: 'MORNING' }
  ];

  const userMap = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, name: u.name, role: u.role, phone: u.phone },
      create: { email: u.email, password: hashedPassword, name: u.name, role: u.role, phone: u.phone }
    });
    userMap[u.email] = user;

    // If portal user has staff profile info, upsert StaffProfile
    if (u.dept) {
      await prisma.staffProfile.upsert({
        where: { userId: user.id },
        update: {
          name: u.name,
          category: u.role,
          designation: u.desig,
          departmentId: deptMap[u.dept].id,
          shift: u.shift,
          availability: 'AVAILABLE',
          phone: u.phone,
          email: u.email
        },
        create: {
          userId: user.id,
          name: u.name,
          category: u.role,
          designation: u.desig,
          departmentId: deptMap[u.dept].id,
          shift: u.shift,
          availability: 'AVAILABLE',
          phone: u.phone,
          email: u.email
        }
      });
    }
  }
  console.log(`✓ Seeded ${usersData.length} Users & Portal Staff Profiles`);

  // 3. Create Doctors
  const doctorSmith = await prisma.doctor.upsert({
    where: { userId: userMap['dr.smith@hospital.com'].id },
    update: {},
    create: {
      userId: userMap['dr.smith@hospital.com'].id,
      specialization: 'Cardiology',
      department: 'Cardiovascular Services',
      qualification: 'MD, FACC, Board Certified',
      consultationFee: 150.00,
      availability: 'AVAILABLE',
      roomNumber: 'Suite 302'
    }
  });

  const doctorPatel = await prisma.doctor.upsert({
    where: { userId: userMap['dr.patel@hospital.com'].id },
    update: {},
    create: {
      userId: userMap['dr.patel@hospital.com'].id,
      specialization: 'Neurology',
      department: 'Neurology & Brain Sciences',
      qualification: 'MBBS, MD Neurology',
      consultationFee: 175.00,
      availability: 'AVAILABLE',
      roomNumber: 'Suite 410'
    }
  });

  // 4. Create Record-Only Staff (Nurses, Technical Staff, Cleaners - no login required)
  const recordOnlyStaff = [
    { name: 'Clara Barton', category: 'NURSE', designation: 'Head ICU Nurse', dept: 'NUR', shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0201', email: 'clara.barton@staff.hospital.com' },
    { name: 'James Wilson', category: 'NURSE', designation: 'General Ward Nurse', dept: 'NUR', shift: 'EVENING', availability: 'ON_DUTY', phone: '+1-555-0202', email: 'james.wilson@staff.hospital.com' },
    { name: 'David Miller', category: 'TECHNICAL_STAFF', designation: 'Lead MRI & Radiology Tech', dept: 'TEC', shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0301', email: 'david.miller@staff.hospital.com' },
    { name: 'Kevin Vance', category: 'TECHNICAL_STAFF', designation: 'Biomedical Systems Engineer', dept: 'TEC', shift: 'ROTATIONAL', availability: 'AVAILABLE', phone: '+1-555-0302', email: 'kevin.vance@staff.hospital.com' },
    { name: 'Elena Rostova', category: 'CLEANER', designation: '1st Floor Sanitation Lead', dept: 'HSK', shift: 'MORNING', availability: 'AVAILABLE', phone: '+1-555-0401', email: null },
    { name: 'Carlos Ortiz', category: 'CLEANER', designation: '2nd Floor Room & Ward Sterilization', dept: 'HSK', shift: 'EVENING', availability: 'AVAILABLE', phone: '+1-555-0402', email: null },
    { name: 'Amina Yusuf', category: 'CLEANER', designation: 'Surgical Theatre Sanitation Specialist', dept: 'HSK', shift: 'NIGHT', availability: 'OFF_DUTY', phone: '+1-555-0403', email: null }
  ];

  for (const s of recordOnlyStaff) {
    const existing = await prisma.staffProfile.findFirst({ where: { name: s.name, category: s.category } });
    if (!existing) {
      const sp = await prisma.staffProfile.create({
        data: {
          name: s.name,
          category: s.category,
          designation: s.designation,
          departmentId: deptMap[s.dept].id,
          shift: s.shift,
          availability: s.availability,
          phone: s.phone,
          email: s.email,
          isActive: true
        }
      });

      // Add demo documents for staff
      await prisma.staffDocument.create({
        data: {
          staffProfileId: sp.id,
          documentType: 'CERTIFICATE',
          title: `${s.designation} Board Certification`,
          fileUrl: `staff/${s.category.toLowerCase()}/${sp.id}/certification_${Date.now()}.pdf`,
          fileName: `certification_${s.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSize: 1024 * 450,
          mimeType: 'application/pdf'
        }
      });
    }
  }
  console.log(`✓ Seeded ${recordOnlyStaff.length} Record-Only Staff (Nurses, Techs, Cleaners) with Documents`);

  // 5. Create Sample Patient
  const patient = await prisma.patient.upsert({
    where: { mrn: 'MRN-2026-001' },
    update: {},
    create: {
      userId: userMap['john.doe@patient.com'].id,
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

  // Patient 2
  const patient2 = await prisma.patient.upsert({
    where: { mrn: 'MRN-2026-002' },
    update: {},
    create: {
      mrn: 'MRN-2026-002',
      firstName: 'Eleanor',
      lastName: 'Vance',
      dateOfBirth: new Date('1994-09-22'),
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '+1-555-0199',
      address: '456 Elm Street, Metro City',
      emergencyContact: 'Mark Vance (+1-555-0888)',
      medicalHistory: 'Migraine with aura'
    }
  });
  console.log('✓ Seeded Patients');

  // 6. Create Sample Appointments
  const app1 = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctorSmith.id,
      createdById: userMap['reception@hospital.com'].id,
      tokenNumber: 101,
      appointmentDate: new Date(),
      channel: 'OFFLINE',
      reason: 'Routine Cardiology Consultation & Blood Pressure Check',
      status: 'SCHEDULED'
    }
  });

  const app2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorPatel.id,
      createdById: userMap['reception@hospital.com'].id,
      tokenNumber: 102,
      appointmentDate: new Date(Date.now() + 3600000),
      channel: 'ONLINE',
      reason: 'Persistent Migraines & Dizziness Consultation',
      status: 'SCHEDULED'
    }
  });

  // 7. Create Pharmacy Medicines with Reorder Thresholds
  const medicines = [
    { code: 'MED-AMLO-5', name: 'Amlodipine 5mg', category: 'Cardiovascular', quantity: 250, unitPrice: 12.50, reorderThreshold: 50, expiryDate: new Date('2027-12-31'), supplier: 'PharmaSupply Corp' },
    { code: 'MED-AMOX-500', name: 'Amoxicillin 500mg', category: 'Antibiotic', quantity: 12, unitPrice: 18.00, reorderThreshold: 25, expiryDate: new Date('2026-11-30'), supplier: 'MediTech Supplies' },
    { code: 'MED-PARA-650', name: 'Paracetamol 650mg', category: 'Analgesic', quantity: 0, unitPrice: 5.00, reorderThreshold: 40, expiryDate: new Date('2027-06-30'), supplier: 'CarePharm Ltd' },
    { code: 'MED-ATOR-10', name: 'Atorvastatin 10mg', category: 'Cardiovascular', quantity: 180, unitPrice: 22.00, reorderThreshold: 30, expiryDate: new Date('2028-01-15'), supplier: 'PharmaSupply Corp' },
    { code: 'MED-METF-500', name: 'Metformin 500mg', category: 'Endocrine', quantity: 300, unitPrice: 8.50, reorderThreshold: 50, expiryDate: new Date('2027-08-20'), supplier: 'CarePharm Ltd' },
    { code: 'MED-OMEP-20', name: 'Omeprazole 20mg', category: 'Gastrointestinal', quantity: 15, unitPrice: 14.00, reorderThreshold: 20, expiryDate: new Date('2026-10-31'), supplier: 'MediTech Supplies' }
  ];

  for (const m of medicines) {
    await prisma.medicine.upsert({
      where: { code: m.code },
      update: { quantity: m.quantity, unitPrice: m.unitPrice, reorderThreshold: m.reorderThreshold },
      create: m
    });
  }
  console.log(`✓ Seeded ${medicines.length} Medicines with Reorder Thresholds`);

  // 8. Create Sample Lab Tests
  await prisma.labTest.create({
    data: {
      patientId: patient.id,
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      cost: 45.00,
      status: 'COMPLETED',
      resultSummary: 'WBC: 6.5, RBC: 4.8, Hemoglobin: 14.2 g/dL. Normal range.',
      requestedBy: 'Dr. Sarah Smith'
    }
  });

  await prisma.labTest.create({
    data: {
      patientId: patient2.id,
      testName: 'Brain MRI Screening',
      category: 'Radiology',
      cost: 250.00,
      status: 'PENDING',
      requestedBy: 'Dr. Rajesh Patel'
    }
  });

  // 9. Create Invoices with Line Items & Payments
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      patientId: patient.id,
      invoiceNumber: 'INV-2026-0001',
      billingType: 'RECEPTION',
      amount: 150.00,
      discount: 10.00,
      netAmount: 140.00,
      paidAmount: 140.00,
      status: 'PAID',
      paymentMethod: 'CARD',
      description: 'Outpatient Consultation'
    }
  });

  await prisma.invoiceItem.upsert({
    where: { source_item_unique: { sourceEntity: 'APPOINTMENT', sourceId: 'SEED_APP_001' } },
    update: {},
    create: {
      invoiceId: invoice1.id,
      sourceDepartment: 'CLINICAL',
      billingType: 'CONSULTATION',
      itemDescription: 'Cardiology Specialist Consultation - Dr. Sarah Smith',
      quantity: 1,
      unitPrice: 150.00,
      totalPrice: 150.00,
      sourceEntity: 'APPOINTMENT',
      sourceId: 'SEED_APP_001'
    }
  });

  await prisma.payment.upsert({
    where: { receiptNumber: 'REC-2026-0001' },
    update: {},
    create: {
      invoiceId: invoice1.id,
      receiptNumber: 'REC-2026-0001',
      amount: 140.00,
      paymentMethod: 'CARD',
      status: 'COMPLETED',
      receivedById: userMap['billing@hospital.com'].id,
      notes: 'Card payment processed at reception cashier'
    }
  });

  // 10. Create Initial Role-Based Notifications
  const sampleNotifications = [
    { role: 'PHARMACIST', title: 'Low Medicine Stock Alert', message: 'Amoxicillin 500mg (MED-AMOX-500) stock is down to 12 units (reorder threshold: 25).', type: 'LOW_STOCK' },
    { role: 'PHARMACIST', title: 'Out of Stock Critical Alert', message: 'Paracetamol 650mg (MED-PARA-650) is out of stock (0 units remaining).', type: 'OUT_OF_STOCK' },
    { role: 'ADMIN', title: 'Pharmacy Inventory Warning', message: '2 medicines have breached minimum safety stock levels.', type: 'LOW_STOCK' },
    { role: 'LAB_TECHNICIAN', title: 'New Diagnostic Request', message: 'Brain MRI Screening ordered for patient Eleanor Vance (MRN-2026-002).', type: 'LAB_REQUEST' },
    { role: 'DOCTOR', title: 'New Appointment Booked', message: 'Patient John Doe booked for Routine Cardiology Consultation.', type: 'APPOINTMENT' }
  ];

  for (const n of sampleNotifications) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✓ Seeded ${sampleNotifications.length} Role-Based Notifications`);

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
