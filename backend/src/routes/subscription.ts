import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription-service.js';
import { ModelSelector } from '../services/model-selector.js';
import express from 'express';
const AuthService = require('../services/auth-service');

const router = Router();
const subscriptionService = new SubscriptionService();

// Authentication middleware
const authenticateUser = async (req: Request, res: Response, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const user = await AuthService.verifyToken(token);
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Create checkout session (for payments.html)
router.post('/create-checkout-session', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { priceId, planName, successUrl, cancelUrl } = req.body;
    const user = (req as any).user;
    
    if (!priceId || !planName || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: priceId, planName, successUrl, cancelUrl'
      });
    }
    
    console.log('Creating checkout session for user:', user.email);
    
    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await subscriptionService.createCustomer(user.email, user.id);
      customerId = customer.customerId;
      
      // Update user with Stripe customer ID
      await AuthService.updateUser(user.email, { stripeCustomerId: customerId });
    }
    
    // Create checkout session
    const session = await subscriptionService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    );
    
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

// Handle Stripe webhooks (needs raw body)
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header'
      });
    }
    
    console.log('Processing Stripe webhook...');
    
    const result = await subscriptionService.handleWebhook(req.body, signature);
    
    // Check if result has processed property (subscription change)
    if (result && 'processed' in result && result.processed) {
      // For subscription changes, we need to get the event details from the raw body
      const event = JSON.parse(req.body.toString());
      
      if (event.type === 'customer.subscription.updated' || 
          event.type === 'customer.subscription.created') {
        
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find user by stripe customer ID
        const userData = await AuthService.readUsers();
        const userEmail = Object.keys(userData.users).find(email => 
          userData.users[email].stripeCustomerId === customerId
        );
        
        if (userEmail) {
          // Map Stripe price ID to tier
          const tierMapping: { [key: string]: string } = {
            'price_premium_monthly_sek': 'premium',
            'price_pro_monthly_sek': 'pro',
            'price_enterprise_monthly_sek': 'enterprise'
          };
          
          const newTier = tierMapping[subscription.items.data[0].price.id] || 'free';
          
          await AuthService.updateUser(userEmail, { 
            tier: newTier,
            subscriptionStatus: subscription.status 
          });
          
          console.log(`Updated user ${userEmail} to tier ${newTier}`);
        }
      }
    }
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
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
    await AuthService.updateUser(user.email, { 
      tier: 'free',
      subscriptionStatus: 'canceled' 
    });
    
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