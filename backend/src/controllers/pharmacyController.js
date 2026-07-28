const prisma = require('../config/db');

exports.getInventory = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
};

exports.addMedicine = async (req, res, next) => {
  try {
    const { code, name, category, quantity, unitPrice, expiryDate, supplier } = req.body;
    const medicine = await prisma.medicine.create({
      data: {
        code,
        name,
        category,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        expiryDate: new Date(expiryDate),
        supplier
      }
    });
    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const medicine = await prisma.medicine.update({
      where: { id: req.params.id },
      data: { quantity: parseInt(quantity) }
    });
    res.json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};
