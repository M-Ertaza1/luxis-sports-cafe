const prisma = require('../db');

async function getDashboard(req, res) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // 1. Today's bookings
    const todaysBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: todayStart, lt: todayEnd },
        bookingStatus: { not: 'CANCELLED' },
      },
      include: { arena: { select: { name: true, sportType: true } } },
      orderBy: { startTime: 'asc' },
    });

    // 2. Upcoming bookings (future dates, next 10)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: todayEnd },
        bookingStatus: { not: 'CANCELLED' },
      },
      include: { arena: { select: { name: true, sportType: true } } },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
      take: 10,
    });

    // 3. Revenue summary (bookings + sales, combined and separate)
    const bookingRevenueAgg = await prisma.booking.aggregate({
      _sum: { price: true },
      where: { paymentStatus: 'PAID', bookingStatus: { not: 'CANCELLED' } },
    });
    const salesRevenueAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
    });
    const bookingRevenue = Number(bookingRevenueAgg._sum.price || 0);
    const salesRevenue = Number(salesRevenueAgg._sum.totalAmount || 0);

    // 4. Low-stock alerts (stock below the item's reorderThreshold, per kitchen)
    const itemsWithThreshold = await prisma.inventoryItem.findMany({
      where: { reorderThreshold: { not: null } },
      include: { stockLevels: true },
    });
    const lowStockAlerts = [];
    for (const item of itemsWithThreshold) {
      const threshold = Number(item.reorderThreshold);
      for (const stock of item.stockLevels) {
        if (Number(stock.quantity) < threshold) {
          lowStockAlerts.push({
            itemId: item.id,
            itemName: item.name,
            unit: item.unit,
            kitchen: stock.kitchen,
            quantity: Number(stock.quantity),
            threshold,
          });
        }
      }
    }

    // 5. Kitchen-wise sales summary
    const salesByKitchen = await prisma.sale.groupBy({
      by: ['kitchen'],
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    const kitchenSales = salesByKitchen.map((row) => ({
      kitchen: row.kitchen,
      totalSales: Number(row._sum.totalAmount || 0),
      transactionCount: row._count.id,
    }));

    // 6. Recent activity (last 10 audit entries)
    const recentActivity = await prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      todaysBookings,
      upcomingBookings,
      revenue: {
        total: bookingRevenue + salesRevenue,
        bookings: bookingRevenue,
        sales: salesRevenue,
      },
      lowStockAlerts,
      kitchenSales,
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard' });
  }
}

async function getAnalytics(req, res) {
  try {
    // period is the number of days to look back (default 30)
    const days = parseInt(req.query.period, 10) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Top-selling items by revenue (with quantity), within the period
    const salesByItem = await prisma.sale.groupBy({
      by: ['itemId'],
      where: { soldAt: { gte: since } },
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    // Fetch the item names for those ids
    const itemIds = salesByItem.map((s) => s.itemId);
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, unit: true },
    });
    const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

    const topItems = salesByItem.map((s) => ({
      itemId: s.itemId,
      name: itemMap[s.itemId]?.name || 'Unknown',
      unit: itemMap[s.itemId]?.unit || '',
      revenue: Number(s._sum.totalAmount || 0),
      quantity: Number(s._sum.quantity || 0),
    }));

    // Most-booked arenas by booking count (with revenue), within the period
    // Count non-cancelled bookings created in the period
    const bookingsByArena = await prisma.booking.groupBy({
      by: ['arenaId'],
      where: {
        createdAt: { gte: since },
        bookingStatus: { not: 'CANCELLED' },
      },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const arenaIds = bookingsByArena.map((b) => b.arenaId);
    const arenas = await prisma.arena.findMany({
      where: { id: { in: arenaIds } },
      select: { id: true, name: true, sportType: true },
    });
    const arenaMap = Object.fromEntries(arenas.map((a) => [a.id, a]));

    const topArenas = bookingsByArena.map((b) => ({
      arenaId: b.arenaId,
      name: arenaMap[b.arenaId]?.name || 'Unknown',
      sportType: arenaMap[b.arenaId]?.sportType || null,
      bookingCount: b._count.id,
      revenue: Number(b._sum.price || 0),
    }));

    res.json({ periodDays: days, topItems, topArenas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load analytics' });
  }
}

module.exports = { getDashboard ,getAnalytics };