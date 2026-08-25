require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const prisma = require('../config/db');

function createAuthToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

test('HMS End-to-End API Integration & RBAC Test Suite', async (t) => {
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hospital.com' } });
  const doctorUser = await prisma.user.findUnique({ where: { email: 'dr.smith@hospital.com' } });
  const receptionUser = await prisma.user.findUnique({ where: { email: 'reception@hospital.com' } });
  const patientUser = await prisma.user.findUnique({ where: { email: 'john.doe@patient.com' } });
  const pharmacyUser = await prisma.user.findUnique({ where: { email: 'pharmacy@hospital.com' } });
  const labUser = await prisma.user.findUnique({ where: { email: 'lab@hospital.com' } });
  const accountantUser = await prisma.user.findUnique({ where: { email: 'billing@hospital.com' } });

  const adminToken = createAuthToken(adminUser);
  const doctorToken = createAuthToken(doctorUser);
  const receptionToken = createAuthToken(receptionUser);
  const patientToken = createAuthToken(patientUser);
  const pharmacyToken = createAuthToken(pharmacyUser);
  const labToken = createAuthToken(labUser);
  const accountantToken = createAuthToken(accountantUser);

  const BASE_URL = 'http://localhost:5000/api';

  await t.test('1. Department & Staff Profile Directory API', async () => {
    // 1.1 List departments
    const deptRes = await fetch(`${BASE_URL}/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(deptRes.status, 200);
    const deptData = await deptRes.json();
    assert.ok(deptData.data.length >= 10);

    // 1.2 Create staff profile as Admin
    const staffRes = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Automated Test Nurse ${Date.now()}`,
        category: 'NURSE',
        designation: 'Triage Specialist',
        shift: 'MORNING',
        availability: 'AVAILABLE',
        phone: '+1-555-8888'
      })
    });
    assert.equal(staffRes.status, 201);
    const staffData = await staffRes.json();
    const staffId = staffData.data.id;

    // 1.3 Upload Staff Document metadata as Admin
    const docRes = await fetch(`${BASE_URL}/staff/${staffId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        documentType: 'CERTIFICATE',
        title: 'Nursing Board Credential',
        fileName: 'credential.pdf',
        fileSize: 1024 * 300,
        mimeType: 'application/pdf'
      })
    });
    assert.equal(docRes.status, 201);
    const docData = await docRes.json();
    const docId = docData.data.id;

    // 1.4 Request 15-minute Signed URL as Admin
    const signRes = await fetch(`${BASE_URL}/staff/${staffId}/documents/${docId}/signed-url`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(signRes.status, 200);
    const signData = await signRes.json();
    assert.ok(signData.data.signedUrl.includes('/api/staff/documents/view/'));

    // 1.5 RBAC: Verify Non-Admin (Doctor) is FORBIDDEN from requesting signed document URLs
    const forbiddenRes = await fetch(`${BASE_URL}/staff/${staffId}/documents/${docId}/signed-url`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert.equal(forbiddenRes.status, 403, 'Non-admin must receive 403 Forbidden on sensitive staff document URLs');
  });

  await t.test('2. Clinical Consultation Completion & Automated Multi-Department Routing', async () => {
    const patient = await prisma.patient.findFirst();
    const doctor = await prisma.doctor.findFirst({ where: { userId: doctorUser.id } });

    // 2.1 Book walk-in appointment
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`
      },
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: new Date().toISOString(),
        channel: 'OFFLINE',
        reason: 'E2E Cardiology Workstation Test'
      })
    });
    assert.equal(bookRes.status, 201);
    const bookData = await bookRes.json();
    const appointmentId = bookData.data.id;

    // 2.2 Doctor completes consultation with electronic prescription & lab orders
    const compRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        diagnosis: 'Atrial arrhythmia screening positive',
        prescription: 'Amlodipine 5mg - 1 tab OD',
        orderedTests: [{ testName: 'Echocardiogram 2D', category: 'Cardiology', cost: 120.00 }]
      })
    });
    assert.equal(compRes.status, 200);
    const compData = await compRes.json();
    assert.equal(compData.data.status, 'COMPLETED');
    assert.equal(compData.createdLabTests.length, 1);
    const labTestId = compData.createdLabTests[0].id;

    // 2.3 Lab Tech completes the ordered test
    const labCompRes = await fetch(`${BASE_URL}/lab/tests/${labTestId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${labToken}`
      },
      body: JSON.stringify({
        resultSummary: 'Ejection fraction 62%. Normal ventricular dimensions.'
      })
    });
    assert.equal(labCompRes.status, 200);
  });

  await t.test('3. Pharmacy Dispense & Invoicing Integration', async () => {
    const patient = await prisma.patient.findFirst();
    const med = await prisma.medicine.findFirst({ where: { code: 'MED-AMLO-5' } });

    const dispRes = await fetch(`${BASE_URL}/pharmacy/dispense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmacyToken}`
      },
      body: JSON.stringify({
        patientId: patient.id,
        items: [{ medicineId: med.id, quantity: 5 }]
      })
    });
    assert.equal(dispRes.status, 200);
    const dispData = await dispRes.json();
    assert.equal(dispData.success, true);
  });

  await t.test('4. Invoicing, Payments, Receipts & Revenue Analytics', async () => {
    // 4.1 Fetch reception invoices
    const invRes = await fetch(`${BASE_URL}/billing/invoices`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    assert.equal(invRes.status, 200);
    const invData = await invRes.json();
    assert.ok(invData.data.length > 0);

    const pendingInvoice = invData.data.find(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID');
    if (pendingInvoice) {
      const payRes = await fetch(`${BASE_URL}/billing/invoices/${pendingInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`
        },
        body: JSON.stringify({
          amount: 50.00,
          paymentMethod: 'CARD',
          notes: 'E2E automated cashier payment'
        })
      });
      assert.equal(payRes.status, 200);
      const payData = await payRes.json();
      assert.ok(payData.data.payment.receiptNumber.startsWith('REC-2026-'));
    }

    // 4.2 Department Revenue Breakdown
    const revRes = await fetch(`${BASE_URL}/billing/revenue`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    assert.equal(revRes.status, 200);
    const revData = await revRes.json();
    assert.ok(revData.data.TOTAL >= 0);
  });

  await t.test('5. Notification System & Alerts', async () => {
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${pharmacyToken}` }
    });
    assert.equal(notifRes.status, 200);
    const notifData = await notifRes.json();
    assert.ok(Array.isArray(notifData.data));
  });
});
