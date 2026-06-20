const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { createSale, getSales } = require('../controllers/sale.controller');

router.post('/', verifyToken, requirePermission('sale.create'), createSale);
router.get('/', verifyToken, getSales);

module.exports = router;