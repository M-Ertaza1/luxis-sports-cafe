const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/booking.controller');

router.post('/', verifyToken, requirePermission('booking.create'), createBooking);
router.get('/', verifyToken, getBookings);
router.get('/:id', verifyToken, getBookingById);
router.put('/:id', verifyToken, requirePermission('booking.update'), updateBooking);
router.delete('/:id', verifyToken, requirePermission('booking.delete'), deleteBooking);

module.exports = router;