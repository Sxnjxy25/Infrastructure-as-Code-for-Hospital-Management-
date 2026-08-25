const test = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/db');
const { completeAppointmentTransaction } = require('../services/appointmentService');
const { completeLabTestTransaction } = require('../services/labService');
const { dispenseMedicinesTransaction } = require('../services/pharmacyService');
const { processPayment, addInvoiceLineItem } = require('../services/billingService');
const { validateDocument, generateSignedUrl, verifySignedUrl } = require('../services/documentService');

test('HMS Test Suite: Data Layer, Transactions & Automation', async (t) => {

  await t.test('1. Departments & Staff Directory Integrity', async () => {
    const depts = await prisma.department.findMany();
    assert.ok(depts.length >= 10, 'Should have at least 10 departments');

    const adminDept = depts.find(d => d.code === 'ADM');
    assert.ok(adminDept, 'Administration department must exist');

    const staffList = await prisma.staffProfile.findMany({
      include: { department: true }
    });
    assert.ok(staffList.length >= 10, 'Should have portal and record-only staff profiles');

    const nurse = staffList.find(s => s.category === 'NURSE');
    assert.ok(nurse, 'Record-only Nurse profile must exist');
    assert.equal(nurse.department.code, 'NUR');

    const cleaner = staffList.find(s => s.category === 'CLEANER');
    assert.ok(cleaner, 'Cleaner profile must exist');
    assert.equal(cleaner.department.code, 'HSK');
  });

  await t.test('2. Document Service Validation & Cryptographic Signed URLs', async () => {
    // Valid document
    assert.doesNotThrow(() => {
      validateDocument({ mimeType: 'application/pdf', fileSize: 1024 * 1024, fileName: 'certificate.pdf' });
    });

    // Invalid file size (> 5 MB)
    assert.throws(() => {
      validateDocument({ mimeType: 'application/pdf', fileSize: 6 * 1024 * 1024, fileName: 'huge.pdf' });
    }, /5 MB limit/);

    // Invalid MIME type
    assert.throws(() => {
      validateDocument({ mimeType: 'application/x-msdownload', fileSize: 1024, fileName: 'virus.exe' });
    }, /Unsupported document type/);

    // Cryptographic Signed URL Generation and Verification
    const docId = 'test-doc-uuid-123';
    const fileUrl = 'staff/doctor/doc1/cert.pdf';
    const signedUrl = generateSignedUrl({ fileUrl, documentId: docId, expiresInSeconds: 900 });
    assert.ok(signedUrl.includes('/api/staff/documents/view/test-doc-uuid-123'));

    const urlParams = new URLSearchParams(signedUrl.split('?')[1]);
    const expires = urlParams.get('expires');
    const sig = urlParams.get('sig');

    assert.doesNotThrow(() => {
      verifySignedUrl({ documentId: docId, fileUrl, expires, signature: sig });
    });

    // Expired verification
    assert.throws(() => {
      verifySignedUrl({ documentId: docId, fileUrl, expires: Math.floor(Date.now() / 1000) - 10, signature: sig });
    }, /expired/);
  });

  await t.test('3. Appointment Completion Automation & Billing Idempotency', async () => {
    const patient = await prisma.patient.findFirst();
    const doctor = await prisma.doctor.findFirst({ include: { user: true } });

    const app = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: 999,
        appointmentDate: new Date(),
        channel: 'OFFLINE',
        reason: 'Test Consultation Automation',
        status: 'SCHEDULED'
      }
    });

    // Complete appointment transaction
    const res1 = await completeAppointmentTransaction({
      appointmentId: app.id,
      diagnosis: 'Mild hypertension',
      prescription: 'Amlodipine 5mg once daily',
      orderedTests: [{ testName: 'Lipid Panel', category: 'Biochemistry', cost: 60.00 }]
    });

    assert.equal(res1.appointment.status, 'COMPLETED');
    assert.equal(res1.alreadyCompleted, false);
    assert.equal(res1.createdLabTests.length, 1);

    // Verify invoice item was created
    const invoiceItem = await prisma.invoiceItem.findUnique({
      where: {
        source_item_unique: {
          sourceEntity: 'APPOINTMENT',
          sourceId: app.id
        }
      }
    });
    assert.ok(invoiceItem, 'Consultation invoice item must exist');
    assert.equal(invoiceItem.unitPrice, doctor.consultationFee);

    // IDEMPOTENCY CHECK: Calling completion again must NOT duplicate invoice items
    const res2 = await completeAppointmentTransaction({
      appointmentId: app.id,
      diagnosis: 'Mild hypertension'
    });
    assert.equal(res2.alreadyCompleted, true);

    const itemsCount = await prisma.invoiceItem.count({
      where: { sourceEntity: 'APPOINTMENT', sourceId: app.id }
    });
    assert.equal(itemsCount, 1, 'Strict Idempotency: Must only have exactly 1 invoice item for this appointment');
  });

  await t.test('4. Laboratory Lifecycle & Automated Billing', async () => {
    const patient = await prisma.patient.findFirst();
    const test = await prisma.labTest.create({
      data: {
        patientId: patient.id,
        testName: 'Automated Diagnostic Assay',
        category: 'Serology',
        cost: 75.00,
        status: 'PENDING'
      }
    });

    const res = await completeLabTestTransaction({
      testId: test.id,
      resultSummary: 'Negative for all target markers. Normal parameters.'
    });

    assert.equal(res.test.status, 'COMPLETED');

    const labInvoiceItem = await prisma.invoiceItem.findUnique({
      where: {
        source_item_unique: {
          sourceEntity: 'LAB_TEST',
          sourceId: test.id
        }
      }
    });
    assert.ok(labInvoiceItem, 'Lab test billing line item must exist');
    assert.equal(labInvoiceItem.totalPrice, 75.00);
  });

  await t.test('5. Pharmacy Dispensing, Atomic Stock Deduction & Low-Stock Alerts', async () => {
    const patient = await prisma.patient.findFirst();
    const med = await prisma.medicine.findFirst({
      where: { code: 'MED-AMLO-5' }
    });

    const initialStock = med.quantity;
    const dispenseQty = 10;

    const result = await dispenseMedicinesTransaction({
      patientId: patient.id,
      items: [{ medicineId: med.id, quantity: dispenseQty }]
    });

    assert.equal(result.success, true);

    const updatedMed = await prisma.medicine.findUnique({ where: { id: med.id } });
    assert.equal(updatedMed.quantity, initialStock - dispenseQty, 'Inventory must be deducted by exactly dispense quantity');

    // Test insufficient inventory rollback
    await assert.rejects(async () => {
      await dispenseMedicinesTransaction({
        patientId: patient.id,
        items: [{ medicineId: med.id, quantity: 999999 }]
      });
    }, /Insufficient inventory/);

    const checkStockAfterRollback = await prisma.medicine.findUnique({ where: { id: med.id } });
    assert.equal(checkStockAfterRollback.quantity, initialStock - dispenseQty, 'Stock must not change on failed transaction');
  });

  await t.test('6. Payment Processing, Receipt Numbering & Invoice Transition', async () => {
    // Create dedicated patient for isolated invoice calculation
    const testPatient = await prisma.patient.create({
      data: {
        mrn: `MRN-TEST-${Date.now().toString().slice(-4)}`,
        firstName: 'Billing',
        lastName: 'Tester',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'Female',
        phone: '+1-555-9876'
      }
    });

    const { invoice } = await addInvoiceLineItem({
      patientId: testPatient.id,
      billingType: 'RECEPTION',
      sourceDepartment: 'RECEPTION',
      itemBillingType: 'SERVICE',
      itemDescription: 'Emergency Ward Admission Fee',
      quantity: 1,
      unitPrice: 200.00
    });

    assert.equal(invoice.netAmount, 200.00);

    // 1. Test Partial Payment of $80
    const partialPay = await processPayment({
      invoiceId: invoice.id,
      amount: 80.00,
      paymentMethod: 'CASH',
      notes: 'Initial cash deposit'
    });

    assert.equal(partialPay.payment.status, 'COMPLETED');
    assert.equal(partialPay.invoice.status, 'PARTIALLY_PAID');
    assert.equal(partialPay.invoice.paidAmount, 80.00);

    // 2. Test Remaining Payment of $120
    const fullPay = await processPayment({
      invoiceId: invoice.id,
      amount: 120.00,
      paymentMethod: 'UPI',
      notes: 'Final UPI settlement'
    });

    assert.equal(fullPay.payment.status, 'COMPLETED');
    assert.ok(fullPay.payment.receiptNumber.startsWith('REC-2026-'));
    assert.equal(fullPay.invoice.status, 'PAID');
    assert.equal(fullPay.invoice.paidAmount, 200.00);
  });
});
