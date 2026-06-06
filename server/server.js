require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ─── Connect Database ─────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/rfqs', require('./routes/rfqRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/purchase-orders', require('./routes/poRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 VendorBridge API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 VendorBridge Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
});
