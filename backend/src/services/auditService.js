const prisma = require('../config/db');

/**
 * Creates an immutable audit log entry.
 * Fails safely if logging encounters a transient error to avoid crashing the main transaction
 * unless strictly required by compliance configuration.
 */
async function logAudit({ userId, action, resource, details, ipAddress, prismaClient = prisma }) {
  try {
    return await prismaClient.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress: ipAddress || null
      }
    });
  } catch (err) {
    console.error(`[AUDIT_LOG_ERROR] Failed to record audit log for action: ${action}`, err.message);
    return null;
  }
}

module.exports = {
  logAudit
};
