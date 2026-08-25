const prisma = require('../config/db');
const { logAudit } = require('../services/auditService');

exports.getAllDepartments = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === 'true' ? {} : { isActive: true };

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: { staff: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required' });
    }

    const department = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_DEPARTMENT',
      resource: 'DEPARTMENT',
      details: { code: department.code, name: department.name },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: department });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Department code or name already exists' });
    }
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_DEPARTMENT',
      resource: 'DEPARTMENT',
      details: { id, name: department.name, isActive: department.isActive },
      ipAddress: req.ip
    });

    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};
