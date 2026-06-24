const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { getUsers, createUser, deleteUser, changePassword, changeEmail, changeName } = require('../controllers/user.controller');

// Self-service account routes (any logged-in user, their own account)
router.put('/me/password', verifyToken, changePassword);
router.put('/me/email', verifyToken, changeEmail);
router.put('/me/name', verifyToken, changeName);

// User management (Super Admin only)
router.get('/', verifyToken, requirePermission('user.read'), getUsers);
router.post('/', verifyToken, requirePermission('user.create'), createUser);
router.delete('/:id', verifyToken, requirePermission('user.delete'), deleteUser);

module.exports = router;