const prisma = require('../config/db');
const { completeLabTestTransaction } = require('../services/labService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

exports.getLabTests = async (req, res, next) => {
  try {
    const { status, patientId, category, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (patientId) where.patientId = patientId;

    // Doctor & Patient RBAC Scoping
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        include: { appointments: { select: { patientId: true } } }
      });
      if (doctor) {
        const patientIds = [...new Set(doctor.appointments?.map(a => a.patientId))];
        where.patientId = { in: patientIds };
      }
    } else if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id }
      });
      if (patient) {
        where.patientId = patient.id;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        include: { patient: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.labTest.count({ where })
    ]);

    res.json({
      success: true,
      data: tests,
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

exports.createLabTest = async (req, res, next) => {
  try {
    const { patientId, testName, category, requestedBy, cost } = req.body;

    if (!patientId || !testName) {
      return res.status(400).json({ success: false, message: 'Patient and Test Name are required' });
    }

    const test = await prisma.labTest.create({
      data: {
        patientId,
        testName: testName.trim(),
        category: category || 'General Pathology',
        cost: cost ? parseFloat(cost) : 50.00,
        requestedBy: requestedBy || req.user.name,
        status: 'PENDING'
      },
      include: { patient: true }
    });

    await createNotification({
      role: 'LAB_TECHNICIAN',
      title: 'New Lab Request',
      message: `${test.testName} ordered for ${test.patient.firstName} ${test.patient.lastName}.`,
      type: 'LAB_REQUEST',
      entityId: test.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'ORDER_LAB_TEST',
      resource: 'LABORATORY',
      details: { testId: test.id, testName: test.testName, patientMrn: test.patient.mrn },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

exports.updateLabStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const test = await prisma.labTest.update({
      where: { id },
      data: { status },
      include: { patient: true }
    });

    res.json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

exports.completeLabResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resultSummary, reportUrl } = req.body;

    if (!resultSummary) {
      return res.status(400).json({ success: false, message: 'Result summary / diagnostic findings are required' });
    }

    const result = await completeLabTestTransaction({
      testId: id,
      resultSummary,
      reportUrl,
      completedByUserId: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Laboratory investigation completed and billing recorded',
      data: result.test
    });
  } catch (err) {
    next(err);
  }
};
