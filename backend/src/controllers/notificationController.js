const prisma = require('../config/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    // Fetch notifications targeting the user's role OR their specific userId
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { role: role },
          { userId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { role: role },
          { userId: userId }
        ],
        isRead: false
      }
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        OR: [
          { role: role },
          { userId: userId }
        ],
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
