// Import modules (environment variables will be loaded by database connection)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { analyzeImageRoute } from './routes/ai.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import { query } from './database/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Remove: import { webhookRouter } from './routes/subscription.js';
import { SubscriptionService } from './services/subscription-service.js';
import UserService from './services/user-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());

// CORS configuration for Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'http://localhost:3000', // Website server
    'http://localhost:3001', // Local development
    'http://localhost:8080', // Payments server
    'https://framesense.vercel.app', // Production Vercel URL
    process.env.FRONTEND_URL || '', // Additional frontend URL from env
  ],
  credentials: true
}));

// Stripe webhook handler (mounted directly, before any body parser)
const subscriptionService = new SubscriptionService();
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  console.log('Stripe signature header:', signature);
  console.log('TYPE OF REQ.BODY:', typeof req.body, Buffer.isBuffer(req.body));
  try {
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header'
      });
    }
    console.log('🎯 Processing Stripe webhook...');
    const result = await subscriptionService.handleWebhook(req.body, signature);
    const event = JSON.parse(req.body.toString());
    console.log('---STRIPE WEBHOOK KOM IN---');
    console.log('Event typ:', event.type);
    console.log('client_reference_id:', event.data.object.client_reference_id);
    console.log('customer:', event.data.object.customer);
    console.log('sessionId:', event.data.object.id);
    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.object.id;
      const userId = event.data.object.client_reference_id;
      const customerId = event.data.object.customer;
      if (userId) {
        console.log('💳 Payment successful for user:', userId);
        if (!subscriptionService.stripe) {
          console.error('Stripe not initialized');
          return;
        }
        const session = await subscriptionService.stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items']
        });
        const priceId = session?.line_items?.data[0]?.price?.id;
        const priceToTierMap: { [key: string]: string } = {
          'price_1RjbPBGhaJA85Y4BoLQzZdGi': 'premium',
          'price_1RjbOGGhaJA85Y4BimHpcWHs': 'pro',
        };
        const planName = priceId ? (priceToTierMap[priceId] || 'premium') : 'premium';
        console.log('STRIPE WEBHOOK: priceId =', priceId, ', planName =', planName);
        const user = await UserService.getUserById(userId);
        if (user) {
          await UserService.updateUserTier(user.email, planName, 'active');
          await UserService.updateUserStripeCustomerId(user.email, customerId);
          console.log(`✅ User ${user.email} upgraded to ${planName} tier via webhook`);
        }
      }
    }
    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'FrameSense API'
  });
});

// Database migration endpoint (admin only)
app.post('/admin/migrate', async (req, res) => {
  try {
    console.log('🔄 Running database migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../railway-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await query(sqlContent);
    
    console.log('✅ Database migration completed successfully');
    
    res.json({
      success: true,
      message: 'Database migration completed successfully'
    });
  } catch (error: any) {
    console.error('❌ Database migration failed:', error);
    res.status(500).json({
      success: false,
      message: `Migration failed: ${error.message}`
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Subscription management routes (all others)
app.use('/api', subscriptionRoutes);

// AI analysis endpoint
app.post('/api/analyze', upload.single('image'), analyzeImageRoute);

// Health check for optimization services
app.get('/api/health/optimizations', async (req, res) => {
  try {
    const { AIProcessor } = await import('./services/ai-processor.js');
    const healthStatus = await AIProcessor.healthCheck();
    
    res.json({
      status: healthStatus.overall ? 'healthy' : 'degraded',
      services: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 FrameSense API running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`💳 Subscription endpoints: http://localhost:${PORT}/api/*`);
    });

export default app; 