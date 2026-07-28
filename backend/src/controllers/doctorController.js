const prisma = require('../config/db');

exports.getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { department: 'asc' }
    });
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        appointments: { include: { patient: true } }
      }
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: { availability }
    });
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};
