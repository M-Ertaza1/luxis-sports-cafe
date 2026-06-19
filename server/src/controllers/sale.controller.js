const prisma = require('../db');

async function createSale(req, res) {
  const { itemId, kitchen, quantity } = req.body;

  if (!itemId || !kitchen || quantity == null) {
    return res.status(400).json({ error: 'itemId, kitchen, and quantity are required' });
  }

  if (!['MAIN', 'COUNTER'].includes(kitchen)) {
    return res.status(400).json({ error: 'kitchen must be MAIN or COUNTER' });
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new Error('NOT_FOUND');
      }

      if (item.itemType === 'STOCK') {
        // Deduct the item itself from the kitchen's stock
        const stock = await tx.kitchenStock.findUnique({
          where: { itemId_kitchen: { itemId, kitchen } },
        });
        const available = stock ? Number(stock.quantity) : 0;
        if (available < quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }
        await tx.kitchenStock.update({
          where: { itemId_kitchen: { itemId, kitchen } },
          data: { quantity: available - quantity },
        });
      } else {
        // FRESH_ON_DEMAND: deduct each recipe ingredient from the kitchen's stock
        const recipe = await tx.itemRecipe.findMany({
          where: { finishedItemId: itemId },
          include: { ingredientItem: { select: { name: true } } },
        });

        if (recipe.length === 0) {
          throw new Error('NO_RECIPE');
        }

        // First pass: check every ingredient has enough
        for (const line of recipe) {
          const needed = Number(line.quantityRequired) * quantity;
          const stock = await tx.kitchenStock.findUnique({
            where: { itemId_kitchen: { itemId: line.ingredientItemId, kitchen } },
          });
          const available = stock ? Number(stock.quantity) : 0;
          if (available < needed) {
            throw new Error(`INSUFFICIENT_INGREDIENT:${line.ingredientItem.name}`);
          }
        }

        // Second pass: deduct them all
        for (const line of recipe) {
          const needed = Number(line.quantityRequired) * quantity;
          const stock = await tx.kitchenStock.findUnique({
            where: { itemId_kitchen: { itemId: line.ingredientItemId, kitchen } },
          });
          await tx.kitchenStock.update({
            where: { itemId_kitchen: { itemId: line.ingredientItemId, kitchen } },
            data: { quantity: Number(stock.quantity) - needed },
          });
        }
      }

      const unitPrice = Number(item.price);
      const totalAmount = unitPrice * quantity;

      return tx.sale.create({
        data: {
          itemId,
          kitchen,
          quantity,
          unitPrice,
          totalAmount,
          soldById: req.user.userId,
        },
      });
    });

    res.status(201).json(sale);
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Item not found' });
    if (err.message === 'INSUFFICIENT_STOCK') return res.status(400).json({ error: 'Not enough stock in this kitchen for the sale' });
    if (err.message === 'NO_RECIPE') return res.status(400).json({ error: 'This fresh item has no recipe defined, so its ingredients cannot be deducted' });
    if (err.message.startsWith('INSUFFICIENT_INGREDIENT:')) {
      const ingredientName = err.message.split(':')[1];
      return res.status(400).json({ error: `Not enough ${ingredientName} in this kitchen to make the sale` });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not record sale' });
  }
}

async function getSales(req, res) {
  const { kitchen } = req.query;
  const where = {};
  if (kitchen) where.kitchen = kitchen;

  const sales = await prisma.sale.findMany({
    where,
    include: {
      item: { select: { name: true, itemType: true } },
      soldBy: { select: { name: true } },
    },
    orderBy: { soldAt: 'desc' },
  });
  res.json(sales);
}

module.exports = { createSale, getSales };