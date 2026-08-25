const prisma = require('../config/db');
const { dispenseMedicinesTransaction } = require('../services/pharmacyService');
const { logAudit } = require('../services/auditService');

exports.getInventory = async (req, res, next) => {
  try {
    const { category, search, lowStockOnly } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { supplier: { contains: search } }
      ];
    }

    let medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    if (lowStockOnly === 'true') {
      medicines = medicines.filter(m => m.quantity <= m.reorderThreshold);
    }

    res.json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
};

exports.addMedicine = async (req, res, next) => {
  try {
    const { code, name, category, quantity, unitPrice, reorderThreshold = 20, expiryDate, supplier } = req.body;

    if (!code || !name || !unitPrice || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Code, Name, Quantity, and Unit Price are required' });
    }

    const medicine = await prisma.medicine.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category || 'General',
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        reorderThreshold: parseInt(reorderThreshold),
        expiryDate: new Date(expiryDate || '2028-12-31'),
        supplier: supplier?.trim() || null
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADD_MEDICINE',
      resource: 'PHARMACY',
      details: { code: medicine.code, name: medicine.name, quantity: medicine.quantity },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Medicine item code already exists' });
    }
    next(err);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, reorderThreshold, unitPrice } = req.body;
    const { id } = req.params;

    const data = {};
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (reorderThreshold !== undefined) data.reorderThreshold = parseInt(reorderThreshold);
    if (unitPrice !== undefined) data.unitPrice = parseFloat(unitPrice);

    const medicine = await prisma.medicine.update({
      where: { id },
      data
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_MEDICINE_STOCK',
      resource: 'PHARMACY',
      details: { id, name: medicine.name, newQuantity: medicine.quantity },
      ipAddress: req.ip
    });

    res.json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

exports.dispenseMedicines = async (req, res, next) => {
  try {
    const { patientId, items } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and an array of items to dispense are required' });
    }

    const result = await dispenseMedicinesTransaction({
      patientId,
      items,
      dispensedByUserId: req.user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Medicines dispensed, inventory deducted atomically, and billing line created',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { quantity: 'asc' }
    });

    const lowStock = medicines.filter(m => m.quantity <= m.reorderThreshold);
    res.json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
};
