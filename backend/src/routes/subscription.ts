import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription-service.js';
import { ModelSelector } from '../services/model-selector.js';
import express from 'express';
import UserService from '../services/user-service.js';
import jwt from 'jsonwebtoken';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

const router = Router();
const subscriptionService = new SubscriptionService();

// Authentication middleware
const authenticateUser = async (req: Request, res: Response, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const user = await UserService.verifyToken(token);
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Create checkout session (server-centralized method)
router.post('/create-checkout-session', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { priceId, planName } = req.body;
    const user = (req as any).user;
    
    if (!priceId || !planName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: priceId, planName'
      });
    }
    
    console.log('Creating checkout session for user:', user.email, 'plan:', planName);
    
    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await subscriptionService.createCustomer(user.email, user.id);
      customerId = customer.customerId;
      
      // Update user with Stripe customer ID
      await UserService.updateUserStripeCustomerId(user.email, customerId);
    }
    
    // Simple success/cancel URLs
    // Generate JWT token for success URL
    const paymentToken = jwt.sign(
      { userId: user.id, email: user.email, plan: planName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
            const successUrl = `https://framesense.vercel.app/success?token=${paymentToken}&email=${encodeURIComponent(user.email)}&plan=${planName}`;
        const cancelUrl = `https://framesense.vercel.app/payments?canceled=true`;
    
    // Create checkout session with user ID for webhook identification
    const session = await subscriptionService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      user.id, // Pass user ID for webhook
      planName // Pass plan name for webhook
    );
    
    console.log('✅ Checkout session created for user:', user.email, 'plan:', planName);
    
    res.json({ 
      success: true, 
      sessionId: session.sessionId,
      sessionUrl: session.url 
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pricing tiers
router.get('/pricing-tiers', async (req: Request, res: Response) => {
  try {
    const tiers = ModelSelector.getPricingTiers();
    res.json({ success: true, tiers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user subscription status
router.get('/subscription-status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user.stripeCustomerId) {
      return res.json({ 
        success: true, 
        subscription: { 
          status: 'none', 
          tier: 'free',
          currentPeriodEnd: null 
        } 
      });
    }
    
    const subscription = await subscriptionService.getCustomerSubscription(user.stripeCustomerId);
    
    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- SPLIT WEBHOOK ROUTER ---
export const webhookRouter = express.Router();
webhookRouter.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
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
          'price_1RlABfGWc6GycnTBym7WZTsP': 'premium',
          'price_1RlAC5GWc6GycnTBPDsPRabB': 'pro',
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

// Check user subscription status (simple server-centralized method)
router.get('/check-status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get fresh user data from database
    const currentUser = await UserService.getUserById(user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ Status check for user:', user.email, 'tier:', currentUser.tier);
    
    res.json({
      success: true,
      user: currentUser
    });
  } catch (error: any) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    const user = (req as any).user;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing subscriptionId'
      });
    }
    
    const result = await subscriptionService.cancelSubscription(subscriptionId);
    
    // Update user tier back to free
    await UserService.updateUserTier(user.email, 'free', 'canceled');
    
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create customer portal session
router.post('/create-portal-session', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { returnUrl } = req.body;
    const user = (req as any).user;
    
    if (!returnUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing returnUrl'
      });
    }
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'User has no Stripe customer ID'
      });
    }
    
    const session = await subscriptionService.createPortalSession(user.stripeCustomerId, returnUrl);
    
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's current tier and usage
router.get('/user-tier-info', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const tierConfig = ModelSelector.getModelConfig(user.tier, 'general');
    const rateLimitCheck = ModelSelector.checkRateLimit(user.tier, user.usage);
    
    res.json({
      success: true,
      user: {
        ...user,
        tierConfig,
        rateLimits: rateLimitCheck
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});



export default router; 