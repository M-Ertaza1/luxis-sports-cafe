const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { getUsers, createUser, deleteUser } = require('../controllers/user.controller');

router.get('/', verifyToken, requirePermission('user.read'), getUsers);
router.post('/', verifyToken, requirePermission('user.create'), createUser);
router.delete('/:id', verifyToken, requirePermission('user.delete'), deleteUser);

module.exports = router;