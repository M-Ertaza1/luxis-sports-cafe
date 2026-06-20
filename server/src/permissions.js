const permissions = {
  SUPER_ADMIN: [
    'booking.create', 'booking.update', 'booking.delete',
    'inventory.create', 'inventory.update', 'inventory.delete',
    'stock.adjust', 'recipe.manage',
    'transfer.create',
    'sale.create',
    'arena.update',
    'user.create', 'user.read', 'user.update', 'user.delete',
  ],
  SECONDARY_ADMIN: [
    'booking.create', 'booking.update',
    'inventory.create', 'inventory.update',
    'stock.adjust', 'recipe.manage',
    'transfer.create',
    'sale.create',
  ],
  VIEWER: [],
};

function hasPermission(role, permission) {
  const rolePerms = permissions[role] || [];
  return rolePerms.includes(permission);
}

module.exports = { permissions, hasPermission };