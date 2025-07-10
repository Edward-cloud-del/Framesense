import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription-service.js';
import { ModelSelector } from '../services/model-selector.js';

const subscriptionService = new SubscriptionService();

// Get pricing tiers
export const getPricingTiers = async (req: Request, res: Response) => {
  try {
    const tiers = ModelSelector.getPricingTiers();
    res.json({ success: true, tiers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create checkout session
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl } = req.body;
    
    if (!priceId || !customerId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: priceId, customerId, successUrl, cancelUrl'
      });
    }
    
    const session = await subscriptionService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    );
    
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { email, userId } = req.body;
    
    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, userId'
      });
    }
    
    const customer = await subscriptionService.createCustomer(email, userId);
    
    res.json({ success: true, customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer subscription
export const getCustomerSubscription = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing customerId parameter'
      });
    }
    
    const subscription = await subscriptionService.getCustomerSubscription(customerId);
    
    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing subscriptionId'
      });
    }
    
    const result = await subscriptionService.cancelSubscription(subscriptionId);
    
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create customer portal session
export const createPortalSession = async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;
    
    if (!customerId || !returnUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, returnUrl'
      });
    }
    
    const session = await subscriptionService.createPortalSession(customerId, returnUrl);
    
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Handle Stripe webhooks
export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header'
      });
    }
    
    const result = await subscriptionService.handleWebhook(req.body, signature);
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user's current tier and usage
export const getUserTierInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // TODO: Get from database
    // For now, return mock data
    const mockUserData = {
      userId,
      tier: 'free',
      customerId: null,
      usage: {
        hourly: 0,
        daily: 5,
        monthly: 45
      },
      subscription: {
        status: 'none',
        currentPeriodEnd: null
      }
    };
    
    const tierConfig = ModelSelector.getModelConfig(mockUserData.tier, 'general');
    const rateLimitCheck = ModelSelector.checkRateLimit(mockUserData.tier, mockUserData.usage);
    
    res.json({
      success: true,
      user: {
        ...mockUserData,
        tierConfig,
        rateLimits: rateLimitCheck
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 