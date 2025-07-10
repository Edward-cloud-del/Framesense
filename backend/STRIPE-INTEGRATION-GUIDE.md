# 💳 Stripe Integration & Model Tiers Guide

## 🎯 **Overview**

This guide implements a complete freemium model with:
- **Free Tier**: GPT-3.5-turbo, 50 requests/day, OCR only
- **Premium Tier**: GPT-4o-mini, 1000 requests/day, full features, 99 SEK/month
- **Pro Tier**: GPT-4o, 5000 requests/day, priority processing, 299 SEK/month

## 📋 **Implementation Steps**

### **STEP 1: Stripe Dashboard Setup**

#### **1.1 Create Products & Prices**
```bash
# Login to Stripe Dashboard (https://dashboard.stripe.com)

# Create Premium Product
Product Name: FrameSense Premium
Description: AI-powered screenshot analysis with GPT-4o-mini
Price: 99 SEK/month
Price ID: price_premium_monthly (copy this!)

# Create Pro Product  
Product Name: FrameSense Pro
Description: Professional AI analysis with GPT-4o
Price: 299 SEK/month
Price ID: price_pro_monthly (copy this!)
```

#### **1.2 Get API Keys**
```bash
# Test Keys (for development)
Secret Key: sk_test_... (starts with sk_test)
Publishable Key: pk_test_... (starts with pk_test)

# Live Keys (for production)
Secret Key: sk_live_... (starts with sk_live)
Publishable Key: pk_live_... (starts with pk_live)
```

#### **1.3 Create Webhook Endpoint**
```bash
# In Stripe Dashboard > Webhooks
Endpoint URL: https://your-railway-app.railway.app/api/webhooks/stripe

Events to send:
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

Webhook Secret: whsec_... (copy this!)
```

### **STEP 2: Environment Variables**

Update your `.env` file:
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-your-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### **STEP 3: Database Setup (Simple JSON/File)**

For MVP, create a simple user storage:

```bash
# Create users.json in backend/data/
mkdir -p backend/data
touch backend/data/users.json
```

```json
{
  "users": {},
  "subscriptions": {}
}
```

### **STEP 4: Update AI Route with User Context**

```typescript
// In backend/src/routes/ai.ts
export const analyzeImageRoute = async (req: Request, res: Response) => {
  try {
    const { message, imageData, userId = 'anonymous' } = req.body;
    
    // Get user's subscription info
    const userTierInfo = await getUserTier(userId);
    
    const request = { message, imageData, start_time: Date.now() };
    const userContext = {
      userId,
      userTier: userTierInfo.tier,
      usage: userTierInfo.usage,
      customerId: userTierInfo.customerId
    };
    
    // Use the updated AI processor with user context
    const response = await AIProcessor.processRequest(request, openai, userContext);
    
    // Update usage tracking
    await updateUserUsage(userId);
    
    res.json(response);
  } catch (error: any) {
    // Handle rate limiting and subscription errors
    if (error.message.includes('Rate limit')) {
      res.status(429).json({ 
        success: false, 
        message: error.message,
        upgrade_required: true 
      });
    } else if (error.message.includes('subscription')) {
      res.status(402).json({ 
        success: false, 
        message: error.message,
        upgrade_required: true 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

### **STEP 5: Frontend Integration**

#### **5.1 Install Stripe JS**
```bash
cd frontend
npm install @stripe/stripe-js
```

#### **5.2 Create Subscription Components**

```tsx
// src/components/PricingModal.tsx
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export function PricingModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  
  const handleUpgrade = async (priceId: string) => {
    setLoading(true);
    
    try {
      // Create customer if needed
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.id 
        })
      });
      
      const { customer } = await customerResponse.json();
      
      // Create checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerId: customer.customerId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });
      
      const { session } = await checkoutResponse.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: session.sessionId });
      
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-modal">
      <div className="tier free">
        <h3>Free</h3>
        <p>0 SEK/month</p>
        <ul>
          <li>GPT-3.5 responses</li>
          <li>50 requests/day</li>
          <li>OCR text extraction</li>
        </ul>
      </div>
      
      <div className="tier premium">
        <h3>Premium</h3>
        <p>99 SEK/month</p>
        <ul>
          <li>GPT-4o-mini responses</li>
          <li>1000 requests/day</li>
          <li>Image analysis</li>
          <li>Advanced features</li>
        </ul>
        <button onClick={() => handleUpgrade('price_premium_monthly')}>
          Upgrade to Premium
        </button>
      </div>
      
      <div className="tier pro">
        <h3>Pro</h3>
        <p>299 SEK/month</p>
        <ul>
          <li>GPT-4o responses</li>
          <li>5000 requests/day</li>
          <li>Priority processing</li>
          <li>API access</li>
        </ul>
        <button onClick={() => handleUpgrade('price_pro_monthly')}>
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
```

#### **5.3 Handle Rate Limiting in Frontend**

```tsx
// Update AI service to handle rate limiting
const sendAIRequest = async (message: string, imageData?: string) => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        imageData,
        userId: currentUser.id 
      })
    });
    
    if (response.status === 429) {
      // Rate limited
      const error = await response.json();
      showUpgradeModal(error.message);
      return;
    }
    
    if (response.status === 402) {
      // Subscription required
      const error = await response.json();
      showUpgradeModal(error.message);
      return;
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('AI request failed:', error);
  }
};
```

### **STEP 6: Testing the Integration**

#### **6.1 Test API Endpoints**
```bash
# Test pricing tiers
curl https://your-backend.railway.app/api/pricing

# Test user tier info  
curl https://your-backend.railway.app/api/users/test-user/tier

# Test AI with free tier (should work)
curl -X POST https://your-backend.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "What is this?", "userId": "free-user"}'
```

#### **6.2 Test Stripe Integration**
```bash
# Use Stripe test cards:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# Authentication required: 4000 0025 0000 3155
```

### **STEP 7: Deployment Checklist**

#### **7.1 Railway Backend**
```bash
# Environment variables in Railway:
OPENAI_API_KEY=sk-proj-your-real-key
STRIPE_SECRET_KEY=sk_live_your-live-key (for production)
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NODE_ENV=production
```

#### **7.2 Vercel Frontend**
```bash
# Environment variables in Vercel:
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-key
REACT_APP_API_URL=https://your-railway-app.railway.app
```

## 🎯 **Business Model Summary**

| Feature | Free | Premium (99 SEK) | Pro (299 SEK) |
|---------|------|------------------|----------------|
| **AI Model** | GPT-3.5-turbo | GPT-4o-mini | GPT-4o |
| **Requests/Day** | 50 | 1,000 | 5,000 |
| **Image Analysis** | ❌ | ✅ | ✅ |
| **OCR Processing** | ✅ | ✅ | ✅ |
| **Image Optimization** | ❌ | ✅ | ✅ |
| **Priority Processing** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |

## 💡 **Revenue Projections**

```
100 free users → 0 SEK
10 premium users → 990 SEK/month  
3 pro users → 897 SEK/month
Total: 1,887 SEK/month (~$180 USD)

With 1000+ users:
- 5% conversion to premium (50 users) → 4,950 SEK/month
- 1% conversion to pro (10 users) → 2,990 SEK/month  
- Total: ~7,940 SEK/month (~$750 USD)
```

## 🚀 **Next Steps**

1. **Complete database integration** (replace JSON with PostgreSQL/SQLite)
2. **Add user authentication** (Auth0, Firebase Auth, or custom)
3. **Implement usage analytics** (track popular features)
4. **Add team/organization plans**
5. **Create affiliate program**
6. **Add API access for Pro users**

**✅ You now have a complete freemium SaaS business model!** 