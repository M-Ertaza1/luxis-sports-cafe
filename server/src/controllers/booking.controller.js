const prisma = require('../db');

const { writeAuditLog } = require('../utils/audit');

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
          paymentStatus: paymentStatus || 'UNPAID',
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

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          customerName: customerName ?? existing.customerName,
          customerPhone: customerPhone ?? existing.customerPhone,
          bookingDate: newDate,
          startTime: newStart,
          endTime: newEnd,
          paymentStatus: paymentStatus ?? existing.paymentStatus,
          bookingStatus: bookingStatus ?? existing.bookingStatus,
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

    res.json(updated);
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Booking not found' });
    if (err.message === 'BAD_TIMES') return res.status(400).json({ error: 'End time must be after start time' });
    if (err.message === 'OVERLAP') return res.status(409).json({ error: 'This time slot overlaps an existing booking for this arena' });
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

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    return res.status(404).json({ error: 'Booking not found' });
  }
}

module.exports = { createBooking, getBookings, getBookingById, updateBooking, deleteBooking };