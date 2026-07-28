const prisma = require('../config/db');

exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { patientId, amount, discount = 0, description, paymentMethod } = req.body;
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(4, '0')}`;
    const netAmount = parseFloat(amount) - parseFloat(discount);

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        invoiceNumber,
        amount: parseFloat(amount),
        discount: parseFloat(discount),
        netAmount,
        description,
        paymentMethod,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status, paymentMethod }
    });
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};
