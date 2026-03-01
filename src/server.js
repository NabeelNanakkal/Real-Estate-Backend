const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Auth & Users
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/auth/zoho',  require('./routes/zohoRoutes'));

// Core
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/inquiries',  require('./routes/inquiryRoutes'));

// Content
app.use('/api/about',         require('./routes/aboutRoutes'));
app.use('/api/partners',      require('./routes/partnerRoutes'));
app.use('/api/categories',    require('./routes/categoryRoutes'));
app.use('/api/contact',       require('./routes/contactRoutes'));
app.use('/api/testimonials',  require('./routes/testimonialRoutes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'OK', message: 'API is running' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status  = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  if (!err.isOperational) console.error(err.stack);
  res.status(status).json({ success: false, message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
