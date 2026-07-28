const prisma = require('../config/db');

exports.getLabTests = async (req, res, next) => {
  try {
    const tests = await prisma.labTest.findMany({
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
};

exports.createLabTest = async (req, res, next) => {
  try {
    const { patientId, testName, category, requestedBy } = req.body;
    const test = await prisma.labTest.create({
      data: {
        patientId,
        testName,
        category,
        requestedBy,
        status: 'PENDING'
      }
    });
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

exports.updateLabResult = async (req, res, next) => {
  try {
    const { status, resultSummary, reportUrl } = req.body;
    const test = await prisma.labTest.update({
      where: { id: req.params.id },
      data: { status, resultSummary, reportUrl }
    });
    res.json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};
