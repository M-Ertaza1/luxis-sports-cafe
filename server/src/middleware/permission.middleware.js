const { hasPermission } = require('../permissions');

function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!hasPermission(role, permission)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

module.exports = { requirePermission };