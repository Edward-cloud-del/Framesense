import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription-service.js';
import { ModelSelector } from '../services/model-selector.js';
import express from 'express';
import AuthService from '../services/auth-service.js';
import jwt from 'jsonwebtoken';

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
      await AuthService.updateUser(user.email, { stripeCustomerId: customerId });
    }
    
    // Create JWT token for payment success authentication
    const paymentToken = jwt.sign(
      { userId: user.id, email: user.email, plan: planName },
      JWT_SECRET,
      { expiresIn: '1h' } // Short expiry for payment flow
    );
    
    // Create web success URL with JWT token for app authentication
    const webSuccessUrl = `http://localhost:3000/success.html?token=${paymentToken}&email=${encodeURIComponent(user.email)}&plan=${planName}&session_id={CHECKOUT_SESSION_ID}`;
    
    // Default cancel URL to website
    const webCancelUrl = cancelUrl || `http://localhost:3000/payments?canceled=true`;
    
    // Create checkout session with web success URL
    const session = await subscriptionService.createCheckoutSession(
      customerId,
      priceId,
      webSuccessUrl,
      webCancelUrl
    );
    
    console.log('🌐 Checkout session created with web success URL:', webSuccessUrl);
    
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
                    // Map Stripe price ID to tier with actual price IDs
          const tierMapping: { [key: string]: string } = {
            'price_1RjbPBGhaJA85Y4BoLQzZdGi': 'premium',
            'price_1RjbOGGhaJA85Y4BimHpcWHs': 'pro',
            'price_coming_soon': 'enterprise'
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

// 💾 Save payment credentials to file system for Tauri app pickup
router.post('/save-payment-credentials', async (req: Request, res: Response) => {
  try {
    const { token, email, plan, timestamp, session_id } = req.body;
    
    if (!token || !email || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: token, email, plan'
      });
    }

    console.log('💾 Saving payment credentials to file for:', email, 'plan:', plan);

    // Create credentials object
    const credentials = {
      token,
      email, 
      plan,
      timestamp: timestamp || Date.now(),
      session_id: session_id || `manual_${Date.now()}`,
      created_at: new Date().toISOString()
    };

    // Save to known file location that Tauri can read
    const os = require('os');
    const path = require('path');
    const fs = require('fs').promises;
    
    const homeDir = os.homedir();
    const framesenseDir = path.join(homeDir, '.framesense');
    const credentialsFile = path.join(framesenseDir, 'payment_ready.json');

    // Ensure directory exists
    try {
      await fs.mkdir(framesenseDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's OK
    }

    // Write credentials file
    await fs.writeFile(credentialsFile, JSON.stringify(credentials, null, 2));

    console.log('✅ Payment credentials saved to:', credentialsFile);

    res.json({
      success: true,
      message: 'Payment credentials saved to file system',
      file_path: credentialsFile,
      credentials: {
        email: credentials.email,
        plan: credentials.plan,
        timestamp: credentials.timestamp
      }
    });
  } catch (error: any) {
    console.error('File system save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🧪 DEBUG: Simulate successful payment (for testing)
router.post('/simulate-payment-success', async (req: Request, res: Response) => {
  try {
    const { email, plan } = req.body;
    
    if (!email || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Missing email or plan'
      });
    }

    console.log('🧪 Simulating payment success for:', email, 'plan:', plan);

    // Find user in database
    const userData = await AuthService.readUsers();
    const user = userData.users[email];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user tier
    await AuthService.updateUser(email, { 
      tier: plan,
      subscriptionStatus: 'active'
    });

    // Create JWT token like a real payment would
    const paymentToken = jwt.sign(
      { userId: user.id, email: user.email, plan: plan },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create simulated success URL
    const successUrl = `http://localhost:3000/success.html?token=${paymentToken}&email=${encodeURIComponent(email)}&plan=${plan}&session_id=sim_${Date.now()}`;

    console.log('🧪 Simulation complete. Success URL:', successUrl);

    res.json({
      success: true,
      message: 'Payment simulation complete',
      successUrl: successUrl,
      user: {
        email: user.email,
        tier: plan
      }
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 