const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getDashboard, getAnalytics } = require('../controllers/dashboard.controller');

router.get('/', verifyToken, getDashboard);
router.get('/analytics', verifyToken, getAnalytics);

module.exports = router;