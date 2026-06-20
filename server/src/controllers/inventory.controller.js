const prisma = require('../db');
const { emitChange } = require('../utils/realtime');
const { writeAuditLog } = require('../utils/audit');

async function createItem(req, res) {
  const { name, category, price, itemType, unit, reorderThreshold } = req.body;

  if (!name || !category || price == null || !itemType || !unit) {
    return res.status(400).json({ error: 'Missing required item fields' });
  }

  if (!['STOCK', 'FRESH_ON_DEMAND'].includes(itemType)) {
    return res.status(400).json({ error: 'itemType must be STOCK or FRESH_ON_DEMAND' });
  }

  const item = await prisma.inventoryItem.create({
    data: { name, category, price, itemType, unit, reorderThreshold: reorderThreshold ?? null },
  });

  await writeAuditLog({
    userId: req.user.userId,
    actionType: 'CREATE',
    entityType: 'InventoryItem',
    entityId: item.id,
    newValue: item,
  });
  emitChange('InventoryItem', 'CREATE', item);
  res.status(201).json(item);
}

async function getItems(req, res) {
  const { itemType, category } = req.query;

  const where = {};
  if (itemType) where.itemType = itemType;
  if (category) where.category = category;

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  res.json(items);
}

async function getItemById(req, res) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
    include: {
      stockLevels: true,
      usedAsFinishedIn: {
        include: { ingredientItem: { select: { name: true, unit: true } } },
      },
    },
  });

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
}

async function updateItem(req, res) {
  const { id } = req.params;
  const { name, category, price, unit, reorderThreshold } = req.body;

  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        category: category ?? existing.category,
        price: price ?? existing.price,
        unit: unit ?? existing.unit,
        reorderThreshold: reorderThreshold ?? existing.reorderThreshold,
      },
    });

    emitChange('InventoryItem', 'UPDATE', updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update item' });
  }
}

async function deleteItem(req, res) {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    emitChange('InventoryItem', 'DELETE', { id: req.params.id });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    return res.status(404).json({ error: 'Item not found' });
  }
}

async function adjustStock(req, res) {
  const { id } = req.params;
  const { kitchen, quantityChange } = req.body;

  if (!kitchen || quantityChange == null) {
    return res.status(400).json({ error: 'kitchen and quantityChange are required' });
  }

  if (!['MAIN', 'COUNTER'].includes(kitchen)) {
    return res.status(400).json({ error: 'kitchen must be MAIN or COUNTER' });
  }

  if (typeof quantityChange !== 'number') {
    return res.status(400).json({ error: 'quantityChange must be a number' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) {
        throw new Error('NOT_FOUND');
      }
      if (item.itemType !== 'STOCK') {
        throw new Error('NOT_STOCK');
      }

      const existingStock = await tx.kitchenStock.findUnique({
        where: { itemId_kitchen: { itemId: id, kitchen } },
      });

      const currentQty = existingStock ? Number(existingStock.quantity) : 0;
      const newQty = currentQty + quantityChange;

      if (newQty < 0) {
        throw new Error('NEGATIVE');
      }

      const updatedStock = await tx.kitchenStock.upsert({
        where: { itemId_kitchen: { itemId: id, kitchen } },
        update: { quantity: newQty },
        create: { itemId: id, kitchen, quantity: newQty },
      });

      await writeAuditLog({
        userId: req.user.userId,
        actionType: 'STOCK_ADJUST',
        entityType: 'KitchenStock',
        entityId: updatedStock.id,
        previousValue: { quantity: currentQty },
        newValue: { quantity: newQty, kitchen, change: quantityChange },
      }, tx);

      return updatedStock;
    });

    emitChange('KitchenStock', 'STOCK_ADJUST', result);
    res.json(result);
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Item not found' });
    if (err.message === 'NOT_STOCK') return res.status(400).json({ error: 'Cannot adjust stock for a fresh-on-demand item' });
    if (err.message === 'NEGATIVE') return res.status(400).json({ error: 'Adjustment would make stock negative' });
    console.error(err);
    return res.status(500).json({ error: 'Could not adjust stock' });
  }
}

async function getItemStock(req, res) {
  const stock = await prisma.kitchenStock.findMany({
    where: { itemId: req.params.id },
  });
  res.json(stock);
}

async function getAllStock(req, res) {
  try {
    const stock = await prisma.kitchenStock.findMany({
      include: {
        item: { select: { name: true, unit: true, category: true } },
      },
      orderBy: { item: { name: 'asc' } },
    });

    const main = [];
    const counter = [];
    for (const row of stock) {
      const entry = {
        itemId: row.itemId,
        name: row.item?.name || 'Unknown',
        unit: row.item?.unit || '',
        quantity: Number(row.quantity),
      };
      if (row.kitchen === 'MAIN') main.push(entry);
      else if (row.kitchen === 'COUNTER') counter.push(entry);
    }

    res.json({ main, counter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load stock' });
  }
}

async function addRecipeItem(req, res) {
  const { id } = req.params; // the finished (fresh) item
  const { ingredientItemId, quantityRequired } = req.body;

  if (!ingredientItemId || quantityRequired == null) {
    return res.status(400).json({ error: 'ingredientItemId and quantityRequired are required' });
  }

  if (typeof quantityRequired !== 'number' || quantityRequired <= 0) {
    return res.status(400).json({ error: 'quantityRequired must be a positive number' });
  }

  try {
    const finished = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!finished) return res.status(404).json({ error: 'Finished item not found' });
    if (finished.itemType !== 'FRESH_ON_DEMAND') {
      return res.status(400).json({ error: 'Recipes can only be added to fresh-on-demand items' });
    }

    const ingredient = await prisma.inventoryItem.findUnique({ where: { id: ingredientItemId } });
    if (!ingredient) return res.status(404).json({ error: 'Ingredient item not found' });
    if (ingredient.itemType !== 'STOCK') {
      return res.status(400).json({ error: 'Ingredients must be stock items' });
    }

    if (id === ingredientItemId) {
      return res.status(400).json({ error: 'An item cannot be its own ingredient' });
    }

    const recipeItem = await prisma.itemRecipe.create({
      data: { finishedItemId: id, ingredientItemId, quantityRequired },
    });

    res.status(201).json(recipeItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not add recipe item' });
  }
}

async function getRecipe(req, res) {
  const recipe = await prisma.itemRecipe.findMany({
    where: { finishedItemId: req.params.id },
    include: { ingredientItem: { select: { name: true, unit: true } } },
  });
  res.json(recipe);
}

async function removeRecipeItem(req, res) {
  try {
    await prisma.itemRecipe.delete({ where: { id: req.params.recipeId } });
    res.json({ message: 'Recipe item removed' });
  } catch (err) {
    return res.status(404).json({ error: 'Recipe item not found' });
  }
}

module.exports = { createItem, getItems, getItemById, updateItem, deleteItem, adjustStock, getItemStock, getAllStock, addRecipeItem, getRecipe, removeRecipeItem };