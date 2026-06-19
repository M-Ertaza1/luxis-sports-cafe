const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { createTransfer, getTransfers } = require('../controllers/transfer.controller');

router.post('/', verifyToken, createTransfer);
router.get('/', verifyToken, getTransfers);

module.exports = router;