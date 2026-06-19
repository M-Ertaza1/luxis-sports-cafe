const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getDashboard } = require('../controllers/dashboard.controller');

router.get('/', verifyToken, getDashboard);

module.exports = router;