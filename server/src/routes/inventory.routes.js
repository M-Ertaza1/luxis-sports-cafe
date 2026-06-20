const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  adjustStock,
  getItemStock,
  getAllStock,
  addRecipeItem,
  getRecipe,
  removeRecipeItem,
} = require('../controllers/inventory.controller');

router.post('/', verifyToken, requirePermission('inventory.create'), createItem);
router.get('/', verifyToken, getItems);
router.get('/stock/all', verifyToken, getAllStock);
router.get('/:id', verifyToken, getItemById);
router.put('/:id', verifyToken, requirePermission('inventory.update'), updateItem);
router.delete('/:id', verifyToken, requirePermission('inventory.delete'), deleteItem);
router.post('/:id/stock', verifyToken, requirePermission('stock.adjust'), adjustStock);
router.get('/:id/stock', verifyToken, getItemStock);
router.post('/:id/recipe', verifyToken, requirePermission('recipe.manage'), addRecipeItem);
router.get('/:id/recipe', verifyToken, getRecipe);
router.delete('/recipe/:recipeId', verifyToken, requirePermission('recipe.manage'), removeRecipeItem);

module.exports = router;