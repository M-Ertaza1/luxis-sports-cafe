const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getAuditLogs } = require('../controllers/audit.controller');

router.get('/', verifyToken, getAuditLogs);

module.exports = router;