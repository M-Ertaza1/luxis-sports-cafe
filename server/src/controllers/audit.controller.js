const prisma = require('../db');

async function getAuditLogs(req, res) {
  const { entityType, entityId, from, to } = req.query;
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from + 'T00:00:00');
    }
    if (to) {
      where.createdAt.lte = new Date(to + 'T23:59:59');
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
}

module.exports = { getAuditLogs };