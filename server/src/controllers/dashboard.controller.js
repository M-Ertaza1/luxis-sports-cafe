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

module.exports = { getDashboard };