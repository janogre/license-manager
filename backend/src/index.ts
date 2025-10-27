import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

// Import routes
import authRoutes from './routes/auth.routes';
import assetRoutes from './routes/asset.routes';
import licenseRoutes from './routes/license.routes';
import contractRoutes from './routes/contract.routes';
import modelRoutes from './routes/model.routes';
import dashboardRoutes from './routes/dashboard.routes';
import syncRoutes from './routes/sync.routes';
import reportRoutes from './routes/report.routes';

// Import services
import { syncObserviumDevices } from './services/observium.service';
import { checkAndSendAlerts } from './services/alert.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Scheduled jobs
function setupCronJobs() {
  // Observium sync - Daily at 2 AM by default
  const observiumCron = process.env.OBSERVIUM_SYNC_CRON || '0 2 * * *';
  if (process.env.OBSERVIUM_ENABLED === 'true') {
    cron.schedule(observiumCron, async () => {
      logger.info('Starting scheduled Observium sync...');
      try {
        await syncObserviumDevices();
        logger.info('Scheduled Observium sync completed');
      } catch (error) {
        logger.error('Scheduled Observium sync failed:', error);
      }
    });
    logger.info(`Observium sync scheduled: ${observiumCron}`);
  }

  // Check for expiring contracts and send alerts - Daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Checking for expiring contracts and licenses...');
    try {
      await checkAndSendAlerts();
      logger.info('Alert check completed');
    } catch (error) {
      logger.error('Alert check failed:', error);
    }
  });
  logger.info('Alert checking scheduled: 0 8 * * * (Daily at 8 AM)');
}

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Setup cron jobs
    setupCronJobs();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
