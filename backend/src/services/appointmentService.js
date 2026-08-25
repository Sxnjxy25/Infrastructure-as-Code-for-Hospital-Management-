const prisma = require('../config/db');
const { logAudit } = require('./auditService');
const { createNotification } = require('./notificationService');
const { addInvoiceLineItem } = require('./billingService');

/**
 * Transactionally completes an outpatient appointment:
 * 1. Sets status to COMPLETED, records diagnosis and prescription.
 * 2. Sets Doctor & StaffProfile availability to AVAILABLE.
 * 3. Idempotently adds Doctor consultation fee to patient Reception invoice.
 * 4. Dispatches LabTest requests if ordered.
 * 5. Notifies Pharmacist if prescription is written.
 * 6. Logs Audit record.
 */
async function completeAppointmentTransaction({
  appointmentId,
  diagnosis = null,
  prescription = null,
  orderedTests = [],
  completedByUserId = null,
  ipAddress = null
}) {
  return await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true
      }
    });

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    if (appointment.status === 'COMPLETED') {
      return { appointment, alreadyCompleted: true };
    }

    // 1. Update appointment
    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        diagnosis: diagnosis || appointment.diagnosis,
        prescription: prescription || appointment.prescription
      },
      include: { doctor: { include: { user: true } }, patient: true }
    });

    // 2. Set Doctor and StaffProfile availability back to AVAILABLE
    if (appointment.doctorId) {
      await tx.doctor.update({
        where: { id: appointment.doctorId },
        data: { availability: 'AVAILABLE' }
      });

      if (appointment.doctor?.userId) {
        await tx.staffProfile.updateMany({
          where: { userId: appointment.doctor.userId },
          data: { availability: 'AVAILABLE' }
        });
      }
    }

    // 3. Automated Consultation Fee Billing (Idempotent)
    const consultationFee = appointment.doctor.consultationFee || 100.00;
    const docName = appointment.doctor.user?.name || 'Attending Physician';

    await addInvoiceLineItem({
      patientId: appointment.patientId,
      billingType: 'RECEPTION',
      sourceDepartment: 'CLINICAL',
      itemBillingType: 'CONSULTATION',
      itemDescription: `Doctor Consultation - ${docName} (${appointment.doctor.specialization})`,
      quantity: 1,
      unitPrice: consultationFee,
      sourceEntity: 'APPOINTMENT',
      sourceId: appointment.id,
      prismaClient: tx
    });

    // 4. Create Lab Tests if ordered during consultation
    const createdLabTests = [];
    if (Array.isArray(orderedTests) && orderedTests.length > 0) {
      for (const t of orderedTests) {
        if (t.testName) {
          const test = await tx.labTest.create({
            data: {
              patientId: appointment.patientId,
              testName: t.testName,
              category: t.category || 'Diagnostics',
              cost: t.cost ? parseFloat(t.cost) : 50.00,
              requestedBy: docName,
              status: 'PENDING'
            }
          });
          createdLabTests.push(test);

          // Alert Lab Tech
          await createNotification({
            role: 'LAB_TECHNICIAN',
            title: 'New Diagnostic Test Ordered',
            message: `${t.testName} ordered for patient ${appointment.patient.firstName} ${appointment.patient.lastName} by ${docName}.`,
            type: 'LAB_REQUEST',
            entityId: test.id,
            prismaClient: tx
          });
        }
      }
    }

    // 5. Notify Pharmacist if prescription given
    if (prescription && prescription.trim().length > 0) {
      await createNotification({
        role: 'PHARMACIST',
        title: 'New Patient Prescription',
        message: `Prescription issued for patient ${appointment.patient.firstName} ${appointment.patient.lastName} (${appointment.patient.mrn}) by ${docName}.`,
        type: 'GENERAL',
        entityId: appointment.id,
        prismaClient: tx
      });
    }

    // 6. Audit logging
    await logAudit({
      userId: completedByUserId,
      action: 'APPOINTMENT_COMPLETED',
      resource: 'APPOINTMENT',
      details: {
        appointmentId: appointment.id,
        patientMrn: appointment.patient.mrn,
        doctorName: docName,
        consultationFee,
        testsOrderedCount: createdLabTests.length
      },
      ipAddress,
      prismaClient: tx
    });

    return {
      appointment: updatedAppointment,
      createdLabTests,
      alreadyCompleted: false
    };
  });
}

module.exports = {
  completeAppointmentTransaction
};
