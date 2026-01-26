import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Routes
import consultantRoutes from './routes/consultant.js';
import customerRoutes from './routes/customer.js';
import analyticsRoutes from './routes/analytics.js';
import resourcesRoutes from './routes/resources.js';
import aiRoutes from './routes/ai.js';
import apiKeyRoutes from './routes/apiKey.js';
import crawlRoutes from './routes/crawl.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://sagunbok.com',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Sagunbok Consultant API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/consultant', consultantRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/consultant/api-key', apiKeyRoutes);
app.use('/api/crawl', crawlRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Sagunbok Consultant Zone API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      consultant: '/api/consultant',
      customers: '/api/customers',
      analytics: '/api/analytics',
      resources: '/api/resources'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      '/health',
      '/api/consultant',
      '/api/customers',
      '/api/analytics',
      '/api/resources'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 Sagunbok Consultant API Server Started       ║
╠════════════════════════════════════════════════════╣
║   Port: ${PORT}                                     
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Frontend: ${process.env.FRONTEND_URL || 'https://sagunbok.com'}
║                                                    ║
║   Endpoints:                                       ║
║   - GET  /health                                   ║
║   - POST /api/consultant/profile                   ║
║   - GET  /api/customers                            ║
║   - GET  /api/analytics/dashboard                  ║
║   - GET  /api/resources/templates                  ║
╚════════════════════════════════════════════════════╝
  `);
});

export default app;
