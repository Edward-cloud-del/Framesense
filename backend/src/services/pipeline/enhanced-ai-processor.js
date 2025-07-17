import { QuestionClassifier } from '../classification/question-classifier.js';
import { ModelSelector } from '../classification/model-selector.js';
import { SmartRouter } from '../routing/smart-router.js';
import { TierAccess } from '../routing/tier-access.js';
import { CostOptimizer } from '../routing/cost-optimizer.js';
import { FallbackManager } from '../routing/fallback-manager.js';
import { cacheManager } from '../caching/index.js';
import responseOptimizer from './response-optimizer.js';
import analyticsTracker from './analytics-tracker.js';
import googleVisionService from '../enhanced-services/google-vision.js';
// Enhanced OCR uses CommonJS, we'll create wrapper
import UserService from '../user-service.js';

/**
 * Enhanced AI Processor - Main Orchestration Pipeline
 * MOMENT 5.1: Integrates all DAY 1-4 components into unified system
 * 
 * Features:
 * - Question classification and intelligent routing
 * - Tier-based access control and cost optimization  
 * - Multi-layer caching with cache-first strategy
 * - Comprehensive analytics and performance tracking
 * - Service execution with fallback management
 * - Response optimization and standardization
 */
class EnhancedAIProcessor {
  constructor() {
    // Initialize core services first
    this.cacheManager = cacheManager; // Already an instance
    this.responseOptimizer = responseOptimizer; // Already an instance
    this.analyticsTracker = analyticsTracker; // Already an instance
    this.userService = UserService; // Static class
    
    // Initialize simple services (no dependencies)
    this.questionClassifier = new QuestionClassifier();
    this.modelSelector = new ModelSelector();
    
    // Initialize services with dependencies
    this.tierAccess = new TierAccess(this.userService, this.analyticsTracker);
    this.costOptimizer = new CostOptimizer(this.analyticsTracker, this.userService);
    this.fallbackManager = new FallbackManager(this.cacheManager, this.tierAccess);
    
    // SmartRouter needs all dependencies
    this.smartRouter = new SmartRouter(
      this.questionClassifier,
      this.modelSelector, 
      this.tierAccess,
      this.costOptimizer,
      this.fallbackManager
    );
    
    // Service instances
    this.googleVision = googleVisionService; // Already an instance
    this.enhancedOCR = null; // Will be dynamically imported
    
    // Initialize Enhanced OCR dynamically
    this.initializeEnhancedOCR();
    
    // Service registry for execution
    this.serviceRegistry = {
      'enhanced-ocr': null, // Will be set after dynamic import
      'google-vision-text': this.googleVision,
      'google-vision-objects': this.googleVision,
      'google-vision-web': this.googleVision,
      'google-vision-logo': this.googleVision,
      'openai-vision': null, // Will be set up when OpenAI Enhanced is implemented
      'open-source-api': null // Will be set up when plugin system is ready
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalCostSaved: 0
    };
    
    console.log('✅ Enhanced AI Processor initialized');
  }
  
  /**
   * Initialize Enhanced OCR with dynamic import (CommonJS compatibility)
   */
  async initializeEnhancedOCR() {
    try {
      const { EnhancedOCR } = await import('../enhanced-services/enhanced-ocr.js');
      this.enhancedOCR = new EnhancedOCR(this.cacheManager, this.googleVision);
      this.serviceRegistry['enhanced-ocr'] = this.enhancedOCR;
      console.log('✅ Enhanced OCR initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Enhanced OCR:', error.message);
      this.enhancedOCR = null;
    }
  }
  
  /**
   * Main entry point for AI analysis requests
   * @param {Buffer|string} imageData - Image data (buffer or base64)
   * @param {string} question - User's question about the image
   * @param {string} userId - User ID for tracking and access control
   * @param {Object} options - Additional options (model preference, cache strategy, etc.)
   * @returns {Object} Processed AI response with metadata
   */
  async processAnalysisRequest(imageData, question, userId, options = {}) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    console.log(`🚀 Enhanced AI Processor: Starting request ${requestId} for user ${userId}`);
    
    try {
      this.metrics.totalRequests++;
      
      // 1. Request validation and preprocessing
      const validatedData = await this.validateRequest(imageData, question, userId);
      console.log(`✅ Request validation completed for ${requestId}`);
      
      // 2. Question classification
      const questionType = this.questionClassifier.classifyQuestion(question);
      console.log(`🎯 Question classified as: ${questionType.id} for ${requestId}`);
      
      // 3. Get user profile and preferences
      const userProfile = await this.getUserProfile(userId);
      console.log(`👤 User profile loaded: tier=${userProfile.tier} for ${requestId}`);
      
      // 4. Generate cache key and check cache first
      const cacheKey = await this.cacheManager.generateKey(
        validatedData.imageData, 
        question, 
        questionType.id,
        userProfile.tier
      );
      
      const cachedResult = await this.cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log(`💾 Cache hit for ${requestId}`);
        // await this.analyticsTracker.trackCacheHit(cacheKey, userId); // Temporarily disabled for debugging
        
        const response = this.formatResponse(cachedResult, 'cache', {
          requestId,
          responseTime: Date.now() - startTime,
          cached: true
        });
        
        this.metrics.successfulRequests++;
        return response;
      }
      
      console.log(`🔄 Cache miss for ${requestId}, proceeding with analysis`);
      
      // 5. Route request based on type and user preferences
      const routing = await this.smartRouter.routeRequest(
        questionType,
        options.modelPreference,
        userProfile,
        options
      );
      
      console.log(`🎯 Route selected: ${routing.service} with model ${routing.model} for ${requestId}`);
      
      // 6. Execute the appropriate service
      const serviceStartTime = Date.now();
      const result = await this.executeService(routing, validatedData.imageData, question, userProfile);
      const serviceResponseTime = Date.now() - serviceStartTime;
      
      console.log(`⚡ Service execution completed in ${serviceResponseTime}ms for ${requestId}`);
      
      // 7. Optimize response for caching and transmission
      const optimizedResult = await this.responseOptimizer.optimizeForCache(result, routing.service);
      
      // 8. Cache the optimized result
      await this.cacheManager.set(cacheKey, optimizedResult.optimized, {
        ttl: this.getCacheTTL(routing.service),
        cost: routing.estimatedCost
      });
      
      // 9. Track usage and costs
      await this.analyticsTracker.trackRequest({
        userId,
        userTier: userProfile.tier,
        questionType: questionType.type,
        service: routing.service,
        model: routing.model,
        responseTime: serviceResponseTime,
        cost: routing.estimatedCost,
        cached: false,
        success: true,
        confidence: result.confidence || 0.9,
        imageSize: validatedData.imageSize
      });
      
      // 10. Format and return response
      const totalResponseTime = Date.now() - startTime;
      const response = this.formatResponse(optimizedResult.optimized, routing.service, {
        requestId,
        responseTime: totalResponseTime,
        serviceResponseTime,
        cost: routing.estimatedCost,
        model: routing.model,
        cached: false,
        optimization: {
          originalSize: optimizedResult.originalSize,
          optimizedSize: optimizedResult.optimizedSize,
          sizeSaved: optimizedResult.originalSize - optimizedResult.optimizedSize
        }
      });
      
      this.metrics.successfulRequests++;
      this.updateMetrics(totalResponseTime, routing.estimatedCost);
      
      console.log(`✅ Enhanced AI Processor: Request ${requestId} completed successfully in ${totalResponseTime}ms`);
      return response;
      
    } catch (error) {
      console.error(`❌ Enhanced AI Processor: Request ${requestId} failed:`, error.message);
      this.metrics.failedRequests++;
      
      return await this.handleError(error, question, userId, requestId, Date.now() - startTime);
    }
  }
  
  /**
   * Service Execution Engine - MOMENT 5.2 Integration
   * Executes the appropriate AI service based on routing decision
   */
  async executeService(routing, imageData, question, userProfile) {
    const { service, model, parameters } = routing;
    
    console.log(`🔧 === SERVICE EXECUTION DEBUG ===`);
    console.log(`👤 User Profile:`, {
      id: userProfile.id,
      email: userProfile.email,
      tier: userProfile.tier,
      subscription_status: userProfile.subscription_status
    });
    console.log(`🎯 Routing Decision:`, {
      service,
      model,
      parameters: parameters || 'none'
    });
    console.log(`📝 Question:`, question);
    console.log(`================================`);
    
    try {
      switch (service) {
        case 'enhanced-ocr':
          console.log(`📝 Executing Enhanced OCR...`);
          return await this.enhancedOCR.extractText(imageData, {
            ...parameters,
            language: parameters?.language || 'eng',
            preprocessing: true
          });
          
        case 'google-vision-text':
          console.log(`👁️ Executing Google Vision Text Detection for tier: ${userProfile.tier}`);
          return await this.googleVision.detectText(imageData, userProfile.tier);
          
        case 'google-vision-objects':
          console.log(`🎯 Executing Google Vision Object Detection for tier: ${userProfile.tier}`);
          return await this.googleVision.detectObjects(imageData, userProfile.tier);
          
        case 'google-vision-web':
          console.log(`⭐ Attempting Google Vision Celebrity Detection...`);
          console.log(`🔒 Tier Check: User tier '${userProfile.tier}' vs required 'premium'`);
          // Premium feature - celebrity identification
          if (userProfile.tier !== 'premium') {
            console.error(`❌ TIER ACCESS DENIED: User tier '${userProfile.tier}' cannot access celebrity identification (premium required)`);
            throw new Error('Celebrity identification requires premium subscription');
          }
          console.log(`✅ TIER ACCESS GRANTED: Proceeding with celebrity detection`);
          return await this.googleVision.detectCelebritiesAndWeb(imageData, userProfile.tier);
          
        case 'google-vision-logo':
          console.log(`🏷️ Executing Google Vision Logo Detection for tier: ${userProfile.tier}`);
          return await this.googleVision.detectLogos(imageData, userProfile.tier);
          
        case 'openai-vision':
          console.log(`🧠 Attempting OpenAI Vision...`);
          // TODO: Implement OpenAI Enhanced service
          throw new Error('OpenAI Enhanced service not yet implemented');
          
        case 'open-source-api':
          console.log(`🔌 Attempting Open Source API...`);
          // TODO: Implement plugin system
          throw new Error('Open source API plugins not yet implemented');
          
        default:
          console.error(`❌ UNKNOWN SERVICE: ${service}`);
          throw new Error(`Unknown service: ${service}`);
      }
      
    } catch (error) {
      console.error(`❌ === SERVICE EXECUTION ERROR ===`);
      console.error(`Service: ${service}`);
      console.error(`User Tier: ${userProfile.tier}`);
      console.error(`Error: ${error.message}`);
      console.error(`================================`);
      
      // Attempt fallback if available
      if (routing.fallback) {
        console.log(`🔄 Attempting fallback to ${routing.fallback}`);
        const fallbackRouting = { ...routing, service: routing.fallback };
        return await this.executeService(fallbackRouting, imageData, question, userProfile);
      }
      
      throw error;
    }
  }
  
  /**
   * Validate and preprocess incoming request
   */
  async validateRequest(imageData, question, userId) {
    // Validate required parameters
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Validate question length
    if (question.length < 3) {
      throw new Error('Question must be at least 3 characters long');
    }
    
    if (question.length > 1000) {
      throw new Error('Question must be less than 1000 characters');
    }
    
    // Validate and process image data if provided
    let processedImageData = null;
    let imageSize = 0;
    
    if (imageData) {
      if (typeof imageData === 'string') {
        // Handle base64 data
        if (imageData.startsWith('data:image/')) {
          processedImageData = imageData;
          imageSize = imageData.length;
        } else {
          throw new Error('Invalid image data format');
        }
      } else if (Buffer.isBuffer(imageData)) {
        // Handle buffer data
        processedImageData = imageData;
        imageSize = imageData.length;
      } else {
        throw new Error('Image data must be base64 string or Buffer');
      }
      
      // Check image size limits (basic validation)
      if (imageSize > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Image size exceeds 50MB limit');
      }
    }
    
    return {
      question: question.trim(),
      imageData: processedImageData,
      imageSize,
      userId
    };
  }
  
  /**
   * Get user profile with tier and preferences
   */
  async getUserProfile(userId) {
    try {
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        id: user.id,
        email: user.email,
        tier: user.tier || 'free',
        preferences: user.preferences || {},
        usage: user.usage || { daily: 0, monthly: 0 },
        budget: user.budget || { daily: 5.0, monthly: 100.0 },
        costOptimization: user.costOptimization || false
      };
      
    } catch (error) {
      console.warn(`⚠️ Failed to load user profile for ${userId}, using defaults:`, error.message);
      
      // Return default profile for graceful degradation
      return {
        id: userId,
        email: 'unknown@example.com',
        tier: 'free',
        preferences: {},
        usage: { daily: 0, monthly: 0 },
        budget: { daily: 1.0, monthly: 25.0 },
        costOptimization: true
      };
    }
  }
  
  /**
   * Format response with standardized structure
   */
  formatResponse(result, source, metadata = {}) {
    return {
      success: true,
      source,
      result: result.data || result.result || result,
      metadata: {
        requestId: metadata.requestId,
        responseTime: metadata.responseTime,
        serviceResponseTime: metadata.serviceResponseTime,
        cost: metadata.cost || 0,
        model: metadata.model,
        cached: metadata.cached || false,
        optimization: metadata.optimization,
        confidence: result.confidence || 0.9,
        timestamp: new Date().toISOString(),
        service: source
      }
    };
  }
  
  /**
   * Handle errors with graceful degradation
   */
  async handleError(error, question, userId, requestId, responseTime) {
    console.error(`❌ Enhanced AI Processor Error for ${requestId}:`, error.message);
    
    // Track error analytics
    await this.analyticsTracker.trackRequest({
      userId,
      questionType: 'unknown',
      service: 'error',
      model: 'none',
      responseTime,
      cost: 0,
      cached: false,
      success: false,
      error: error.message
    });
    
    // Return structured error response
    return {
      success: false,
      error: error.message,
      metadata: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
        suggestion: this.getErrorSuggestion(error.message)
      }
    };
  }
  
  /**
   * Get cache TTL based on service type
   */
  getCacheTTL(service) {
    const ttlMap = {
      'enhanced-ocr': 3600, // 1 hour
      'google-vision-text': 3600, // 1 hour
      'google-vision-objects': 21600, // 6 hours
      'google-vision-web': 604800, // 1 week
      'google-vision-logo': 86400, // 1 day
      'openai-vision': 3600, // 1 hour
      'open-source-api': 1800 // 30 minutes
    };
    
    return ttlMap[service] || 3600;
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(responseTime, cost) {
    // Update average response time
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    
    // Update cache hit rate
    const cacheHits = this.analyticsTracker.analytics.cache.hits;
    const totalCacheRequests = this.analyticsTracker.analytics.cache.totalRequests;
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;
    
    // Update cost savings
    this.metrics.totalCostSaved += this.analyticsTracker.analytics.costs.saved;
  }
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get error suggestion based on error message
   */
  getErrorSuggestion(errorMessage) {
    if (errorMessage.includes('premium')) {
      return 'This feature requires a premium subscription. Please upgrade your plan.';
    } else if (errorMessage.includes('rate limit')) {
      return 'You have reached your rate limit. Please try again later or upgrade your plan.';
    } else if (errorMessage.includes('image')) {
      return 'Please check your image format and size. Supported formats: JPG, PNG, WebP. Max size: 50MB.';
    } else {
      return 'Please try again or contact support if the issue persists.';
    }
  }
  
  /**
   * Health check for the enhanced AI processor
   */
  async healthCheck() {
    try {
      const componentHealth = {
        questionClassifier: this.questionClassifier ? 'healthy' : 'missing',
        smartRouter: this.smartRouter ? 'healthy' : 'missing',
        cacheManager: await this.cacheManager.healthCheck(),
        responseOptimizer: this.responseOptimizer.healthCheck(),
        analyticsTracker: this.analyticsTracker.healthCheck(),
        googleVision: await this.googleVision.healthCheck(),
        enhancedOCR: this.enhancedOCR ? 'healthy' : 'missing'
      };
      
      const allHealthy = Object.values(componentHealth).every(status => 
        status === 'healthy' || (typeof status === 'object' && status.status === 'healthy')
      );
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        components: componentHealth,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      analyticsData: this.analyticsTracker.analytics,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
const enhancedAIProcessor = new EnhancedAIProcessor();

export default enhancedAIProcessor; 