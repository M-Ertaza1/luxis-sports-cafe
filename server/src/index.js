require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth.routes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luxis Sports Cafe API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

