// 🛡️ TIER ACCESS CONTROL - DAY 3 IMPLEMENTATION
// =============================================
// Subscription-based access control system
// Manages free/pro/premium tier restrictions and usage limits

class TierAccess {
  constructor(userService, analyticsTracker) {
    this.userService = userService;
    this.analyticsTracker = analyticsTracker;

    // Tier permission definitions
    this.TIER_PERMISSIONS = {
      free: {
        services: ['enhanced-ocr', 'gpt-3.5-vision'],
        questionTypes: ['PURE_TEXT'],
        dailyLimit: 10,
        monthlyLimit: 200,
        features: ['basic-ocr', 'simple-analysis'],
        maxImageSize: 2 * 1024 * 1024, // 2MB
        maxConcurrentRequests: 1,
        priority: 'low',
        cacheAccess: 'read-only',
        supportLevel: 'community'
      },
      
      pro: {
        services: ['enhanced-ocr', 'google-vision-objects', 'google-vision-text', 'gpt-4-vision', 'gpt-3.5-vision'],
        questionTypes: ['PURE_TEXT', 'COUNT_OBJECTS', 'DESCRIBE_SCENE', 'DETECT_OBJECTS'],
        dailyLimit: 100,
        monthlyLimit: 2000,
        features: ['object-detection', 'logo-recognition', 'advanced-analysis', 'batch-processing'],
        maxImageSize: 10 * 1024 * 1024, // 10MB
        maxConcurrentRequests: 3,
        priority: 'normal',
        cacheAccess: 'read-write',
        supportLevel: 'email',
        costLimit: 50.0 // $50/month
      },
      
      premium: {
        services: ['all'],
        questionTypes: ['all'],
        dailyLimit: 1000,
        monthlyLimit: 20000,
        features: ['celebrity-identification', 'web-search', 'priority-processing', 'custom-models', 'api-access'],
        maxImageSize: 50 * 1024 * 1024, // 50MB
        maxConcurrentRequests: 10,
        priority: 'high',
        cacheAccess: 'read-write-admin',
        supportLevel: 'priority',
        costLimit: 500.0 // $500/month
      }
    };

    // Service cost mapping
    this.SERVICE_COSTS = {
      'enhanced-ocr': 0.0,
      'google-vision-text': 0.0015,
      'google-vision-objects': 0.006,
      'google-vision-web': 0.0035,
      'openai-vision': 0.03,
      'gpt-4-vision': 0.04,
      'gpt-3.5-vision': 0.02
    };

    // Question type to tier mapping
    this.QUESTION_TYPE_TIERS = {
      'PURE_TEXT': 'free',
      'COUNT_OBJECTS': 'pro',
      'DETECT_OBJECTS': 'pro',
      'DESCRIBE_SCENE': 'pro',
      'IDENTIFY_CELEBRITY': 'premium',
      'CUSTOM_ANALYSIS': 'premium'
    };
  }

  /**
   * Validate user access to a specific question type
   * @param {Object} questionType - The classified question type
   * @param {Object} userProfile - User profile with tier and usage data
   * @returns {Object} Access validation result
   */
  async validateAccess(questionType, userProfile) {
    const startTime = Date.now();
    console.log(`🛡️ === TIER ACCESS VALIDATION ===`);
    console.log(`Question Type: ${questionType.type}`);
    console.log(`User Tier: ${userProfile.tier}`);
    console.log(`User ID: ${userProfile.id}`);
    console.log(`================================`);

    try {
      // Get user's tier permissions
      const tierPermissions = this.TIER_PERMISSIONS[userProfile.tier];
      console.log(`📋 Tier Permissions:`, {
        services: tierPermissions?.services || 'NOT FOUND',
        questionTypes: tierPermissions?.questionTypes || 'NOT FOUND',
        dailyLimit: tierPermissions?.dailyLimit || 'NOT FOUND'
      });
      
      if (!tierPermissions) {
        console.error(`❌ INVALID TIER: ${userProfile.tier}`);
        return this.createAccessDeniedResult('invalid_tier', 'premium', 'Invalid user tier');
      }

      // Check if question type is allowed for tier
      const requiredTier = this.QUESTION_TYPE_TIERS[questionType.type];
      console.log(`🔍 Question Type Tier Requirements:`, {
        questionType: questionType.type,
        requiredTier: requiredTier || 'NOT DEFINED',
        userTier: userProfile.tier
      });
      
      console.log(`🔒 Checking if user tier '${userProfile.tier}' can access required tier '${requiredTier}'`);
      const canAccess = this.canAccessTier(userProfile.tier, requiredTier);
      console.log(`✅ Tier Access Check Result: ${canAccess}`);
      
      if (!canAccess) {
        console.error(`❌ TIER INSUFFICIENT: ${questionType.type} requires ${requiredTier}, user has ${userProfile.tier}`);
        return this.createAccessDeniedResult(
          'tier_insufficient', 
          requiredTier, 
          `${questionType.type} requires ${requiredTier} tier or higher`
        );
      }

      // Check daily usage limit
      const dailyUsage = await this.getDailyUsage(userProfile.userId);
      if (dailyUsage >= tierPermissions.dailyLimit) {
        return this.createAccessDeniedResult(
          'daily_limit_exceeded',
          userProfile.tier === 'free' ? 'pro' : 'premium',
          `Daily limit of ${tierPermissions.dailyLimit} requests exceeded`
        );
      }

      // Check monthly usage limit
      const monthlyUsage = await this.getMonthlyUsage(userProfile.userId);
      if (monthlyUsage >= tierPermissions.monthlyLimit) {
        return this.createAccessDeniedResult(
          'monthly_limit_exceeded',
          userProfile.tier === 'free' ? 'pro' : 'premium',
          `Monthly limit of ${tierPermissions.monthlyLimit} requests exceeded`
        );
      }

      // Check concurrent request limit
      const activeRequests = await this.getActiveRequestCount(userProfile.userId);
      if (activeRequests > tierPermissions.maxConcurrentRequests) {
        return this.createAccessDeniedResult(
          'concurrent_limit_exceeded',
          userProfile.tier,
          `Maximum ${tierPermissions.maxConcurrentRequests} concurrent requests allowed`
        );
      }

      // Check cost limit for paid tiers
      if (tierPermissions.costLimit) {
        const monthlyCost = await this.getMonthlyCost(userProfile.userId);
        const estimatedCost = questionType.estimatedCost || 0.01;
        
        if (monthlyCost + estimatedCost > tierPermissions.costLimit) {
          return this.createAccessDeniedResult(
            'cost_limit_exceeded',
            'premium',
            `Monthly cost limit of $${tierPermissions.costLimit} would be exceeded`
          );
        }
      }

      // All checks passed
      const validationTime = Date.now() - startTime;
      console.log(`✅ Tier Access: Approved in ${validationTime}ms`);

      return {
        allowed: true,
        tier: userProfile.tier,
        permissions: tierPermissions,
        usage: {
          daily: dailyUsage,
          monthly: monthlyUsage,
          concurrent: activeRequests
        },
        limits: {
          daily: tierPermissions.dailyLimit,
          monthly: tierPermissions.monthlyLimit,
          concurrent: tierPermissions.maxConcurrentRequests
        },
        validationTime
      };

    } catch (error) {
      console.error('❌ Tier Access: Validation error:', error);
      return this.createAccessDeniedResult('validation_error', 'premium', error.message);
    }
  }

  /**
   * Check if user tier can access required tier
   */
  canAccessTier(userTier, requiredTier) {
    const tierHierarchy = { 'free': 0, 'pro': 1, 'premium': 2 };
    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  /**
   * Check if user tier can access lower tier features
   */
  canAccessLowerTier(userTier, targetTier) {
    const tierHierarchy = { 'free': 0, 'pro': 1, 'premium': 2 };
    return tierHierarchy[userTier] >= tierHierarchy[targetTier];
  }

  /**
   * Get services available for user's tier
   */
  getAvailableServices(userTier) {
    const permissions = this.TIER_PERMISSIONS[userTier];
    if (!permissions) return [];

    if (permissions.services.includes('all')) {
      return Object.keys(this.SERVICE_COSTS);
    }

    return permissions.services;
  }

  /**
   * Get question types available for user's tier
   */
  getAvailableQuestionTypes(userTier) {
    const permissions = this.TIER_PERMISSIONS[userTier];
    if (!permissions) return [];

    if (permissions.questionTypes.includes('all')) {
      return Object.keys(this.QUESTION_TYPE_TIERS);
    }

    return permissions.questionTypes;
  }

  /**
   * Validate image size for user's tier
   */
  validateImageSize(userTier, imageSize) {
    const permissions = this.TIER_PERMISSIONS[userTier];
    if (!permissions) return false;

    return imageSize <= permissions.maxImageSize;
  }

  /**
   * Get user's daily usage
   */
  async getDailyUsage(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (this.analyticsTracker) {
        const usage = await this.analyticsTracker.getUsageStats(userId, 'daily', today);
        return usage.requestCount || 0;
      }

      // Fallback: query database directly
      return await this.userService.getDailyRequestCount(userId, today);
    } catch (error) {
      console.warn('⚠️ Failed to get daily usage, defaulting to 0:', error);
      return 0;
    }
  }

  /**
   * Get user's monthly usage
   */
  async getMonthlyUsage(userId) {
    try {
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      
      if (this.analyticsTracker) {
        const usage = await this.analyticsTracker.getUsageStats(userId, 'monthly', thisMonth);
        return usage.requestCount || 0;
      }

      return await this.userService.getMonthlyRequestCount(userId, thisMonth);
    } catch (error) {
      console.warn('⚠️ Failed to get monthly usage, defaulting to 0:', error);
      return 0;
    }
  }

  /**
   * Get user's monthly cost
   */
  async getMonthlyCost(userId) {
    try {
      const thisMonth = new Date().toISOString().substring(0, 7);
      
      if (this.analyticsTracker) {
        const usage = await this.analyticsTracker.getUsageStats(userId, 'monthly', thisMonth);
        return usage.totalCost || 0;
      }

      return await this.userService.getMonthlyCost(userId, thisMonth);
    } catch (error) {
      console.warn('⚠️ Failed to get monthly cost, defaulting to 0:', error);
      return 0;
    }
  }

  /**
   * Get active concurrent requests count
   */
  async getActiveRequestCount(userId) {
    try {
      if (this.analyticsTracker) {
        return await this.analyticsTracker.getActiveRequestCount(userId);
      }

      return await this.userService.getActiveRequestCount(userId);
    } catch (error) {
      console.warn('⚠️ Failed to get active request count, defaulting to 0:', error);
      return 0;
    }
  }

  /**
   * Create standardized access denied result
   */
  createAccessDeniedResult(reason, suggestedTier, message) {
    return {
      allowed: false,
      reason,
      suggestedTier,
      message,
      upgradeUrl: `/upgrade?tier=${suggestedTier}&reason=${reason}`,
      contactSupport: reason === 'validation_error'
    };
  }

  /**
   * Track successful access for analytics
   */
  async trackAccess(userId, questionType, service, cost = 0) {
    try {
      if (this.analyticsTracker) {
        await this.analyticsTracker.trackRequest({
          userId,
          questionType: questionType.type,
          service,
          cost,
          timestamp: new Date(),
          tier: await this.getUserTier(userId)
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to track access:', error);
    }
  }

  /**
   * Get tier upgrade recommendations
   */
  getTierUpgradeRecommendations(userProfile, deniedQuestionTypes = []) {
    const currentTier = userProfile.tier;
    const recommendations = [];

    if (currentTier === 'free') {
      recommendations.push({
        tier: 'pro',
        benefits: [
          '10x more requests (100/day)',
          'Object detection & counting',
          'Logo recognition',
          'Advanced scene analysis',
          'Email support'
        ],
        enabledQuestionTypes: ['COUNT_OBJECTS', 'DETECT_OBJECTS', 'DESCRIBE_SCENE'],
        monthlyCost: 19.99
      });
    }

    if (currentTier !== 'premium') {
      recommendations.push({
        tier: 'premium',
        benefits: [
          '1000 requests/day',
          'Celebrity identification',
          'Web entity search',
          'Priority processing',
          'API access',
          'Priority support'
        ],
        enabledQuestionTypes: ['IDENTIFY_CELEBRITY', 'CUSTOM_ANALYSIS'],
        monthlyCost: 99.99
      });
    }

    return recommendations.filter(rec => 
      deniedQuestionTypes.some(qt => rec.enabledQuestionTypes.includes(qt))
    );
  }

  /**
   * Get user's current tier
   */
  async getUserTier(userId) {
    try {
      const user = await this.userService.getUserById(userId);
      return user?.tier || 'free';
    } catch (error) {
      console.warn('⚠️ Failed to get user tier, defaulting to free:', error);
      return 'free';
    }
  }

  /**
   * Get tier comparison data for UI
   */
  getTierComparison() {
    return {
      free: {
        name: 'Free',
        price: 0,
        dailyLimit: this.TIER_PERMISSIONS.free.dailyLimit,
        features: this.TIER_PERMISSIONS.free.features,
        questionTypes: this.TIER_PERMISSIONS.free.questionTypes
      },
      pro: {
        name: 'Pro',
        price: 19.99,
        dailyLimit: this.TIER_PERMISSIONS.pro.dailyLimit,
        features: this.TIER_PERMISSIONS.pro.features,
        questionTypes: this.TIER_PERMISSIONS.pro.questionTypes
      },
      premium: {
        name: 'Premium',
        price: 99.99,
        dailyLimit: this.TIER_PERMISSIONS.premium.dailyLimit,
        features: this.TIER_PERMISSIONS.premium.features,
        questionTypes: ['all']
      }
    };
  }

  /**
   * Check if user can be temporarily upgraded for emergency requests
   */
  canTemporaryUpgrade(userProfile, emergencyReason) {
    // Allow temporary upgrades for legitimate use cases
    const validReasons = ['medical', 'safety', 'research', 'accessibility'];
    
    return {
      allowed: validReasons.includes(emergencyReason) && userProfile.tier !== 'premium',
      duration: '24h',
      limitations: ['5 requests max', 'basic features only']
    };
  }
}

export { TierAccess }; 