require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth.routes');

const bookingRoutes = require('./routes/booking.routes');

const inventoryRoutes = require('./routes/inventory.routes');

const transferRoutes = require('./routes/transfer.routes');

const saleRoutes = require('./routes/sale.routes');

const auditRoutes = require('./routes/audit.routes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/bookings', bookingRoutes);

app.use('/api/inventory', inventoryRoutes);

app.use('/api/transfers', transferRoutes);

app.use('/api/sales', saleRoutes);

app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luxis Sports Cafe API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

