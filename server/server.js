const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/uploads');
const categoryRoutes = require('./routes/categories');
const priorityRoutes = require('./routes/priorities');
const roleRoutes = require('./routes/roles');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
const clientBuildDirectory = path.join(__dirname, '../client/dist');

fs.mkdirSync(uploadDirectory, { recursive: true });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(uploadDirectory));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/priorities', priorityRoutes);
app.use('/api/roles', roleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', notFound);
app.use(express.static(clientBuildDirectory));
app.get('*', (req, res, next) => {
  res.sendFile(path.join(clientBuildDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

database.ready
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch((error) => {
    console.error('Application startup failed:', error);
    process.exitCode = 1;
  });

module.exports = app;
