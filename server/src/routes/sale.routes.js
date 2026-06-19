const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { createSale, getSales } = require('../controllers/sale.controller');

router.post('/', verifyToken, createSale);
router.get('/', verifyToken, getSales);

module.exports = router;