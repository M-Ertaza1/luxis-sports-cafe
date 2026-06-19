const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { writeAuditLog } = require('../utils/audit');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  adjustStock,
  getItemStock,
  addRecipeItem,
  getRecipe,
  removeRecipeItem,
} = require('../controllers/inventory.controller');

router.post('/', verifyToken, createItem);
router.get('/', verifyToken, getItems);
router.get('/:id', verifyToken, getItemById);
router.put('/:id', verifyToken, updateItem);
router.delete('/:id', verifyToken, deleteItem);
router.post('/:id/stock', verifyToken, adjustStock);
router.get('/:id/stock', verifyToken, getItemStock);
router.post('/:id/recipe', verifyToken, addRecipeItem);
router.get('/:id/recipe', verifyToken, getRecipe);
router.delete('/recipe/:recipeId', verifyToken, removeRecipeItem);

module.exports = router;