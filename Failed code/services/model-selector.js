// 🤖 MODEL SELECTOR - Choose AI model based on user subscription
// =================================================================

class ModelSelector {
  
  // Model configurations for different tiers
  static getModelConfig(userTier, questionType) {
    const models = {
      free: {
        model: 'gpt-3.5-turbo',
        maxTokens: this.getTokenLimitForTier('free', questionType),
        temperature: this.getTemperatureForModel('gpt-3.5-turbo', questionType),
        rateLimits: {
          requestsPerHour: 10,
          requestsPerDay: 50
        },
        features: {
          imageAnalysis: false,
          ocrProcessing: true,  // Keep OCR for free users
          imageOptimization: true
        }
      },
      
      premium: {
        model: 'gpt-4o-mini',
        maxTokens: this.getTokenLimitForTier('premium', questionType),
        temperature: this.getTemperatureForModel('gpt-4o-mini', questionType),
        rateLimits: {
          requestsPerHour: 100,
          requestsPerDay: 1000
        },
        features: {
          imageAnalysis: true,
          ocrProcessing: true,
          imageOptimization: true
        }
      },
      
      pro: {
        model: 'gpt-4o',
        maxTokens: this.getTokenLimitForTier('pro', questionType),
        temperature: this.getTemperatureForModel('gpt-4o', questionType),
        rateLimits: {
          requestsPerHour: 500,
          requestsPerDay: 5000
        },
        features: {
          imageAnalysis: true,
          ocrProcessing: true,
          imageOptimization: true,
          priorityProcessing: true
        }
      }
    };
    
    return models[userTier] || models.free;
  }
  
  // Token limits based on tier and question type
  static getTokenLimitForTier(tier, questionType) {
    const baseLimits = {
      text_extraction: { free: 200, premium: 400, pro: 600 },
      code_analysis: { free: 400, premium: 800, pro: 1200 },
      ui_analysis: { free: 300, premium: 600, pro: 900 },
      data_analysis: { free: 350, premium: 700, pro: 1000 },
      explanation: { free: 250, premium: 500, pro: 750 },
      problem_solving: { free: 300, premium: 600, pro: 900 },
      general: { free: 250, premium: 500, pro: 750 }
    };
    
    return baseLimits[questionType]?.[tier] || baseLimits.general[tier];
  }
  
  // Temperature optimization per model
  static getTemperatureForModel(model, questionType) {
    const temperatures = {
      'gpt-3.5-turbo': {
        text_extraction: 0.1,
        code_analysis: 0.2,
        data_analysis: 0.2,
        ui_analysis: 0.3,
        explanation: 0.4,
        problem_solving: 0.3,
        general: 0.3
      },
      'gpt-4o-mini': {
        text_extraction: 0.1,
        code_analysis: 0.3,
        data_analysis: 0.2,
        ui_analysis: 0.4,
        explanation: 0.5,
        problem_solving: 0.3,
        general: 0.4
      },
      'gpt-4o': {
        text_extraction: 0.1,
        code_analysis: 0.3,
        data_analysis: 0.2,
        ui_analysis: 0.4,
        explanation: 0.5,
        problem_solving: 0.3,
        general: 0.4
      }
    };
    
    return temperatures[model]?.[questionType] || 0.4;
  }
  
  // Check if user can access specific features
  static canAccessFeature(userTier, feature) {
    const config = this.getModelConfig(userTier, 'general');
    return config.features[feature] || false;
  }
  
  // Get pricing information for frontend
  static getPricingTiers() {
    return {
      free: {
        name: 'Free',
        price: 0,
        currency: 'SEK',
        features: [
          'GPT-3.5 AI responses',
          'OCR text extraction',
          'Image optimization',
          '50 requests/day',
          'Basic support'
        ],
        limitations: [
          'No image analysis',
          'Limited tokens per response',
          'Rate limited'
        ]
      },
      
      premium: {
        name: 'Premium',
        price: 99,
        currency: 'SEK',
        interval: 'month',
        stripeProductId: 'prod_premium_monthly',
        stripePriceId: 'price_premium_monthly',
        features: [
          'GPT-4o-mini AI responses',
          'Full image analysis',
          'OCR text extraction',
          'Advanced image optimization',
          '1000 requests/day',
          'Priority support'
        ]
      },
      
      pro: {
        name: 'Pro',
        price: 299,
        currency: 'SEK',
        interval: 'month',
        stripeProductId: 'prod_pro_monthly',
        stripePriceId: 'price_pro_monthly',
        features: [
          'GPT-4o AI responses (highest quality)',
          'Unlimited image analysis',
          'Advanced OCR processing',
          'Priority processing',
          '5000 requests/day',
          'Premium support',
          'API access'
        ]
      }
    };
  }
  
  // Validate user's rate limits
  static checkRateLimit(userTier, usage) {
    const config = this.getModelConfig(userTier, 'general');
    const limits = config.rateLimits;
    
    return {
      canMakeRequest: usage.hourly < limits.requestsPerHour && usage.daily < limits.requestsPerDay,
      remainingHourly: Math.max(0, limits.requestsPerHour - usage.hourly),
      remainingDaily: Math.max(0, limits.requestsPerDay - usage.daily),
      resetTime: {
        hourly: new Date(Date.now() + (60 - new Date().getMinutes()) * 60000),
        daily: new Date(Date.now() + (24 - new Date().getHours()) * 3600000)
      }
    };
  }
}

export { ModelSelector }; 