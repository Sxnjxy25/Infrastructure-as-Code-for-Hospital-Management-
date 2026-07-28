const prisma = require('../config/db');

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, doctorId, patientId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    const dateObj = new Date(appointmentDate);
    const existingCount = await prisma.appointment.count({
      where: {
        doctorId,
        appointmentDate: {
          gte: new Date(dateObj.setHours(0,0,0,0)),
          lt: new Date(dateObj.setHours(23,59,59,999))
        }
      }
    });

    const tokenNumber = existingCount + 101;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        tokenNumber,
        appointmentDate: new Date(appointmentDate),
        reason,
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } }
      }
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, diagnosis, prescription } = req.body;
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status, diagnosis, prescription }
    });
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};
