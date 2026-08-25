const prisma = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Global Base Counts
    const [
      patientCount,
      allDoctors,
      allStaff,
      allMedicines,
      allAppointments,
      allLabTests,
      allInvoices,
      allPayments
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.findMany({ include: { user: true } }),
      prisma.staffProfile.findMany({ include: { department: true } }),
      prisma.medicine.findMany(),
      prisma.appointment.findMany({
        include: { patient: true, doctor: { include: { user: true } } },
        orderBy: [{ tokenNumber: 'asc' }, { appointmentDate: 'asc' }]
      }),
      prisma.labTest.findMany({ include: { patient: true } }),
      prisma.invoice.findMany({ include: { items: true, patient: true } }),
      prisma.payment.findMany({ include: { invoice: true } })
    ]);

    // Staff categorizations
    const doctorsTotal = allStaff.filter(s => s.category === 'DOCTOR').length || allDoctors.length;
    const doctorsAvailable = allStaff.filter(s => s.category === 'DOCTOR' && s.availability === 'AVAILABLE').length || allDoctors.filter(d => d.availability === 'AVAILABLE').length;

    const nursesTotal = allStaff.filter(s => s.category === 'NURSE').length;
    const nursesAvailable = allStaff.filter(s => s.category === 'NURSE' && (s.availability === 'AVAILABLE' || s.availability === 'ON_DUTY')).length;

    const techStaffTotal = allStaff.filter(s => s.category === 'TECHNICAL_STAFF').length;
    const techStaffAvailable = allStaff.filter(s => s.category === 'TECHNICAL_STAFF' && s.availability === 'AVAILABLE').length;

    const cleanersTotal = allStaff.filter(s => s.category === 'CLEANER').length;
    const cleanersAvailable = allStaff.filter(s => s.category === 'CLEANER' && s.availability === 'AVAILABLE').length;

    // Medicine Inventory
    const totalStockUnits = allMedicines.reduce((sum, m) => sum + m.quantity, 0);
    const lowStockMedicines = allMedicines.filter(m => m.quantity > 0 && m.quantity <= m.reorderThreshold);
    const outOfStockMedicines = allMedicines.filter(m => m.quantity === 0);

    // Financial calculations
    const paidInvoices = allInvoices.filter(i => i.status === 'PAID' || i.status === 'PARTIALLY_PAID');
    const pendingInvoices = allInvoices.filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID');

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayRevenue = allPayments
      .filter(p => new Date(p.createdAt) >= startOfToday)
      .reduce((sum, p) => sum + p.amount, 0);
    const monthlyRevenue = allPayments
      .filter(p => new Date(p.createdAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    // Department revenues from line items
    let receptionRevenue = 0;
    let pharmacyRevenue = 0;
    let labRevenue = 0;

    allInvoices.forEach(inv => {
      if (inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID') {
        inv.items.forEach(itm => {
          if (itm.sourceDepartment === 'PHARMACY') pharmacyRevenue += itm.totalPrice;
          else if (itm.sourceDepartment === 'LABORATORY') labRevenue += itm.totalPrice;
          else receptionRevenue += itm.totalPrice;
        });
      }
    });

    // Recent Appointments (up to 50 for multi-doctor panels)
    const recentAppointments = allAppointments.slice(0, 50);

    // Role-specific stats object
    const roleStats = {
      userRole,
      // Common Metrics
      totalPatients: patientCount,
      totalDoctors: doctorsTotal,
      activeDoctors: doctorsAvailable,
      scheduledAppointments: allAppointments.filter(a => a.status === 'SCHEDULED').length,
      pendingLabTests: allLabTests.filter(t => t.status === 'PENDING').length,
      completedLabTests: allLabTests.filter(t => t.status === 'COMPLETED').length,
      lowStockCount: lowStockMedicines.length,
      outOfStockCount: outOfStockMedicines.length,
      totalRevenue: totalRevenue.toFixed(2),
      todayRevenue: todayRevenue.toFixed(2),
      monthlyRevenue: monthlyRevenue.toFixed(2),

      // Admin & HR Breakdown
      staffBreakdown: {
        doctors: { total: doctorsTotal, available: doctorsAvailable },
        nurses: { total: nursesTotal, available: nursesAvailable },
        technicalStaff: { total: techStaffTotal, available: techStaffAvailable },
        cleaners: { total: cleanersTotal, available: cleanersAvailable }
      },

      // Department Revenues
      departmentRevenue: {
        reception: receptionRevenue.toFixed(2),
        pharmacy: pharmacyRevenue.toFixed(2),
        laboratory: labRevenue.toFixed(2),
        total: totalRevenue.toFixed(2)
      },

      // Pharmacy Metrics
      pharmacy: {
        totalItems: allMedicines.length,
        totalStockUnits,
        lowStockItems: lowStockMedicines,
        outOfStockItems: outOfStockMedicines,
        todaySales: allInvoices.filter(i => i.billingType === 'PHARMACY' && new Date(i.createdAt) >= startOfToday).length,
        todayRevenue: pharmacyRevenue.toFixed(2)
      },

      // Laboratory Metrics
      laboratory: {
        pending: allLabTests.filter(t => t.status === 'PENDING').length,
        processing: allLabTests.filter(t => t.status === 'PROCESSING').length,
        completed: allLabTests.filter(t => t.status === 'COMPLETED').length,
        todayCompleted: allLabTests.filter(t => t.status === 'COMPLETED' && new Date(t.updatedAt) >= startOfToday).length
      },

      // Billing Metrics
      billing: {
        paidInvoicesCount: paidInvoices.length,
        pendingInvoicesCount: pendingInvoices.length,
        totalPendingAmount: pendingInvoices.reduce((sum, i) => sum + (i.netAmount - (i.paidAmount || 0)), 0).toFixed(2),
        todayReceptionBills: allInvoices.filter(i => i.billingType === 'RECEPTION' && new Date(i.createdAt) >= startOfToday).length,
        todayPharmacyBills: allInvoices.filter(i => i.billingType === 'PHARMACY' && new Date(i.createdAt) >= startOfToday).length
      }
    };

    // If DOCTOR, attach doctor-specific queue
    if (userRole === 'DOCTOR') {
      const myDoc = allDoctors.find(d => d.userId === userId);
      const myDoctorId = myDoc?.id;
      const myAppointments = allAppointments.filter(a => a.doctorId === myDoctorId);

      roleStats.doctorQueue = {
        doctorId: myDoctorId,
        doctorAvailability: myDoc?.availability || 'AVAILABLE',
        waitingCount: myAppointments.filter(a => a.status === 'SCHEDULED').length,
        inProgressCount: myAppointments.filter(a => a.status === 'IN_PROGRESS').length,
        completedToday: myAppointments.filter(a => a.status === 'COMPLETED' && new Date(a.updatedAt) >= startOfToday).length,
        onlineCount: myAppointments.filter(a => a.channel === 'ONLINE').length,
        offlineCount: myAppointments.filter(a => a.channel === 'OFFLINE').length,
        pendingLabResults: allLabTests.filter(t => t.status === 'PENDING').length
      };
    }

    res.json({
      success: true,
      stats: roleStats,
      recentAppointments
    });
  } catch (err) {
    next(err);
  }
};
