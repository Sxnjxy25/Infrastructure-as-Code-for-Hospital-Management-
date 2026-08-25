const prisma = require('../config/db');
const { processPayment, addInvoiceLineItem } = require('../services/billingService');
const { logAudit } = require('../services/auditService');

exports.getInvoices = async (req, res, next) => {
  try {
    const { billingType, status, patientId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (billingType) where.billingType = billingType;
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (patient) {
        where.patientId = patient.id;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: true,
          items: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      data: invoices,
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

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: {
          include: { medicine: true }
        },
        payments: {
          include: { receivedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { patientId, billingType = 'RECEPTION', items, discount = 0, description } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one billable item are required' });
    }

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(4, '0')}`;

    const grossAmount = items.reduce((sum, itm) => sum + (parseFloat(itm.unitPrice) * parseInt(itm.quantity || 1)), 0);
    const netAmount = Math.max(0, grossAmount - parseFloat(discount));

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        invoiceNumber,
        billingType,
        amount: grossAmount,
        discount: parseFloat(discount),
        netAmount,
        paidAmount: 0.00,
        status: 'PENDING',
        description: description || `${billingType} Invoice`,
        items: {
          create: items.map(itm => ({
            sourceDepartment: itm.sourceDepartment || 'RECEPTION',
            billingType: itm.billingType || 'SERVICE',
            itemDescription: itm.itemDescription,
            quantity: parseInt(itm.quantity || 1),
            unitPrice: parseFloat(itm.unitPrice),
            totalPrice: parseFloat(itm.unitPrice) * parseInt(itm.quantity || 1),
            medicineId: itm.medicineId || null,
            sourceEntity: itm.sourceEntity || null,
            sourceId: itm.sourceId || null
          }))
        }
      },
      include: { items: true, patient: true }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_INVOICE',
      resource: 'BILLING',
      details: { invoiceNumber: invoice.invoiceNumber, patientMrn: invoice.patient?.mrn, netAmount },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'CARD', transactionId, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const result = await processPayment({
      invoiceId: id,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      notes,
      receivedById: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Payment recorded and receipt generated successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getReceptionInvoices = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { billingType: 'RECEPTION' },
      include: { patient: true, items: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
};

exports.getPharmacyInvoices = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { billingType: 'PHARMACY' },
      include: { patient: true, items: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentRevenue = async (req, res, next) => {
  try {
    const items = await prisma.invoiceItem.findMany({
      include: { invoice: true }
    });

    const revenueByDept = {
      CLINICAL: 0,
      PHARMACY: 0,
      LABORATORY: 0,
      RECEPTION: 0,
      TOTAL: 0
    };

    items.forEach(itm => {
      // If parent invoice is PAID or PARTIALLY_PAID
      if (itm.invoice && (itm.invoice.status === 'PAID' || itm.invoice.status === 'PARTIALLY_PAID')) {
        const dept = itm.sourceDepartment || 'RECEPTION';
        revenueByDept[dept] = (revenueByDept[dept] || 0) + itm.totalPrice;
        revenueByDept.TOTAL += itm.totalPrice;
      }
    });

    res.json({ success: true, data: revenueByDept });
  } catch (err) {
    next(err);
  }
};
