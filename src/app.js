require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { sequelize, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Try to load swagger — gracefully skip if not installed
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  const specs = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'Library Management API', version: '1.0.0' },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }
    },
    apis: ['./src/routes/*.js']
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { customCss: '.swagger-ui .topbar { display: none }' }));
} catch (_) { console.log('Swagger not available'); }

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth',               require('./routes/authRoutes'));
app.use('/api/users',              require('./routes/userRoutes'));
app.use('/api/books',              require('./routes/bookRoutes'));
app.use('/api/rentals',            require('./routes/rentalRoutes'));
app.use('/api/wishlist',           require('./routes/wishlistRoutes'));
app.use('/api/reviews',            require('./routes/reviewRoutes'));
app.use('/api/authors',            require('./routes/authorRoutes'));
app.use('/api/admin/analytics',    require('./routes/analyticsRoutes'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const start = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.\n`);
        console.error(`   Fix options:`);
        console.error(`   1. Kill the process:  npx kill-port ${PORT}`);
        console.error(`   2. Use a different port: set PORT=3001 in backend/src/.env\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
start();
module.exports = app;
