const prisma = require('../config/db');

exports.getAllPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { mrn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);

    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: { include: { doctor: { include: { user: true } } } },
        labTests: true,
        invoices: true
      }
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, bloodGroup, phone, address, emergencyContact, medicalHistory } = req.body;

    const count = await prisma.patient.count();
    const mrn = `MRN-2026-${String(count + 1).padStart(3, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        mrn,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup,
        phone,
        address,
        emergencyContact,
        medicalHistory
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_PATIENT',
        resource: 'PATIENT',
        details: `Created patient record for ${firstName} ${lastName} (${mrn})`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, emergencyContact, medicalHistory } = req.body;

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, address, emergencyContact, medicalHistory }
    });

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};
