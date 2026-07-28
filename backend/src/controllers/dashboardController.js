const prisma = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const [patientCount, doctorCount, appointmentCount, pendingLabCount, lowStockMedicineCount, paidInvoices] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      prisma.labTest.count({ where: { status: 'PENDING' } }),
      prisma.medicine.count({ where: { quantity: { lte: 20 } } }),
      prisma.invoice.findMany({ where: { status: 'PAID' }, select: { netAmount: true } })
    ]);

    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + Number(inv.netAmount), 0);

    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { patient: true, doctor: { include: { user: { select: { name: true } } } } }
    });

    res.json({
      success: true,
      stats: {
        totalPatients: patientCount,
        totalDoctors: doctorCount,
        activeAppointments: appointmentCount,
        pendingLabTests: pendingLabCount,
        lowStockMedicines: lowStockMedicineCount,
        totalRevenue: totalRevenue.toFixed(2)
      },
      recentAppointments
    });
  } catch (err) {
    next(err);
  }
};
