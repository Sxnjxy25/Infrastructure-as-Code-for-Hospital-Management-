const prisma = require('../config/db');

/**
 * Creates role-based or user-specific notifications with deduplication.
 */
async function createNotification({ role, userId, title, message, type, entityId, prismaClient = prisma }) {
  try {
    // Deduplication check: check if an unread notification of the same type and entityId exists in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existing = await prismaClient.notification.findFirst({
      where: {
        role: role || null,
        userId: userId || null,
        type,
        entityId: entityId || null,
        isRead: false,
        createdAt: { gte: fifteenMinutesAgo }
      }
    });

    if (existing) {
      return existing; // Avoid spamming duplicate alerts
    }

    return await prismaClient.notification.create({
      data: {
        role: role || null,
        userId: userId || null,
        title,
        message,
        type,
        entityId: entityId || null
      }
    });
  } catch (err) {
    console.error(`[NOTIFICATION_ERROR] Failed to dispatch notification: ${title}`, err.message);
    return null;
  }
}

module.exports = {
  createNotification
};
