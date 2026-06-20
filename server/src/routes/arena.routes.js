const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const prisma = require('../db');
const { writeAuditLog } = require('../utils/audit');
const { emitChange } = require('../utils/realtime');

router.get('/', verifyToken, async (req, res) => {
  const arenas = await prisma.arena.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json(arenas);
});

router.put('/:id', verifyToken, requirePermission('arena.update'), async (req, res) => {
  const { id } = req.params;
  const { hourlyRate } = req.body;

  if (hourlyRate == null || typeof hourlyRate !== 'number' || hourlyRate < 0) {
    return res.status(400).json({ error: 'hourlyRate must be a non-negative number' });
  }

  const existing = await prisma.arena.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Arena not found' });
  }

  const updated = await prisma.arena.update({
    where: { id },
    data: { hourlyRate },
  });

  await writeAuditLog({
    userId: req.user.userId,
    actionType: 'UPDATE',
    entityType: 'Arena',
    entityId: id,
    previousValue: { hourlyRate: existing.hourlyRate },
    newValue: { hourlyRate: updated.hourlyRate },
  });

  emitChange('Arena', 'UPDATE', updated);
  res.json(updated);
});

module.exports = router;