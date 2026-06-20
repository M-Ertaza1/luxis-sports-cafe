const prisma = require('../db');

const { writeAuditLog } = require('../utils/audit');

const { emitChange } = require('../utils/realtime');

async function createBooking(req, res) {
  const {
    arenaId,
    customerName,
    customerPhone,
    bookingDate,
    startTime,
    endTime,
    paymentStatus,
    notes,
  } = req.body;

  if (!arenaId || !customerName || !customerPhone || !bookingDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // No past date
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (bookingDate < todayStr) {
    return res.status(400).json({ error: 'Cannot create a booking in the past' });
  }

  // If booking is today, the start time must be in the future
  if (bookingDate === todayStr) {
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    if (startTime <= currentTime) {
      return res.status(400).json({ error: 'Start time must be in the future for a booking today' });
    }
  }

  // Status follows payment: paid -> CONFIRMED, unpaid -> WAITING_PAYMENT
  const finalPayment = paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';
  const derivedStatus = finalPayment === 'PAID' ? 'CONFIRMED' : 'WAITING_PAYMENT';

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const arena = await tx.arena.findUnique({ where: { id: arenaId } });
      if (!arena) {
        throw new Error('ARENA_NOT_FOUND');
      }

      const overlap = await tx.booking.findFirst({
        where: {
          arenaId,
          bookingDate: new Date(bookingDate),
          bookingStatus: { not: 'CANCELLED' },
          startTime: { lt: new Date(`1970-01-01T${endTime}:00Z`) },
          endTime: { gt: new Date(`1970-01-01T${startTime}:00Z`) },
        },
      });

      if (overlap) {
        throw new Error('OVERLAP');
      }

      const hours =
        (new Date(`1970-01-01T${endTime}:00Z`) - new Date(`1970-01-01T${startTime}:00Z`)) /
        (1000 * 60 * 60);
      const price = Number(arena.hourlyRate) * hours;

      const created = await tx.booking.create({
        data: {
          arenaId,
          customerName,
          customerPhone,
          bookingDate: new Date(bookingDate),
          startTime: new Date(`1970-01-01T${startTime}:00Z`),
          endTime: new Date(`1970-01-01T${endTime}:00Z`),
          paymentStatus: finalPayment,
          bookingStatus: derivedStatus,
          notes: notes || null,
          price,
          createdById: req.user.userId,
        },
      });

      await writeAuditLog({
        userId: req.user.userId,
        actionType: 'CREATE',
        entityType: 'Booking',
        entityId: created.id,
        newValue: created,
      }, tx);

      return created;
    });

    emitChange('Booking', 'CREATE', booking);
    res.status(201).json(booking);
  } catch (err) {
    if (err.message === 'ARENA_NOT_FOUND') {
      return res.status(404).json({ error: 'Arena not found' });
    }
    if (err.message === 'OVERLAP') {
      return res.status(409).json({ error: 'This time slot overlaps an existing booking for this arena' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not create booking' });
  }
}

async function getBookings(req, res) {
  const { date, arenaId } = req.query;

  const where = {};
  if (date) where.bookingDate = new Date(date);
  if (arenaId) where.arenaId = arenaId;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      arena: { select: { name: true, sportType: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
  });

  res.json(bookings);
}

async function getBookingById(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      arena: { select: { name: true, sportType: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json(booking);
}

async function updateBooking(req, res) {
  const { id } = req.params;
  const {
    customerName,
    customerPhone,
    bookingDate,
    startTime,
    endTime,
    paymentStatus,
    bookingStatus,
    notes,
  } = req.body;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // Completed bookings are frozen
      if (existing.bookingStatus === 'COMPLETED') {
        throw new Error('COMPLETED_LOCKED');
      }

      // Determine the resulting payment status (default to existing)
      const newPayment = paymentStatus ?? existing.paymentStatus;

      // Cancellation only allowed while unpaid
      const wantsToCancel = bookingStatus === 'CANCELLED';
      if (wantsToCancel && newPayment === 'PAID') {
        throw new Error('PAID_CANCEL');
      }

      // No moving a booking's date into the past
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      if (bookingDate && bookingDate < todayStr) {
        throw new Error('PAST_DATE');
      }
      if (bookingDate === todayStr && startTime) {
        const currentTime = now.toTimeString().slice(0, 5);
        if (startTime <= currentTime) {
          throw new Error('PAST_TIME');
        }
      }

      const newDate = bookingDate ? new Date(bookingDate) : existing.bookingDate;
      const newStart = startTime
        ? new Date(`1970-01-01T${startTime}:00Z`)
        : existing.startTime;
      const newEnd = endTime ? new Date(`1970-01-01T${endTime}:00Z`) : existing.endTime;

      if (newStart >= newEnd) {
        throw new Error('BAD_TIMES');
      }

      const overlap = await tx.booking.findFirst({
        where: {
          id: { not: id },
          arenaId: existing.arenaId,
          bookingDate: newDate,
          bookingStatus: { not: 'CANCELLED' },
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
        },
      });

      if (overlap) {
        throw new Error('OVERLAP');
      }

      // Decide the resulting status:
      // - explicit CANCELLED or COMPLETED requests are honored (admin actions)
      // - otherwise status follows payment (paid -> CONFIRMED, unpaid -> WAITING_PAYMENT)
      let newStatus;
      if (bookingStatus === 'CANCELLED' || bookingStatus === 'COMPLETED') {
        newStatus = bookingStatus;
      } else {
        newStatus = newPayment === 'PAID' ? 'CONFIRMED' : 'WAITING_PAYMENT';
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          customerName: customerName ?? existing.customerName,
          customerPhone: customerPhone ?? existing.customerPhone,
          bookingDate: newDate,
          startTime: newStart,
          endTime: newEnd,
          paymentStatus: newPayment,
          bookingStatus: newStatus,
          notes: notes ?? existing.notes,
        },
      });

      await writeAuditLog({
        userId: req.user.userId,
        actionType: 'UPDATE',
        entityType: 'Booking',
        entityId: id,
        previousValue: existing,
        newValue: updatedBooking,
      }, tx);

      return updatedBooking;
    });

    emitChange('Booking', 'UPDATE', updated);
    res.json(updated);
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Booking not found' });
    if (err.message === 'BAD_TIMES') return res.status(400).json({ error: 'End time must be after start time' });
    if (err.message === 'OVERLAP') return res.status(409).json({ error: 'This time slot overlaps an existing booking for this arena' });
    if (err.message === 'PAID_CANCEL') return res.status(400).json({ error: 'Cannot cancel a paid booking' });
    if (err.message === 'COMPLETED_LOCKED') return res.status(400).json({ error: 'A completed booking cannot be edited' });
    if (err.message === 'PAST_DATE') return res.status(400).json({ error: 'Cannot move a booking to a past date' });
    if (err.message === 'PAST_TIME') return res.status(400).json({ error: 'Start time must be in the future for a booking today' });

    console.error(err);
    return res.status(500).json({ error: 'Could not update booking' });
  }
}

async function deleteBooking(req, res) {
  try {
    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.delete({ where: { id: req.params.id } });

    await writeAuditLog({
      userId: req.user.userId,
      actionType: 'DELETE',
      entityType: 'Booking',
      entityId: req.params.id,
      previousValue: existing,
    });

    emitChange('Booking', 'DELETE', { id: req.params.id });
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    return res.status(404).json({ error: 'Booking not found' });
  }
}

module.exports = { createBooking, getBookings, getBookingById, updateBooking, deleteBooking };