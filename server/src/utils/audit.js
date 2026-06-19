const prisma = require('../db');

async function writeAuditLog({ userId, actionType, entityType, entityId, previousValue, newValue }, tx) {
  const client = tx || prisma;
  try {
    await client.auditLog.create({
      data: {
        userId,
        actionType,
        entityType,
        entityId,
        previousValue: previousValue ?? undefined,
        newValue: newValue ?? undefined,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = { writeAuditLog };