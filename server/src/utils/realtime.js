const { getIo } = require('../socket');

function emitChange(entityType, action, data) {
  const io = getIo();
  if (!io) return;
  io.emit('change', { entityType, action, data });
}

module.exports = { emitChange };