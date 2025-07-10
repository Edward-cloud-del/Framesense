# 🚀 FrameSense AI - Fullständig Implementation Guide

## 🎯 **Översikt**

Denna guide implementerar en komplett freemium SaaS-lösning med:
- **8 olika AI-motorer** (OpenAI, Claude, Gemini, etc.)
- **4 prenumerationsnivåer** (Free, Premium, Pro, Enterprise)
- **Svensk marknad** (SEK priser)
- **Fullständig autentisering** och kontoskapande
- **Integrerad payments-sida** på website

## 🤖 **AI-Motorer & Prenumerationsnivåer**

### **Free Tier - 0 SEK/månad**
- **GPT-3.5-turbo** (OpenAI)
- **Gemini Flash** (Google)
- **50 requests/dag**
- **Endast OCR text-extraktion**

### **Premium Tier - 99 SEK/månad**
- **GPT-4o-mini** (OpenAI)
- **Claude 3 Haiku** (Anthropic)
- **Gemini Pro** (Google)
- **1000 requests/dag**
- **Bildanalys aktiverad**

### **Pro Tier - 299 SEK/månad**
- **GPT-4o** (OpenAI)
- **Claude 3.5 Sonnet** (Anthropic)
- **Gemini Ultra** (Google)
- **Llama 3.1 70B** (Meta/Groq)
- **5000 requests/dag**
- **Prioritetsbehandling**

### **Enterprise Tier - 499 SEK/månad**
- **GPT-4o 32k context** (OpenAI)
- **Claude 3 Opus** (Anthropic)
- **Gemini Ultra Pro** (Google)
- **Llama 3.1 405B** (Meta/Groq)
- **Unlimited requests**
- **API access**
- **Dedicated support**

## 📋 **STEG 1: Frontend UI Ändringar**

### **1.1 Minska Captured Rutan**
```tsx
// src/components/ResultOverlay.tsx
const ResultOverlay = ({ capturedImage, aiResponse, onClose }) => {
  return (
    <div className="result-overlay">
      <div className="result-container">
        {/* Minskad bildarea - max 300px höjd */}
        <div className="image-preview" style={{ maxHeight: '300px' }}>
          <img 
            src={capturedImage} 
            alt="Captured screenshot"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              objectFit: 'contain' 
            }}
          />
        </div>
        
        {/* AI Response */}
        <div className="ai-response">
          <p>{aiResponse}</p>
        </div>
        
        {/* Upgrade Button - Prominently displayed */}
        <div className="upgrade-section">
          <button 
            className="upgrade-btn"
            onClick={() => window.open('https://framesense.se/payments', '_blank')}
          >
            🚀 Upgrade to Pro - Få tillgång till GPT-4o & Claude
          </button>
          <p className="upgrade-text">
            Använder GPT-3.5 • {userTier.remainingRequests} requests kvar idag
          </p>
        </div>
        
        {/* Model Selection Button */}
        <div className="model-selection">
          <button 
            className="model-btn"
            onClick={() => setShowModelSelector(true)}
          >
            🎯 Choose Models ({currentModel})
          </button>
        </div>
      </div>
    </div>
  );
};
```

### **1.2 Model Selector Component**
```tsx
// src/components/ModelSelector.tsx
import { useState, useEffect } from 'react';

const ModelSelector = ({ userTier, onModelSelect, currentModel }) => {
  const [availableModels, setAvailableModels] = useState([]);

  const modelsByTier = {
    free: [
      { name: 'GPT-3.5-turbo', provider: 'OpenAI', icon: '🤖' },
      { name: 'Gemini Flash', provider: 'Google', icon: '💎' }
    ],
    premium: [
      { name: 'GPT-4o-mini', provider: 'OpenAI', icon: '🤖' },
      { name: 'Claude 3 Haiku', provider: 'Anthropic', icon: '🧠' },
      { name: 'Gemini Pro', provider: 'Google', icon: '💎' }
    ],
    pro: [
      { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖' },
      { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🧠' },
      { name: 'Gemini Ultra', provider: 'Google', icon: '💎' },
      { name: 'Llama 3.1 70B', provider: 'Meta', icon: '🦙' }
    ],
    enterprise: [
      { name: 'GPT-4o 32k', provider: 'OpenAI', icon: '🤖' },
      { name: 'Claude 3 Opus', provider: 'Anthropic', icon: '🧠' },
      { name: 'Gemini Ultra Pro', provider: 'Google', icon: '💎' },
      { name: 'Llama 3.1 405B', provider: 'Meta', icon: '🦙' }
    ]
  };

  useEffect(() => {
    setAvailableModels(modelsByTier[userTier.tier] || modelsByTier.free);
  }, [userTier]);

  return (
    <div className="model-selector">
      <h3>Välj AI-Modell</h3>
      
      {availableModels.map((model) => (
        <div 
          key={model.name}
          className={`model-option ${currentModel === model.name ? 'selected' : ''}`}
          onClick={() => onModelSelect(model.name)}
        >
          <span className="model-icon">{model.icon}</span>
          <div className="model-info">
            <strong>{model.name}</strong>
            <span className="model-provider">{model.provider}</span>
          </div>
        </div>
      ))}
      
      {/* Locked Models */}
      {userTier.tier !== 'enterprise' && (
        <div className="locked-models">
          <h4>🔒 Uppgradera för fler modeller</h4>
          {modelsByTier.enterprise
            .filter(model => !availableModels.some(available => available.name === model.name))
            .map((model) => (
              <div key={model.name} className="model-option locked">
                <span className="model-icon">{model.icon}</span>
                <div className="model-info">
                  <strong>{model.name}</strong>
                  <span className="model-provider">{model.provider}</span>
                </div>
                <span className="upgrade-tag">Enterprise</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
```

## 📋 **STEG 2: Website Payments Sida**

### **2.1 Skapa Payments Route**
```tsx
// website/src/components/PaymentsPage.tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const PaymentsPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      priceId: null,
      features: [
        'GPT-3.5-turbo & Gemini Flash',
        '50 requests per dag',
        'OCR text-extraktion',
        'Grundläggande support'
      ]
    },
    premium: {
      name: 'Premium',
      price: 99,
      priceId: 'price_premium_monthly',
      features: [
        'GPT-4o-mini, Claude 3 Haiku, Gemini Pro',
        '1000 requests per dag',
        'Bildanalys & avancerade funktioner',
        'Prioriterad support'
      ]
    },
    pro: {
      name: 'Pro',
      price: 299,
      priceId: 'price_pro_monthly',
      features: [
        'GPT-4o, Claude 3.5 Sonnet, Gemini Ultra',
        '5000 requests per dag',
        'Prioritetsbehandling',
        'Avancerad bildanalys'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 499,
      priceId: 'price_enterprise_monthly',
      features: [
        'Alla premium AI-modeller',
        'Obegränsade requests',
        'API access',
        'Dedicated support & SLA'
      ]
    }
  };

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) return;
    
    setLoading(true);
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('framesense_token');
      if (!token) {
        // Redirect to login with return URL
        window.location.href = `/login?return=/payments&plan=${selectedPlan}`;
        return;
      }

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success?plan=${selectedPlan}`,
          cancelUrl: `${window.location.origin}/payments`
        })
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ett fel uppstod. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payments-page">
      <div className="container">
        <h1>Välj Din AI-Plan</h1>
        <p className="subtitle">Uppgradera för tillgång till de bästa AI-modellerna</p>
        
        <div className="pricing-grid">
          {Object.entries(plans).map(([key, plan]) => (
            <div 
              key={key}
              className={`pricing-card ${selectedPlan === key ? 'selected' : ''} ${key === 'pro' ? 'popular' : ''}`}
              onClick={() => setSelectedPlan(key)}
            >
              {key === 'pro' && <div className="popular-badge">Populär</div>}
              
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="currency">SEK/mån</span>
              </div>
              
              <ul className="features">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <button 
                className={`plan-button ${key === 'free' ? 'current' : 'upgrade'}`}
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={loading}
              >
                {loading ? 'Laddar...' : 
                 key === 'free' ? 'Nuvarande Plan' : 
                 `Uppgradera till ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
        
        <div className="ai-models-showcase">
          <h2>AI-Modeller per Plan</h2>
          <div className="models-grid">
            {Object.entries(plans).filter(([key]) => key !== 'free').map(([key, plan]) => (
              <div key={key} className="model-tier">
                <h4>{plan.name}</h4>
                <div className="model-icons">
                  {key === 'premium' && (
                    <>
                      <span>🤖 GPT-4o-mini</span>
                      <span>🧠 Claude 3 Haiku</span>
                      <span>💎 Gemini Pro</span>
                    </>
                  )}
                  {key === 'pro' && (
                    <>
                      <span>🤖 GPT-4o</span>
                      <span>🧠 Claude 3.5 Sonnet</span>
                      <span>💎 Gemini Ultra</span>
                      <span>🦙 Llama 3.1 70B</span>
                    </>
                  )}
                  {key === 'enterprise' && (
                    <>
                      <span>🤖 GPT-4o 32k</span>
                      <span>🧠 Claude 3 Opus</span>
                      <span>💎 Gemini Ultra Pro</span>
                      <span>🦙 Llama 3.1 405B</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
```

### **2.2 Routing Setup**
```tsx
// website/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaymentsPage from './components/PaymentsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}
```

## 📋 **STEG 3: Authentication System**

### **3.1 Backend Auth Service**
```javascript
// backend/src/services/auth-service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

class AuthService {
  async createUser(email, password, name) {
    try {
      // Read existing users
      const userData = await this.readUsers();
      
      // Check if user exists
      if (userData.users[email]) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = {
        id: `user_${Date.now()}`,
        email,
        name,
        password: hashedPassword,
        tier: 'free',
        usage: { daily: 0, total: 0 },
        createdAt: new Date().toISOString(),
        stripeCustomerId: null
      };
      
      userData.users[email] = user;
      await this.writeUsers(userData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async loginUser(email, password) {
    try {
      const userData = await this.readUsers();
      const user = userData.users[email];
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userData = await this.readUsers();
      const user = userData.users[decoded.email];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async readUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, create it
      const initialData = { users: {}, subscriptions: {} };
      await this.writeUsers(initialData);
      return initialData;
    }
  }

  async writeUsers(userData) {
    await fs.writeFile(USERS_FILE, JSON.stringify(userData, null, 2));
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
```

### **3.2 Auth Routes**
```typescript
// backend/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import AuthService from '../services/auth-service';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
    }
    
    const result = await AuthService.createUser(email, password, name);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const result = await AuthService.loginUser(email, password);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
});

// Verify token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const user = await AuthService.verifyToken(token);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
});

export default router;
```

### **3.3 Frontend Auth Components**
```tsx
// website/src/components/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('framesense_token', data.token);
        localStorage.setItem('framesense_user', JSON.stringify(data.user));
        
        // Redirect to return URL or payments page
        const returnUrl = searchParams.get('return') || '/payments';
        navigate(returnUrl);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ett fel uppstod. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Logga In</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga In'}
          </button>
        </form>
        
        <p>
          Har du inget konto? <a href="/signup">Skapa konto</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
```

## 📋 **STEG 4: Multi-Provider AI Integration**

### **4.1 AI Provider Services**
```javascript
// backend/src/services/ai-providers/openai-provider.js
const OpenAI = require('openai');

class OpenAIProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateResponse(prompt, model = 'gpt-3.5-turbo', imageData = null) {
    const messages = [{ role: 'user', content: prompt }];
    
    if (imageData && (model.includes('gpt-4') || model.includes('gpt-4o'))) {
      messages[0].content = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageData } }
      ];
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: this.getMaxTokens(model),
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  getMaxTokens(model) {
    const tokenLimits = {
      'gpt-3.5-turbo': 1000,
      'gpt-4o-mini': 2000,
      'gpt-4o': 3000,
      'gpt-4o-32k': 8000
    };
    return tokenLimits[model] || 1000;
  }
}

module.exports = OpenAIProvider;
```

```javascript
// backend/src/services/ai-providers/claude-provider.js
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeProvider {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async generateResponse(prompt, model = 'claude-3-haiku-20240307', imageData = null) {
    const messages = [{ role: 'user', content: prompt }];
    
    if (imageData) {
      const imageBase64 = imageData.split(',')[1];
      messages[0].content = [
        { type: 'text', text: prompt },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64
          }
        }
      ];
    }

    const response = await this.client.messages.create({
      model,
      max_tokens: this.getMaxTokens(model),
      messages
    });

    return response.content[0].text;
  }

  getMaxTokens(model) {
    const tokenLimits = {
      'claude-3-haiku-20240307': 2000,
      'claude-3-5-sonnet-20241022': 4000,
      'claude-3-opus-20240229': 4000
    };
    return tokenLimits[model] || 2000;
  }
}

module.exports = ClaudeProvider;
```

### **4.2 Universal AI Service**
```javascript
// backend/src/services/universal-ai-service.js
const OpenAIProvider = require('./ai-providers/openai-provider');
const ClaudeProvider = require('./ai-providers/claude-provider');
const GeminiProvider = require('./ai-providers/gemini-provider');
const GroqProvider = require('./ai-providers/groq-provider');

class UniversalAIService {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      claude: new ClaudeProvider(),
      gemini: new GeminiProvider(),
      groq: new GroqProvider()
    };

    this.modelMapping = {
      'GPT-3.5-turbo': { provider: 'openai', model: 'gpt-3.5-turbo' },
      'GPT-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
      'GPT-4o': { provider: 'openai', model: 'gpt-4o' },
      'GPT-4o 32k': { provider: 'openai', model: 'gpt-4o-32k' },
      'Claude 3 Haiku': { provider: 'claude', model: 'claude-3-haiku-20240307' },
      'Claude 3.5 Sonnet': { provider: 'claude', model: 'claude-3-5-sonnet-20241022' },
      'Claude 3 Opus': { provider: 'claude', model: 'claude-3-opus-20240229' },
      'Gemini Flash': { provider: 'gemini', model: 'gemini-1.5-flash' },
      'Gemini Pro': { provider: 'gemini', model: 'gemini-1.5-pro' },
      'Gemini Ultra': { provider: 'gemini', model: 'gemini-1.5-ultra' },
      'Llama 3.1 70B': { provider: 'groq', model: 'llama-3.1-70b-versatile' },
      'Llama 3.1 405B': { provider: 'groq', model: 'llama-3.1-405b-reasoning' }
    };
  }

  async generateResponse(modelName, prompt, imageData = null) {
    const modelConfig = this.modelMapping[modelName];
    
    if (!modelConfig) {
      throw new Error(`Model ${modelName} not supported`);
    }

    const provider = this.providers[modelConfig.provider];
    if (!provider) {
      throw new Error(`Provider ${modelConfig.provider} not available`);
    }

    try {
      return await provider.generateResponse(prompt, modelConfig.model, imageData);
    } catch (error) {
      console.error(`AI generation failed for ${modelName}:`, error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  getAvailableModels(userTier) {
    const tierModels = {
      free: ['GPT-3.5-turbo', 'Gemini Flash'],
      premium: ['GPT-4o-mini', 'Claude 3 Haiku', 'Gemini Pro'],
      pro: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini Ultra', 'Llama 3.1 70B'],
      enterprise: ['GPT-4o 32k', 'Claude 3 Opus', 'Gemini Ultra Pro', 'Llama 3.1 405B']
    };

    // Return all models up to user's tier
    const availableModels = [];
    const tiers = ['free', 'premium', 'pro', 'enterprise'];
    const userTierIndex = tiers.indexOf(userTier);

    for (let i = 0; i <= userTierIndex; i++) {
      availableModels.push(...tierModels[tiers[i]]);
    }

    return availableModels;
  }
}

module.exports = new UniversalAIService();
```

## 📋 **STEG 5: Stripe Dashboard Setup**

### **5.1 Produkter & Priser**
```bash
# Logga in på Stripe Dashboard (https://dashboard.stripe.com)

# Skapa Premium Product
Produktnamn: FrameSense Premium
Beskrivning: AI-analys med GPT-4o-mini, Claude 3 Haiku, Gemini Pro
Pris: 99 SEK/månad
Pris-ID: price_premium_monthly_sek

# Skapa Pro Product
Produktnamn: FrameSense Pro  
Beskrivning: Professionell AI-analys med GPT-4o, Claude 3.5 Sonnet
Pris: 299 SEK/månad
Pris-ID: price_pro_monthly_sek

# Skapa Enterprise Product
Produktnamn: FrameSense Enterprise
Beskrivning: Obegränsad AI-analys med alla premium modeller
Pris: 499 SEK/månad
Pris-ID: price_enterprise_monthly_sek
```

### **5.2 Webhook Configuration**
```bash
# Endpoint URL: https://your-backend.railway.app/api/webhooks/stripe
# Events:
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.trial_will_end
```

## 📋 **STEG 6: Environment Variables**

### **6.1 Backend (.env)**
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Google Gemini
GOOGLE_API_KEY=your-google-api-key

# Groq (for Llama models)
GROQ_API_KEY=your-groq-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://framesense.se
```

### **6.2 Frontend (.env)**
```bash
# API
REACT_APP_API_URL=https://your-backend.railway.app

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable

# App
REACT_APP_APP_NAME=FrameSense
REACT_APP_WEBSITE_URL=https://framesense.se
```

## 📋 **STEG 7: Deployment Process**

### **7.1 Railway Backend Deployment**
```bash
# 1. Committa all kod
git add .
git commit -m "Add multi-provider AI system with authentication"
git push origin main

# 2. Skapa Railway project
railway login
railway new
railway link

# 3. Sätt environment variables i Railway dashboard
# (Kopiera alla från .env till Railway)

# 4. Deploy
railway up
```

### **7.2 Vercel Website Deployment**
```bash
# 1. Installera Vercel CLI
npm install -g vercel

# 2. Deploy website
cd website
vercel

# 3. Sätt environment variables i Vercel dashboard
# 4. Sätt custom domain: framesense.se
```

## 📋 **STEG 8: Testing Checklist**

### **8.1 Authentication Flow**
```bash
# Test user registration
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Test login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### **8.2 AI Model Testing**
```bash
# Test each model with authentication
curl -X POST https://your-backend.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"message": "Test message", "selectedModel": "GPT-4o", "userId": "user123"}'
```

### **8.3 Payment Flow Testing**
```bash
# Test Stripe checkout
# Use test cards:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

## 🎯 **Fullständig Implementation Summary**

### **✅ Vad som implementeras:**
1. **Frontend UI** - Mindre capture area, upgrade-knapp, model selector
2. **Website** - Payments sida med 4 plans, authentication
3. **Backend** - 8 AI-modeller, authentication, prenumerationshantering
4. **Stripe** - Komplett betalningssystem för svensk marknad
5. **Security** - JWT tokens, bcrypt lösenord, API keys säkra

### **🚀 Revenue Potential:**
```
1000 användare:
- 50 Premium (99 SEK) = 4,950 SEK/månad
- 15 Pro (299 SEK) = 4,485 SEK/månad  
- 5 Enterprise (499 SEK) = 2,495 SEK/månad
Total: ~12,000 SEK/månad (~$1,200 USD)
```

### **📈 Next Steps:**
1. Implementera alla steg i ordning
2. Testa hela flödet
3. Lansera på svensk marknad
4. Optimera conversion rates
5. Lägg till analytics & A/B testing

**Du har nu en komplett roadmap för en multi-million SEK SaaS-business!** 🎉 