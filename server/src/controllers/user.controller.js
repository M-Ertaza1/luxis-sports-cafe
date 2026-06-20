const bcrypt = require('bcrypt');
const prisma = require('../db');
const { writeAuditLog } = require('../utils/audit');
const { emitChange } = require('../utils/realtime');

const ALLOWED_ROLES = ['SUPER_ADMIN', 'SECONDARY_ADMIN', 'VIEWER'];

async function getUsers(req, res) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) {
    return res.status(400).json({ error: 'Role does not exist in the system' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roleId: roleRecord.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });

  await writeAuditLog({
    userId: req.user.userId,
    actionType: 'CREATE',
    entityType: 'User',
    entityId: user.id,
    newValue: { name: user.name, email: user.email, role },
  });

  emitChange('User', 'CREATE', user);
  res.status(201).json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;

  if (id === req.user.userId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (target.role.name === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: { name: 'SUPER_ADMIN' } },
    });
    if (superAdminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last Super Admin' });
    }
  }

  await prisma.user.delete({ where: { id } });

  await writeAuditLog({
    userId: req.user.userId,
    actionType: 'DELETE',
    entityType: 'User',
    entityId: id,
    previousValue: { name: target.name, email: target.email, role: target.role.name },
  });

  emitChange('User', 'DELETE', { id });
  res.json({ message: 'User removed successfully' });
}

module.exports = { getUsers, createUser, deleteUser };