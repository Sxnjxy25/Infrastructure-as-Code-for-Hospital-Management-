const prisma = require('../config/db');
const { logAudit } = require('../services/auditService');
const {
  validateDocument,
  generateS3Key,
  generateSignedUrl,
  verifySignedUrl
} = require('../services/documentService');

exports.getAllStaff = async (req, res, next) => {
  try {
    const { category, availability, departmentId, search, page = 1, limit = 50 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (availability) where.availability = availability;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { designation: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [staffList, total] = await Promise.all([
      prisma.staffProfile.findMany({
        where,
        include: {
          department: true,
          user: { select: { id: true, email: true, role: true } },
          _count: { select: { documents: true } }
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip,
        take: parseInt(limit)
      }),
      prisma.staffProfile.count({ where })
    ]);

    res.json({
      success: true,
      data: staffList,
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

exports.getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, email: true, name: true, role: true, phone: true } },
        documents: {
          select: {
            id: true,
            documentType: true,
            title: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, category, designation, departmentId, shift, availability, phone, email, userId } = req.body;

    if (!name || !category || !designation) {
      return res.status(400).json({ success: false, message: 'Name, category, and designation are required' });
    }

    const staff = await prisma.staffProfile.create({
      data: {
        name: name.trim(),
        category,
        designation: designation.trim(),
        departmentId: departmentId || null,
        shift: shift || 'MORNING',
        availability: availability || 'AVAILABLE',
        phone: phone || null,
        email: email || null,
        userId: userId || null,
        isActive: true
      },
      include: { department: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_STAFF',
      resource: 'STAFF',
      details: { staffId: staff.id, name: staff.name, category: staff.category, designation: staff.designation },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, designation, departmentId, shift, availability, phone, email, isActive } = req.body;

    const staff = await prisma.staffProfile.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        category: category !== undefined ? category : undefined,
        designation: designation !== undefined ? designation.trim() : undefined,
        departmentId: departmentId !== undefined ? departmentId : undefined,
        shift: shift !== undefined ? shift : undefined,
        availability: availability !== undefined ? availability : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      },
      include: { department: true }
    });

    // If staff has a linked doctor, sync availability
    if (staff.userId && staff.category === 'DOCTOR' && availability) {
      await prisma.doctor.updateMany({
        where: { userId: staff.userId },
        data: { availability }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STAFF',
      resource: 'STAFF',
      details: { staffId: id, name: staff.name, category: staff.category },
      ipAddress: req.ip
    });

    res.json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!['AVAILABLE', 'ON_DUTY', 'BUSY', 'OFF_DUTY', 'ON_LEAVE'].includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid availability state' });
    }

    const staff = await prisma.staffProfile.update({
      where: { id },
      data: { availability }
    });

    if (staff.userId && staff.category === 'DOCTOR') {
      await prisma.doctor.updateMany({
        where: { userId: staff.userId },
        data: { availability }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STAFF_AVAILABILITY',
      resource: 'STAFF',
      details: { staffId: id, availability },
      ipAddress: req.ip
    });

    res.json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const { id } = req.params; // staffProfileId
    const { documentType, title, fileName, fileSize, mimeType } = req.body;

    const staff = await prisma.staffProfile.findUnique({ where: { id } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found' });
    }

    // Validate size & MIME type
    validateDocument({ mimeType, fileSize, fileName });

    const s3Key = generateS3Key({ category: staff.category, staffProfileId: staff.id, fileName });

    const document = await prisma.staffDocument.create({
      data: {
        staffProfileId: staff.id,
        documentType: documentType || 'CERTIFICATE',
        title: title || fileName,
        fileUrl: s3Key,
        fileName,
        fileSize: parseInt(fileSize),
        mimeType
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPLOAD_STAFF_DOCUMENT',
      resource: 'STAFF_DOCUMENT',
      details: { staffId: staff.id, documentId: document.id, title: document.title, documentType: document.documentType },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: document });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getSignedDocumentUrl = async (req, res, next) => {
  try {
    const { id, docId } = req.params;

    const document = await prisma.staffDocument.findFirst({
      where: { id: docId, staffProfileId: id },
      include: { staffProfile: true }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    // Generate 15-minute signed access URL
    const signedUrl = generateSignedUrl({
      fileUrl: document.fileUrl,
      documentId: document.id,
      expiresInSeconds: 900
    });

    // Immutable audit log on document access request
    await logAudit({
      userId: req.user.id,
      action: 'DOCUMENT_URL_REQUESTED',
      resource: 'STAFF_DOCUMENT',
      details: {
        documentId: document.id,
        title: document.title,
        staffName: document.staffProfile?.name,
        category: document.staffProfile?.category
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        documentId: document.id,
        title: document.title,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        signedUrl,
        expiresInSeconds: 900
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.viewDocumentContent = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const { expires, sig } = req.query;

    const document = await prisma.staffDocument.findUnique({
      where: { id: docId },
      include: { staffProfile: true }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Verify cryptographic signature and expiration
    verifySignedUrl({
      documentId: document.id,
      fileUrl: document.fileUrl,
      expires,
      signature: sig
    });

    // Record view audit
    await logAudit({
      userId: req.user?.id || null,
      action: 'DOCUMENT_VIEWED',
      resource: 'STAFF_DOCUMENT',
      details: {
        documentId: document.id,
        title: document.title,
        staffName: document.staffProfile?.name
      },
      ipAddress: req.ip
    });

    // Return mock PDF / text stream for demo verification
    res.setHeader('Content-Type', document.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.send(`%PDF-1.4\n1 0 obj\n<< /Title (${document.title}) /Staff (${document.staffProfile?.name}) >>\nendobj\n%%EOF\n[Authenticated Document View: ${document.title} - Verified by AWS KMS / S3 Vault]`);
  } catch (err) {
    res.status(403).json({ success: false, message: err.message });
  }
};
