const prisma = require('../config/db');
const { completeAppointmentTransaction } = require('../services/appointmentService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, doctorId, patientId, channel, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (channel) where.channel = channel;

    // Doctor scoping: If user is DOCTOR role, scope to their own doctor record unless querying specific allowed items
    if (req.user.role === 'DOCTOR') {
      const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      if (doc) {
        where.doctorId = doc.id;
      }
    } else if (req.user.role === 'PATIENT') {
      const pat = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (pat) {
        where.patientId = pat.id;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
          createdBy: { select: { id: true, name: true, role: true } }
        },
        orderBy: [{ tokenNumber: 'asc' }, { appointmentDate: 'asc' }],
        skip,
        take: parseInt(limit)
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, reason, channel = 'OFFLINE' } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ success: false, message: 'Patient, Doctor, and Appointment Date are required' });
    }

    // Doctor-specific token queue (Doctor 1 starts at #101, Doctor 2 starts at #101)
    const maxDoctorToken = await prisma.appointment.findFirst({
      where: { doctorId },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true }
    });

    const tokenNumber = (maxDoctorToken && maxDoctorToken.tokenNumber >= 100)
      ? maxDoctorToken.tokenNumber + 1
      : 101;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        createdById: req.user?.id || null,
        tokenNumber,
        appointmentDate: new Date(appointmentDate),
        channel: channel || 'OFFLINE',
        reason,
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } }
      }
    });

    // Notify doctor
    await createNotification({
      role: 'DOCTOR',
      title: 'New Appointment Scheduled',
      message: `Token #${tokenNumber} booked for ${appointment.patient.firstName} ${appointment.patient.lastName} (${channel}).`,
      type: 'APPOINTMENT',
      entityId: appointment.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'BOOK_APPOINTMENT',
      resource: 'APPOINTMENT',
      details: { appointmentId: appointment.id, patientMrn: appointment.patient.mrn, tokenNumber, channel },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, prescription, orderedTests } = req.body;

    const result = await completeAppointmentTransaction({
      appointmentId: id,
      diagnosis,
      prescription,
      orderedTests: orderedTests || [],
      completedByUserId: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Appointment consultation completed, billing recorded, and clinical orders dispatched',
      data: result.appointment,
      createdLabTests: result.createdLabTests
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, diagnosis, prescription } = req.body;
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status, diagnosis, prescription },
      include: { doctor: true }
    });

    // If starting consultation, mark doctor BUSY
    if (status === 'IN_PROGRESS' && appointment.doctorId) {
      await prisma.doctor.update({
        where: { id: appointment.doctorId },
        data: { availability: 'BUSY' }
      });
      if (appointment.doctor?.userId) {
        await prisma.staffProfile.updateMany({
          where: { userId: appointment.doctor.userId },
          data: { availability: 'BUSY' }
        });
      }
    } else if ((status === 'COMPLETED' || status === 'CANCELLED') && appointment.doctorId) {
      await prisma.doctor.update({
        where: { id: appointment.doctorId },
        data: { availability: 'AVAILABLE' }
      });
      if (appointment.doctor?.userId) {
        await prisma.staffProfile.updateMany({
          where: { userId: appointment.doctor.userId },
          data: { availability: 'AVAILABLE' }
        });
      }
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.quickBookPublicAppointment = async (req, res, next) => {
  try {
    const { doctorName, doctorId, patientName, phone, appointmentDate, timeSlot, reason, channel = 'OFFLINE' } = req.body;

    if (!patientName || !phone) {
      return res.status(400).json({ success: false, message: 'Patient Name and Phone Number are required' });
    }

    // 1. Find Doctor
    let targetDoctor = null;
    if (doctorId) {
      targetDoctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true }
      });
    }
    if (!targetDoctor && doctorName) {
      targetDoctor = await prisma.doctor.findFirst({
        where: {
          user: { name: { contains: doctorName } }
        },
        include: { user: true }
      });
    }
    if (!targetDoctor) {
      // Pick first available doctor
      targetDoctor = await prisma.doctor.findFirst({
        include: { user: true }
      });
    }

    if (!targetDoctor) {
      return res.status(404).json({ success: false, message: 'No doctor found for this appointment' });
    }

    // 2. Find or Create Patient record
    let patient = await prisma.patient.findFirst({
      where: { phone }
    });

    if (!patient) {
      const nameParts = patientName.trim().split(' ');
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.slice(1).join(' ') || 'Walk-in';
      const randomMrnSuffix = Math.floor(1000 + Math.random() * 9000);
      const mrn = `MRN-2026-${randomMrnSuffix}`;

      patient = await prisma.patient.create({
        data: {
          mrn,
          firstName,
          lastName,
          phone,
          dateOfBirth: new Date('1995-01-01'),
          gender: 'Not Specified',
          address: 'Self-registered Outpatient'
        }
      });
    }

    // 3. Compute doctor-specific token number (Doctor 1 starts at #101, Doctor 2 starts at #101)
    const dateObj = appointmentDate ? new Date(appointmentDate) : new Date();
    
    const maxDoctorToken = await prisma.appointment.findFirst({
      where: { doctorId: targetDoctor.id },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true }
    });

    const tokenNumber = (maxDoctorToken && maxDoctorToken.tokenNumber >= 100)
      ? maxDoctorToken.tokenNumber + 1
      : 101;

    // 4. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: targetDoctor.id,
        tokenNumber,
        appointmentDate: dateObj,
        channel: channel || 'OFFLINE',
        reason: (reason || 'Direct Consultation Booking') + (timeSlot ? ` [Slot: ${timeSlot}]` : ''),
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true, phone: true } } } }
      }
    });

    // 5. Create notifications
    await createNotification({
      role: 'DOCTOR',
      title: 'New Online / Direct Slot Booked',
      message: `Token #${tokenNumber} booked by ${patient.firstName} ${patient.lastName} (${phone}) for ${timeSlot || 'Scheduled time'}.`,
      type: 'APPOINTMENT',
      entityId: appointment.id
    });

    await createNotification({
      role: 'RECEPTIONIST',
      title: 'New Direct Appointment Token',
      message: `Token #${tokenNumber} assigned for Dr. ${targetDoctor.user.name} to ${patient.firstName} ${patient.lastName}.`,
      type: 'APPOINTMENT',
      entityId: appointment.id
    });

    res.status(201).json({
      success: true,
      message: 'Consultation slot successfully booked!',
      data: {
        id: appointment.id,
        tokenNumber: appointment.tokenNumber,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        mrn: patient.mrn,
        doctorName: targetDoctor.user.name,
        specialization: targetDoctor.specialization,
        roomNumber: targetDoctor.roomNumber,
        consultationFee: targetDoctor.consultationFee,
        appointmentDate: appointment.appointmentDate,
        timeSlot: timeSlot || '09:00 AM - 10:00 AM',
        channel: appointment.channel,
        status: appointment.status
      }
    });
  } catch (err) {
    next(err);
  }
};

