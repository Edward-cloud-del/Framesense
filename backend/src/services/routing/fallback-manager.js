// 🔄 FALLBACK MANAGER - DAY 3 IMPLEMENTATION
// ==========================================
// Graceful degradation system for service failures
// Implements fallback chains: Premium → Pro → Free → Cache → Error

class FallbackManager {
  constructor(cacheManager, tierAccess) {
    this.cacheManager = cacheManager;
    this.tierAccess = tierAccess;

    // Service reliability scores (0.0 to 1.0)
    this.SERVICE_RELIABILITY = {
      'enhanced-ocr': 0.99,        // Local, very reliable
      'google-vision-text': 0.97,
      'google-vision-objects': 0.96,
      'google-vision-web': 0.95,
      'openai-gpt4-vision': 0.92,  // External API, less reliable
      'openai-gpt35-vision': 0.94,
      'open-source-api': 0.85      // Varies by implementation
    };

    // Fallback chain templates by question type
    this.FALLBACK_CHAINS = {
      PURE_TEXT: [
        'enhanced-ocr',
        'google-vision-text',
        'cache-similar',
        'error-with-suggestion'
      ],
      
      COUNT_OBJECTS: [
        'google-vision-objects',
        'openai-gpt35-vision',
        'google-vision-text', // Can count mentioned objects in OCR
        'cache-similar',
        'error-with-suggestion'
      ],
      
      DETECT_OBJECTS: [
        'google-vision-objects',
        'openai-gpt35-vision',
        'openai-gpt4-vision', // Higher quality if budget allows
        'cache-similar',
        'error-with-suggestion'
      ],
      
      DESCRIBE_SCENE: [
        'openai-gpt4-vision',
        'openai-gpt35-vision',
        'google-vision-objects', // Can provide object-based description
        'cache-similar',
        'error-with-suggestion'
      ],
      
      IDENTIFY_CELEBRITY: [
        'google-vision-web',
        'openai-gpt4-vision',
        'cache-similar',
        'error-with-suggestion'
      ],
      
      CUSTOM_ANALYSIS: [
        'openai-gpt4-vision',
        'openai-gpt35-vision',
        'google-vision-web',
        'cache-similar',
        'error-with-suggestion'
      ]
    };

    // Common failure reasons and their handling
    this.FAILURE_HANDLERS = {
      'timeout': { retryable: true, maxRetries: 2, backoff: 1000 },
      'rate_limit': { retryable: true, maxRetries: 1, backoff: 5000 },
      'auth_error': { retryable: false, skipSimilarServices: true },
      'service_down': { retryable: false, skipProvider: true },
      'invalid_request': { retryable: false, skipService: true },
      'quota_exceeded': { retryable: false, skipProvider: true },
      'unknown_error': { retryable: true, maxRetries: 1, backoff: 2000 }
    };
  }

  /**
   * Build fallback chain for a service and question type
   * @param {string} primaryService - The primary service to start with
   * @param {Object} questionType - The classified question type
   * @param {string} userTier - User's subscription tier
   * @returns {Array} Ordered array of fallback options
   */
  async buildFallbackChain(primaryService, questionType, userTier = 'free') {
    console.log(`🔄 Fallback Manager: Building chain for ${primaryService} (${questionType.type})`);

    try {
      // Get base fallback chain for question type
      const baseChain = this.FALLBACK_CHAINS[questionType.type] || this.FALLBACK_CHAINS.DESCRIBE_SCENE;
      
      // Filter services by user tier access
      const accessibleServices = [];
      for (const service of baseChain) {
        if (service.startsWith('cache-') || service.startsWith('error-')) {
          accessibleServices.push(service);
          continue;
        }
        
        const hasAccess = await this.checkServiceAccess(service, userTier);
        if (hasAccess) {
          accessibleServices.push(service);
        }
      }

      // Ensure primary service is at the top if accessible
      if (accessibleServices.includes(primaryService)) {
        const filtered = accessibleServices.filter(s => s !== primaryService);
        accessibleServices.unshift(primaryService);
        accessibleServices.splice(1, 0, ...filtered.slice(0, -1));
      }

      // Build detailed fallback chain
      const detailedChain = accessibleServices.map((service, index) => ({
        service,
        priority: index,
        tier: this.getServiceTier(service),
        reliability: this.SERVICE_RELIABILITY[service] || 0.8,
        retryPolicy: this.getRetryPolicy(service),
        condition: index === 0 ? 'primary' : 'fallback'
      }));

      console.log(`✅ Fallback Manager: Chain built with ${detailedChain.length} options`);
      return detailedChain;

    } catch (error) {
      console.error('❌ Fallback Manager: Chain building failed:', error);
      return this.getEmergencyFallbackChain(questionType.type);
    }
  }

  /**
   * Execute fallback chain when primary service fails
   * @param {Array} fallbackChain - The fallback chain to execute
   * @param {Object} originalRequest - Original request data
   * @param {Error} primaryError - Error from primary service
   * @param {Object} executionContext - Service execution context
   * @returns {Object} Fallback execution result
   */
  async executeFallback(fallbackChain, originalRequest, primaryError, executionContext) {
    const startTime = Date.now();
    console.log(`🔄 Fallback Manager: Executing fallback for error: ${primaryError.message}`);

    const fallbackAttempts = [];
    let currentError = primaryError;

    // Skip primary service (already failed)
    const fallbackOptions = fallbackChain.slice(1);

    for (const fallbackOption of fallbackOptions) {
      const attemptStartTime = Date.now();
      
      try {
        console.log(`🔄 Attempting fallback: ${fallbackOption.service}`);

        let result;
        if (fallbackOption.service.startsWith('cache-')) {
          result = await this.handleCacheFallback(fallbackOption, originalRequest);
        } else if (fallbackOption.service.startsWith('error-')) {
          result = this.handleErrorFallback(fallbackOption, originalRequest, currentError, fallbackAttempts);
        } else {
          result = await this.executeServiceFallback(fallbackOption, originalRequest, executionContext);
        }

        if (result && result.success) {
          const totalTime = Date.now() - startTime;
          console.log(`✅ Fallback Manager: Success with ${fallbackOption.service} in ${totalTime}ms`);
          
          return {
            success: true,
            result: result.data,
            fallbackUsed: fallbackOption.service,
            fallbackAttempts: fallbackAttempts.length + 1,
            totalFallbackTime: totalTime,
            metadata: {
              originalService: fallbackChain[0].service,
              originalError: primaryError.message,
              fallbackChain: fallbackOptions.map(f => f.service)
            }
          };
        }

      } catch (fallbackError) {
        currentError = fallbackError;
        console.log(`⚠️ Fallback ${fallbackOption.service} failed: ${fallbackError.message}`);
      }

      fallbackAttempts.push({
        service: fallbackOption.service,
        error: currentError.message,
        duration: Date.now() - attemptStartTime
      });
    }

    // All fallbacks failed
    const totalTime = Date.now() - startTime;
    console.error(`❌ Fallback Manager: All fallbacks exhausted in ${totalTime}ms`);

    return {
      success: false,
      error: 'All fallback options exhausted',
      originalError: primaryError.message,
      fallbackAttempts,
      totalFallbackTime: totalTime,
      suggestedAction: this.getSuggestedAction(originalRequest, currentError)
    };
  }

  /**
   * Handle cache-based fallback
   */
  async handleCacheFallback(fallbackOption, originalRequest) {
    if (!this.cacheManager) {
      throw new Error('Cache manager not available');
    }

    try {
      if (fallbackOption.service === 'cache-similar') {
        // Try to find similar cached results
        const similarResults = await this.findSimilarCachedResults(originalRequest);
        
        if (similarResults && similarResults.length > 0) {
          return {
            success: true,
            data: {
              ...similarResults[0],
              fromSimilarCache: true,
              similarity: similarResults[0].similarity || 0.8,
              originalImageHash: this.generateImageHash(originalRequest.imageData)
            }
          };
        }
      }

      throw new Error('No suitable cached results found');
    } catch (error) {
      throw new Error(`Cache fallback failed: ${error.message}`);
    }
  }

  /**
   * Handle error fallback with user-friendly response
   */
  handleErrorFallback(fallbackOption, originalRequest, lastError, attempts) {
    const errorInfo = this.analyzeError(lastError);
    
    return {
      success: true,
      data: {
        text: '',
        confidence: 0.0,
        has_text: false,
        error: true,
        errorType: errorInfo.type,
        userMessage: this.generateUserFriendlyMessage(errorInfo, attempts.length),
        suggestedActions: this.getSuggestedActions(errorInfo, originalRequest),
        fallbackAttempts: attempts.length,
        canRetryLater: errorInfo.retryable
      }
    };
  }

  /**
   * Execute service-based fallback
   */
  async executeServiceFallback(fallbackOption, originalRequest, executionContext) {
    // This would integrate with the actual service execution
    // For now, simulate the call
    throw new Error(`Service fallback execution not implemented for ${fallbackOption.service}`);
  }

  /**
   * Check if user has access to a service
   */
  async checkServiceAccess(service, userTier) {
    if (!this.tierAccess) return true;

    try {
      const availableServices = this.tierAccess.getAvailableServices(userTier);
      return availableServices.includes(service) || availableServices.includes('all');
    } catch (error) {
      console.warn(`⚠️ Failed to check service access for ${service}:`, error);
      return false;
    }
  }

  /**
   * Get service tier requirement
   */
  getServiceTier(service) {
    const tierMapping = {
      'enhanced-ocr': 'free',
      'google-vision-text': 'free',
      'google-vision-objects': 'pro',
      'google-vision-web': 'premium',
      'openai-gpt35-vision': 'pro',
      'openai-gpt4-vision': 'premium',
      'open-source-api': 'free'
    };

    return tierMapping[service] || 'pro';
  }

  /**
   * Get retry policy for service
   */
  getRetryPolicy(service) {
    const policies = {
      'enhanced-ocr': { maxRetries: 3, backoff: 500 },
      'google-vision-text': { maxRetries: 2, backoff: 1000 },
      'google-vision-objects': { maxRetries: 2, backoff: 1000 },
      'google-vision-web': { maxRetries: 1, backoff: 2000 },
      'openai-gpt35-vision': { maxRetries: 2, backoff: 2000 },
      'openai-gpt4-vision': { maxRetries: 1, backoff: 3000 },
      'open-source-api': { maxRetries: 3, backoff: 1000 }
    };

    return policies[service] || { maxRetries: 1, backoff: 1000 };
  }

  /**
   * Get emergency fallback chain
   */
  getEmergencyFallbackChain(questionType) {
    return [
      {
        service: 'enhanced-ocr',
        priority: 0,
        tier: 'free',
        reliability: 0.99,
        condition: 'emergency'
      },
      {
        service: 'error-with-suggestion',
        priority: 1,
        tier: 'free',
        reliability: 1.0,
        condition: 'final'
      }
    ];
  }

  /**
   * Find similar cached results
   */
  async findSimilarCachedResults(originalRequest) {
    if (!this.cacheManager) return [];

    try {
      const imageHash = this.generateImageHash(originalRequest.imageData);
      
      // This would implement perceptual hashing and similarity search
      // For now, return empty array
      console.log(`🔍 Searching for similar cached results for hash: ${imageHash.substring(0, 8)}...`);
      
      return [];
    } catch (error) {
      console.warn('⚠️ Failed to search similar cache results:', error);
      return [];
    }
  }

  /**
   * Analyze error type and characteristics
   */
  analyzeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return { type: 'timeout', retryable: true, userFriendly: 'Request timed out' };
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return { type: 'rate_limit', retryable: true, userFriendly: 'Service is busy' };
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return { type: 'auth_error', retryable: false, userFriendly: 'Authentication issue' };
    }
    
    if (message.includes('quota') || message.includes('limit exceeded')) {
      return { type: 'quota_exceeded', retryable: false, userFriendly: 'Service quota exceeded' };
    }
    
    if (message.includes('service unavailable') || message.includes('503')) {
      return { type: 'service_down', retryable: true, userFriendly: 'Service temporarily unavailable' };
    }

    return { type: 'unknown_error', retryable: true, userFriendly: 'Unexpected error occurred' };
  }

  /**
   * Generate user-friendly error message
   */
  generateUserFriendlyMessage(errorInfo, attemptCount) {
    const baseMessage = errorInfo.userFriendly || 'An error occurred';
    
    if (attemptCount > 0) {
      return `${baseMessage}. We tried ${attemptCount} alternative${attemptCount > 1 ? 's' : ''} but couldn't complete your request.`;
    }
    
    return `${baseMessage}. Please try again later.`;
  }

  /**
   * Get suggested actions for user
   */
  getSuggestedActions(errorInfo, originalRequest) {
    const actions = [];
    
    if (errorInfo.retryable) {
      actions.push('Try again in a few minutes');
    }
    
    if (errorInfo.type === 'rate_limit') {
      actions.push('Wait a moment and retry');
      actions.push('Consider upgrading for higher limits');
    }
    
    if (errorInfo.type === 'auth_error') {
      actions.push('Check your account status');
      actions.push('Contact support if the issue persists');
    }
    
    if (errorInfo.type === 'quota_exceeded') {
      actions.push('Upgrade your plan for higher limits');
      actions.push('Wait until next billing cycle');
    }

    actions.push('Contact support if problems continue');
    
    return actions;
  }

  /**
   * Get suggested action for complete failure
   */
  getSuggestedAction(originalRequest, lastError) {
    const errorInfo = this.analyzeError(lastError);
    
    return {
      message: `We couldn't process your image due to ${errorInfo.userFriendly.toLowerCase()}`,
      actions: this.getSuggestedActions(errorInfo, originalRequest),
      canRetryLater: errorInfo.retryable,
      supportTicket: errorInfo.type === 'unknown_error'
    };
  }

  /**
   * Generate image hash for similarity matching
   */
  generateImageHash(imageData) {
    const crypto = require('crypto');
    const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64');
    return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats() {
    return {
      // Would track actual usage stats
      totalFallbacks: 0,
      successRate: 0.85,
      averageFallbackTime: 2500,
      commonFailures: ['timeout', 'rate_limit', 'service_down'],
      mostReliableServices: ['enhanced-ocr', 'google-vision-text']
    };
  }

  /**
   * Test fallback chain without execution
   */
  async testFallbackChain(primaryService, questionType, userTier) {
    const chain = await this.buildFallbackChain(primaryService, questionType, userTier);
    
    return {
      primaryService,
      questionType: questionType.type,
      userTier,
      fallbackChain: chain,
      totalOptions: chain.length,
      estimatedReliability: chain.reduce((acc, opt) => acc + opt.reliability, 0) / chain.length,
      accessibleServices: chain.filter(opt => !opt.service.startsWith('cache-') && !opt.service.startsWith('error-')).length
    };
  }
}

export { FallbackManager }; 