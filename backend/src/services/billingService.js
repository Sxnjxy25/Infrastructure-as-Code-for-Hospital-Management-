const prisma = require('../config/db');
const { logAudit } = require('./auditService');
const { createNotification } = require('./notificationService');

/**
 * Ensures an active/pending invoice exists for the patient and adds an idempotent line item.
 * Recalculates the invoice total amount and net amount atomically.
 */
async function addInvoiceLineItem({
  patientId,
  billingType = 'RECEPTION',
  sourceDepartment = 'CLINICAL',
  itemBillingType = 'SERVICE',
  itemDescription,
  quantity = 1,
  unitPrice,
  medicineId = null,
  sourceEntity = null,
  sourceId = null,
  prismaClient = prisma
}) {
  const totalPrice = parseFloat(unitPrice) * parseInt(quantity);

  // Check if item already exists for this sourceEntity & sourceId to ensure strict IDEMPOTENCY
  if (sourceEntity && sourceId) {
    const existingItem = await prismaClient.invoiceItem.findUnique({
      where: {
        source_item_unique: {
          sourceEntity,
          sourceId: String(sourceId)
        }
      }
    });

    if (existingItem) {
      return { item: existingItem, alreadyExisted: true };
    }
  }

  // Find existing PENDING invoice for this patient and billingType, or create a new one
  let invoice = await prismaClient.invoice.findFirst({
    where: {
      patientId,
      billingType,
      status: 'PENDING'
    },
    include: { items: true }
  });

  if (!invoice) {
    const count = await prismaClient.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(4, '0')}`;

    invoice = await prismaClient.invoice.create({
      data: {
        patientId,
        invoiceNumber,
        billingType,
        amount: totalPrice,
        discount: 0.00,
        netAmount: totalPrice,
        paidAmount: 0.00,
        status: 'PENDING',
        description: `${billingType} Services Invoice`
      }
    });
  }

  // Create the line item
  const item = await prismaClient.invoiceItem.create({
    data: {
      invoiceId: invoice.id,
      sourceDepartment,
      billingType: itemBillingType,
      itemDescription,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      totalPrice,
      medicineId,
      sourceEntity,
      sourceId: sourceId ? String(sourceId) : null
    }
  });

  // Recalculate invoice totals
  const allItems = await prismaClient.invoiceItem.findMany({
    where: { invoiceId: invoice.id }
  });

  const grossAmount = allItems.reduce((sum, itm) => sum + itm.totalPrice, 0);
  const netAmount = Math.max(0, grossAmount - (invoice.discount || 0));

  const updatedInvoice = await prismaClient.invoice.update({
    where: { id: invoice.id },
    data: {
      amount: grossAmount,
      netAmount
    }
  });

  return { item, invoice: updatedInvoice, alreadyExisted: false };
}

/**
 * Processes an invoice payment, generates receipt number, updates status, and logs audit record.
 */
async function processPayment({
  invoiceId,
  amount,
  paymentMethod,
  transactionId = null,
  notes = null,
  receivedById = null,
  ipAddress = null,
  prismaClient = prisma
}) {
  return await prismaClient.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true, items: true, payments: true }
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const newPaidTotal = (invoice.paidAmount || 0) + payAmount;
    let newStatus = 'PARTIALLY_PAID';
    if (newPaidTotal >= invoice.netAmount) {
      newStatus = 'PAID';
    }

    // Generate unique receipt number
    const paymentCount = await tx.payment.count();
    const receiptNumber = `REC-2026-${String(paymentCount + 1).padStart(4, '0')}`;

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        receiptNumber,
        amount: payAmount,
        paymentMethod,
        transactionId,
        status: 'COMPLETED',
        notes,
        receivedById
      }
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidTotal,
        status: newStatus,
        paymentMethod: paymentMethod
      }
    });

    // Audit logging
    await logAudit({
      userId: receivedById,
      action: 'PAYMENT_RECEIVED',
      resource: 'BILLING',
      details: {
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber,
        amount: payAmount,
        paymentMethod,
        status: newStatus,
        patientMrn: invoice.patient?.mrn
      },
      ipAddress,
      prismaClient: tx
    });

    // Trigger payment notification for Accountant & Admin
    await createNotification({
      role: 'ACCOUNTANT',
      title: 'Payment Received',
      message: `Received $${payAmount.toFixed(2)} (${paymentMethod}) for Invoice ${invoice.invoiceNumber} (Receipt #${receiptNumber})`,
      type: 'PAYMENT',
      entityId: payment.id,
      prismaClient: tx
    });

    return { payment, invoice: updatedInvoice };
  });
}

module.exports = {
  addInvoiceLineItem,
  processPayment
};
