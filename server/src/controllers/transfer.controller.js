const prisma = require('../db');
const { writeAuditLog } = require('../utils/audit');

async function createTransfer(req, res) {
  const { itemId, quantity } = req.body;

  if (!itemId || quantity == null) {
    return res.status(400).json({ error: 'itemId and quantity are required' });
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }

  // Business rule: transfers only ever go Main -> Counter
  const fromKitchen = 'MAIN';
  const toKitchen = 'COUNTER';

  try {
    const transfer = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new Error('NOT_FOUND');
      }
      if (item.itemType !== 'STOCK') {
        throw new Error('NOT_STOCK');
      }

      const sourceStock = await tx.kitchenStock.findUnique({
        where: { itemId_kitchen: { itemId, kitchen: fromKitchen } },
      });

      const sourceQty = sourceStock ? Number(sourceStock.quantity) : 0;
      if (sourceQty < quantity) {
        throw new Error('INSUFFICIENT');
      }

      // Deduct from Main
      await tx.kitchenStock.update({
        where: { itemId_kitchen: { itemId, kitchen: fromKitchen } },
        data: { quantity: sourceQty - quantity },
      });

      // Add to Counter (create the row if Counter has never held this item before)
      const destStock = await tx.kitchenStock.findUnique({
        where: { itemId_kitchen: { itemId, kitchen: toKitchen } },
      });
      const destQty = destStock ? Number(destStock.quantity) : 0;

      await tx.kitchenStock.upsert({
        where: { itemId_kitchen: { itemId, kitchen: toKitchen } },
        update: { quantity: destQty + quantity },
        create: { itemId, kitchen: toKitchen, quantity: quantity },
      });

      // Record the transfer
      const transferRecord = await tx.kitchenTransfer.create({
        data: {
          itemId,
          quantity,
          fromKitchen,
          toKitchen,
          transferredById: req.user.userId,
        },
      });

      await writeAuditLog({
        userId: req.user.userId,
        actionType: 'TRANSFER',
        entityType: 'KitchenTransfer',
        entityId: transferRecord.id,
        newValue: { itemId, quantity, fromKitchen, toKitchen },
      }, tx);

      return transferRecord;
    });

    res.status(201).json(transfer);
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Item not found' });
    if (err.message === 'NOT_STOCK') return res.status(400).json({ error: 'Only stock items can be transferred' });
    if (err.message === 'INSUFFICIENT') return res.status(400).json({ error: 'Not enough stock in Main Kitchen for this transfer' });
    console.error(err);
    return res.status(500).json({ error: 'Could not complete transfer' });
  }
}

async function getTransfers(req, res) {
  const transfers = await prisma.kitchenTransfer.findMany({
    include: {
      item: { select: { name: true, unit: true } },
      transferredBy: { select: { name: true } },
    },
    orderBy: { transferredAt: 'desc' },
  });
  res.json(transfers);
}

module.exports = { createTransfer, getTransfers };