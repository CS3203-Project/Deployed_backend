import 'dotenv/config';                
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function generatePrismaClient() {
  // Check if Prisma client already exists
  const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma', 'client');
  
  if (existsSync(prismaClientPath)) {
    console.log('=====> Prisma client already exists, skipping generation');
    return;
  }

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Running \`prisma generate\` (attempt ${i + 1}/${maxRetries})...`);
      execSync('npx prisma generate', { stdio: 'inherit' }); 
      console.log('=====> Prisma generate completed successfully');
      return;
    } catch (err: any) {
      console.warn(`=====> Attempt ${i + 1} failed:`, err.message || err);
      
      if (i < maxRetries - 1) {
        console.log(`=====> Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn('=====> Warning: Could not run `prisma generate` after all retries.');
        console.warn('=====> This is likely due to OneDrive file locking.');
        console.warn('=====> To fix this issue, try one of these solutions:');
        console.warn('=====> 1. Run PowerShell as Administrator and execute: npx prisma generate');
        console.warn('=====> 2. Pause OneDrive sync temporarily');
        console.warn('=====> 3. Move the project outside OneDrive folder');
      }
    }
  }
}

await generatePrismaClient();

import { prisma } from './src/utils/database';
import { queueService } from './src/services/queue.service';
import { scheduledJobsService } from './src/services/scheduled-jobs.service';
import express, { type Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import userRoutes from './src/routes/user.route';
import providerRoutes from './src/routes/provider.route';
import companyRoutes from './src/routes/company.route';
import servicesRoutes from './src/routes/services.route';
import categoryRoutes from './src/routes/category.route';
import adminRoutes from './src/Admin/routes/admin.route';
import confirmationRoutes from './src/routes/confirmation.route';
import reviewRoutes from './src/routes/review.route';
import serviceReviewRoutes from './src/routes/serviceReview.route';
import serviceRequestRoutes from './src/routes/serviceRequest.route';
import paymentRoutes from './src/routes/payment.route';
import notificationRoutes from './src/routes/notification.route';
import { chatbotRoutes, CHATBOT_MODULE_INFO } from './src/modules/chatbot/index';
import scheduleRoutes from './src/routes/schedule.route';

// Simple database test function
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('=====> Database connection successful');
    return true;
  } catch (error: any) {
    console.error('=====> Database connection failed:', error.message);
    return false;
  }
} 

const app: Application = express();

// CORS configuration (must run before any rate limiting or routes)
const corsOptions: CorsOptions = {
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'], 
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit CORS preflight requests
  skip: (req) => req.method === 'OPTIONS',
});

// Apply rate limiting to all routes
app.use(limiter);

// Increase JSON payload limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/confirmations', confirmationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service-reviews', serviceReviewRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/schedule', scheduleRoutes);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Start server with basic database test
async function startServer() {
  console.log('=====> Starting server...');
  
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('=====> Server startup aborted due to database connection failure');
    process.exit(1);
  }

  // Initialize queue service
  try {
    await queueService.connect();
    queueService.setupGracefulShutdown();
    console.log('=====> RabbitMQ connection established');
  } catch (error) {
    console.error('=====> RabbitMQ connection failed, emails will not be sent:', error);
    // Don't exit - continue without email functionality
  }

  // Start scheduled jobs
  try {
    scheduledJobsService.startAllJobs();
    console.log('=====> Scheduled jobs started');
  } catch (error) {
    console.error('=====> Failed to start scheduled jobs:', error);
    // Don't exit - continue without scheduled jobs
  }
  
  app.listen(PORT, () => {
    console.log(`=====> Server running on port ${PORT}`);
  });
}

// Graceful shutdown for scheduled jobs
process.on('SIGINT', async () => {
  console.log('==xx== Received SIGINT, shutting down scheduled jobs...');
  scheduledJobsService.stopAllJobs();
  await queueService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('==xx== Received SIGTERM, shutting down scheduled jobs...');
  scheduledJobsService.stopAllJobs();
  await queueService.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('=====> Failed to start server:', error);
  process.exit(1);
});
