const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;