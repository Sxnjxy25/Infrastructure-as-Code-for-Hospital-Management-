const prisma = require('../config/db');
const { logAudit } = require('./auditService');
const { createNotification } = require('./notificationService');
const { addInvoiceLineItem } = require('./billingService');

/**
 * Transactionally dispenses medicines, deducts stock, adds pharmacy invoice line items,
 * and raises low-stock alerts.
 */
async function dispenseMedicinesTransaction({
  patientId,
  items, // array of { medicineId, quantity }
  dispensedByUserId = null,
  ipAddress = null
}) {
  if (!items || items.length === 0) {
    throw new Error('At least one medicine item must be specified for dispensing');
  }

  return await prisma.$transaction(async (tx) => {
    const dispensedDetails = [];

    for (const item of items) {
      const { medicineId, quantity } = item;
      const qty = parseInt(quantity);

      if (qty <= 0) {
        throw new Error('Dispense quantity must be greater than 0');
      }

      // Fetch current medicine record
      const medicine = await tx.medicine.findUnique({
        where: { id: medicineId }
      });

      if (!medicine) {
        throw new Error(`Medicine with ID ${medicineId} not found`);
      }

      if (medicine.quantity < qty) {
        throw new Error(
          `Insufficient inventory for ${medicine.name}. Requested: ${qty}, Available: ${medicine.quantity}`
        );
      }

      const newQty = medicine.quantity - qty;

      // Atomically deduct inventory
      const updatedMedicine = await tx.medicine.update({
        where: { id: medicineId },
        data: { quantity: newQty }
      });

      // Add to pharmacy billing invoice
      const dispenseRefId = `DISP_${Date.now()}_${medicineId.slice(0, 6)}`;
      const { invoice } = await addInvoiceLineItem({
        patientId,
        billingType: 'PHARMACY',
        sourceDepartment: 'PHARMACY',
        itemBillingType: 'MEDICINE',
        itemDescription: `${medicine.name} (Qty: ${qty})`,
        quantity: qty,
        unitPrice: medicine.unitPrice,
        medicineId: medicine.id,
        sourceEntity: 'PHARMACY_SALE',
        sourceId: dispenseRefId,
        prismaClient: tx
      });

      dispensedDetails.push({
        medicine: updatedMedicine,
        dispensedQuantity: qty,
        unitPrice: medicine.unitPrice,
        totalCost: qty * medicine.unitPrice
      });

      // Low-stock & Out-of-stock notification triggers
      if (newQty === 0) {
        await createNotification({
          role: 'PHARMACIST',
          title: 'Critical: Medicine Out of Stock',
          message: `${medicine.name} (${medicine.code}) is now OUT OF STOCK (0 units remaining).`,
          type: 'OUT_OF_STOCK',
          entityId: medicine.id,
          prismaClient: tx
        });
        await createNotification({
          role: 'ADMIN',
          title: 'Inventory Alert: Stock Exhausted',
          message: `${medicine.name} (${medicine.code}) has reached 0 units.`,
          type: 'OUT_OF_STOCK',
          entityId: medicine.id,
          prismaClient: tx
        });
      } else if (newQty <= medicine.reorderThreshold) {
        await createNotification({
          role: 'PHARMACIST',
          title: 'Low Medicine Stock Alert',
          message: `${medicine.name} (${medicine.code}) stock level is down to ${newQty} units (Reorder threshold: ${medicine.reorderThreshold}).`,
          type: 'LOW_STOCK',
          entityId: medicine.id,
          prismaClient: tx
        });
        await createNotification({
          role: 'ADMIN',
          title: 'Pharmacy Reorder Threshold Breached',
          message: `${medicine.name} (${medicine.code}) has dropped to ${newQty} units.`,
          type: 'LOW_STOCK',
          entityId: medicine.id,
          prismaClient: tx
        });
      }
    }

    // Record audit trail
    await logAudit({
      userId: dispensedByUserId,
      action: 'PHARMACY_DISPENSE',
      resource: 'PHARMACY',
      details: {
        patientId,
        itemsDispensed: dispensedDetails.map(d => ({
          name: d.medicine.name,
          quantity: d.dispensedQuantity,
          remaining: d.medicine.quantity
        }))
      },
      ipAddress,
      prismaClient: tx
    });

    return { success: true, dispensed: dispensedDetails };
  });
}

module.exports = {
  dispenseMedicinesTransaction
};
