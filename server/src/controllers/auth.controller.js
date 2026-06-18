const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const crypto = require('crypto');

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null },
    include: { user: { include: { role: true } } },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const accessToken = jwt.sign(
    { userId: storedToken.user.id, role: storedToken.user.role.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  res.json({ accessToken });
}

async function logout(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });

  res.json({ message: 'Logged out successfully' });
}

module.exports = { login, refresh, logout };