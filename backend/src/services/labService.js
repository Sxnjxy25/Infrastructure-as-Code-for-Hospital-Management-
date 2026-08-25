const prisma = require('../config/db');
const { logAudit } = require('./auditService');
const { createNotification } = require('./notificationService');
const { addInvoiceLineItem } = require('./billingService');

/**
 * Transactionally completes a diagnostic lab test:
 * 1. Updates status to COMPLETED with results/report.
 * 2. Idempotently adds Laboratory test fee to patient invoice.
 * 3. Notifies attending doctors.
 * 4. Records audit trail.
 */
async function completeLabTestTransaction({
  testId,
  resultSummary,
  reportUrl = null,
  completedByUserId = null,
  ipAddress = null
}) {
  return await prisma.$transaction(async (tx) => {
    const test = await tx.labTest.findUnique({
      where: { id: testId },
      include: { patient: true }
    });

    if (!test) {
      throw new Error(`LabTest ${testId} not found`);
    }

    if (test.status === 'COMPLETED') {
      return { test, alreadyCompleted: true };
    }

    const updatedTest = await tx.labTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        resultSummary,
        reportUrl
      },
      include: { patient: true }
    });

    // Automated Lab Test Invoicing (Idempotent)
    const testCost = test.cost || 50.00;
    await addInvoiceLineItem({
      patientId: test.patientId,
      billingType: 'RECEPTION',
      sourceDepartment: 'LABORATORY',
      itemBillingType: 'LAB_TEST',
      itemDescription: `Laboratory Investigation: ${test.testName} (${test.category})`,
      quantity: 1,
      unitPrice: testCost,
      sourceEntity: 'LAB_TEST',
      sourceId: test.id,
      prismaClient: tx
    });

    // Notify Doctor that results are ready
    await createNotification({
      role: 'DOCTOR',
      title: 'Lab Report Ready',
      message: `Diagnostic results ready for patient ${test.patient.firstName} ${test.patient.lastName} (${test.testName}).`,
      type: 'LAB_RESULT',
      entityId: test.id,
      prismaClient: tx
    });

    // Audit log
    await logAudit({
      userId: completedByUserId,
      action: 'LAB_TEST_COMPLETED',
      resource: 'LABORATORY',
      details: {
        testId: test.id,
        testName: test.testName,
        patientMrn: test.patient.mrn,
        cost: testCost
      },
      ipAddress,
      prismaClient: tx
    });

    return { test: updatedTest, alreadyCompleted: false };
  });
}

module.exports = {
  completeLabTestTransaction
};
