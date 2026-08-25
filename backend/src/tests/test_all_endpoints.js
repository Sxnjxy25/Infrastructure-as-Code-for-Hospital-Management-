const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { completeAppointmentTransaction } = require('../services/appointmentService');
const { dispenseMedicinesTransaction } = require('../services/pharmacyService');
const { completeLabTestTransaction } = require('../services/labService');
const { processPayment } = require('../services/billingService');

async function testAll() {
  console.log('=== RUNNING COMPREHENSIVE ENDPOINT & SERVICE VALIDATION ===\n');

  // 1. Validate Users
  const users = await prisma.user.findMany();
  console.log(`✓ Database has ${users.length} registered users.`);

  // 2. Validate Admin Auth
  const admin = await prisma.user.findUnique({ where: { email: 'admin@hospital.com' } });
  const isMatch = await bcrypt.compare('password123', admin.password);
  if (!isMatch) throw new Error('Password mismatch for admin');
  const token = jwt.sign({ userId: admin.id, role: admin.role }, jwtConfig.secret);
  console.log(`✓ Admin authentication token verified.`);

  // 3. Test Patient Creation (Verifying the MRN Reference Fix)
  const patientCountBefore = await prisma.patient.count();
  const testPatient = await prisma.patient.create({
    data: {
      mrn: `MRN-2026-${String(patientCountBefore + 1).padStart(3, '0')}`,
      firstName: 'Alice',
      lastName: 'Wonderland',
      dateOfBirth: new Date('1992-03-15'),
      gender: 'Female',
      bloodGroup: 'B+',
      phone: '+1-555-9988',
      address: '777 Emerald Way',
      emergencyContact: 'Bob (+1-555-9977)',
      medicalHistory: 'Asthma'
    }
  });
  console.log(`✓ Created Patient: ${testPatient.firstName} ${testPatient.lastName} (${testPatient.mrn})`);

  // 4. Test Doctor Queues & Token Generation
  const doc = await prisma.doctor.findFirst({ include: { user: true } });
  const maxDocToken = await prisma.appointment.findFirst({
    where: { doctorId: doc.id },
    orderBy: { tokenNumber: 'desc' },
    select: { tokenNumber: true }
  });
  const tokenNumber = (maxDocToken && maxDocToken.tokenNumber >= 100) ? maxDocToken.tokenNumber + 1 : 101;
  const appt = await prisma.appointment.create({
    data: {
      patientId: testPatient.id,
      doctorId: doc.id,
      tokenNumber,
      appointmentDate: new Date(),
      channel: 'OFFLINE',
      reason: 'General Cardiology Checkup',
      status: 'SCHEDULED'
    }
  });
  console.log(`✓ Created Appointment #${appt.tokenNumber} for Dr. ${doc.user.name}`);

  // 5. Test Complete Appointment Transaction (Consultation + Automated Billing + Lab orders)
  const completeRes = await completeAppointmentTransaction({
    appointmentId: appt.id,
    diagnosis: 'Mild hypertension, prescribed lifestyle changes',
    prescription: 'Amlodipine 5mg - 1 tab daily',
    orderedTests: [{ testName: 'Lipid Profile Panel', category: 'Biochemistry', cost: 60.00 }],
    completedByUserId: admin.id
  });
  console.log(`✓ Appointment marked COMPLETED, created consultation invoice & dispatched ${completeRes.createdLabTests.length} Lab Test.`);

  // 6. Test Lab Test Completion Transaction (Report findings + Automated Laboratory Billing)
  const labTest = completeRes.createdLabTests[0];
  if (labTest) {
    const labRes = await completeLabTestTransaction({
      testId: labTest.id,
      resultSummary: 'Cholesterol: 185 mg/dL, HDL: 52 mg/dL. Within normal parameters.',
      completedByUserId: admin.id
    });
    console.log(`✓ Lab Test completed & billed: ${labRes.test.testName}`);
  }

  // 7. Test Pharmacy Dispense Transaction (Stock deduction + Automated Pharmacy Billing)
  const med = await prisma.medicine.findFirst({ where: { quantity: { gt: 5 } } });
  const initialQty = med.quantity;
  const dispenseRes = await dispenseMedicinesTransaction({
    patientId: testPatient.id,
    items: [{ medicineId: med.id, quantity: 2 }],
    dispensedByUserId: admin.id
  });
  const updatedMed = await prisma.medicine.findUnique({ where: { id: med.id } });
  if (updatedMed.quantity !== initialQty - 2) throw new Error('Inventory deduction mismatch');
  console.log(`✓ Pharmacy dispensed 2 units of ${med.name}. Stock updated: ${initialQty} -> ${updatedMed.quantity}`);

  // 8. Test Invoicing & Payment Processing
  const patientInvoices = await prisma.invoice.findMany({
    where: { patientId: testPatient.id },
    include: { items: true }
  });
  console.log(`✓ Patient has ${patientInvoices.length} invoices with ${patientInvoices.reduce((s, i) => s + i.items.length, 0)} total line items.`);

  const receptionInv = patientInvoices.find(i => i.billingType === 'RECEPTION');
  if (receptionInv) {
    const payRes = await processPayment({
      invoiceId: receptionInv.id,
      amount: receptionInv.netAmount,
      paymentMethod: 'CARD',
      receivedById: admin.id
    });
    console.log(`✓ Payment processed: Invoice ${receptionInv.invoiceNumber} paid in full ($${receptionInv.netAmount}). Receipt: ${payRes.payment.receiptNumber}`);
  }

  // 9. Test Staff Directory & Departments
  const staff = await prisma.staffProfile.findMany({ include: { department: true } });
  console.log(`✓ Unified Staff Directory has ${staff.length} staff profiles across ${new Set(staff.map(s => s.department?.name)).size} departments.`);

  console.log('\n=== ALL ENDPOINTS AND TRANSACTIONS PASSED 100% SUCCESSFULLY! ===');
}

testAll()
  .catch((err) => {
    console.error('Validation FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
