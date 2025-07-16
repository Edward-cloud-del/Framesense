import { Router } from 'express';
import multer from 'multer';
import enhancedAIProcessor from '../services/pipeline/enhanced-ai-processor.js';
import { ModelSelector } from '../services/classification/model-selector.js';
import { QuestionClassifier } from '../services/classification/question-classifier.js';
import { TierAccess } from '../services/routing/tier-access.js';
import analyticsTracker from '../services/pipeline/analytics-tracker.js';
import UserService from '../services/user-service.js';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (increased for premium users)
  }
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required',
        code: 'AUTH_TOKEN_MISSING'
      });
    }
    
    const user = await UserService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: error.message,
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

/**
 * POST /api/v2/analyze
 * Main analysis endpoint using Enhanced AI Processor
 * 
 * Body: {
 *   imageData?: "base64..." | file upload,
 *   question: "Who is this person?",
 *   modelPreference?: "gpt-4-vision",
 *   forceModel?: false,
 *   cacheStrategy?: "default" | "force-refresh" | "cache-only"
 * }
 */
router.post('/analyze', authenticateUser, upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      question, 
      modelPreference,
      forceModel = false,
      cacheStrategy = 'default'
    } = req.body;
    
    let imageData;
    
    // Handle image from either base64 string or uploaded file
    if (req.file) {
      // Convert uploaded file to base64
      const buffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      const base64 = buffer.toString('base64');
      imageData = `data:${mimeType};base64,${base64}`;
    } else if (req.body.imageData) {
      imageData = req.body.imageData;
    }
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
        code: 'QUESTION_MISSING'
      });
    }
    
    console.log(`🚀 Enhanced API v2: Processing request for user ${req.user.id}`);
    console.log(`📊 Request details: question="${question.substring(0, 50)}...", hasImage=${!!imageData}, modelPreference=${modelPreference}`);
    
    // Process through Enhanced AI Processor
    const options = {
      modelPreference,
      forceModel,
      cacheStrategy
    };
    
    const result = await enhancedAIProcessor.processAnalysisRequest(
      imageData,
      question,
      req.user.id,
      options
    );
    
    // Add API-specific metadata
    result.metadata = {
      ...result.metadata,
      apiVersion: 'v2',
      totalResponseTime: Date.now() - startTime,
      user: {
        id: req.user.id,
        tier: req.user.tier
      }
    };
    
    console.log(`✅ Enhanced API v2: Request completed in ${Date.now() - startTime}ms`);
    res.json(result);
    
  } catch (error) {
    console.error(`❌ Enhanced API v2: Analysis failed:`, error.message);
    
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'ANALYSIS_FAILED',
      metadata: {
        apiVersion: 'v2',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/v2/models/available
 * Get available models for user's tier
 */
router.get('/models/available', authenticateUser, async (req, res) => {
  try {
    const userTier = req.user.tier || 'free';
    const modelSelectorInstance = new ModelSelector();
    const availableModels = await modelSelectorInstance.getAvailableModels(userTier);
    
    res.json({
      success: true,
      models: availableModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        tier: model.tier,
        cost: model.cost,
        speed: model.speed,
        useCase: model.useCase,
        capabilities: model.capabilities,
        costPerRequest: model.costPerRequest,
        avgResponseTime: model.avgResponseTime,
        qualityScore: model.qualityScore
      })),
      userTier,
      metadata: {
        timestamp: new Date().toISOString(),
        totalModels: availableModels.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'MODELS_FETCH_FAILED'
    });
  }
});

/**
 * PUT /api/v2/user/model-preferences
 * Update user model preferences
 * 
 * Body: {
 *   defaultModel?: "gpt-4-vision",
 *   autoUpgrade?: true,
 *   budgetLimit?: 10.00,
 *   costOptimization?: true
 * }
 */
router.put('/user/model-preferences', authenticateUser, async (req, res) => {
  try {
    const {
      defaultModel,
      autoUpgrade,
      budgetLimit,
      costOptimization
    } = req.body;
    
    // Validate model exists and user has access
    if (defaultModel) {
      const modelSelectorInstance = new ModelSelector();
      const availableModels = await modelSelectorInstance.getAvailableModels(req.user.tier);
      const modelExists = availableModels.find(m => m.id === defaultModel);
      
      if (!modelExists) {
        return res.status(400).json({
          success: false,
          message: `Model "${defaultModel}" not available for your tier (${req.user.tier})`,
          code: 'MODEL_NOT_AVAILABLE'
        });
      }
    }
    
    // Update user preferences (simplified - in real implementation would update database)
    const updatedPreferences = {
      defaultModel: defaultModel || req.user.preferences?.defaultModel,
      autoUpgrade: autoUpgrade !== undefined ? autoUpgrade : req.user.preferences?.autoUpgrade,
      budgetLimit: budgetLimit !== undefined ? budgetLimit : req.user.preferences?.budgetLimit,
      costOptimization: costOptimization !== undefined ? costOptimization : req.user.preferences?.costOptimization
    };
    
    console.log(`💾 Updating preferences for user ${req.user.id}:`, updatedPreferences);
    
    res.json({
      success: true,
      message: 'Model preferences updated successfully',
      preferences: updatedPreferences,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'PREFERENCES_UPDATE_FAILED'
    });
  }
});

/**
 * GET /api/v2/capabilities
 * Get analysis capabilities by user tier
 */
router.get('/capabilities', authenticateUser, async (req, res) => {
  try {
    const userTier = req.user.tier || 'free';
    const tierAccessInstance = new TierAccess(UserService, analyticsTracker);
    const questionClassifierInstance = new QuestionClassifier();
    
    // Get tier permissions directly
    const tierCapabilities = tierAccessInstance.TIER_PERMISSIONS[userTier] || tierAccessInstance.TIER_PERMISSIONS.free;
    const availableQuestionTypes = questionClassifierInstance.getAvailableQuestionTypes(userTier);
    const usageStats = await analyticsTracker.getUserUsageStats(req.user.id);
    
    res.json({
      success: true,
      tier: userTier,
      services: tierCapabilities.services,
      questionTypes: availableQuestionTypes.map(qt => ({
        id: qt.id,
        description: qt.description,
        capabilities: qt.capabilities,
        estimatedCost: qt.estimatedCost,
        responseTime: qt.responseTime
      })),
      limits: {
        dailyLimit: tierCapabilities.dailyLimit,
        monthlyLimit: tierCapabilities.monthlyLimit,
        dailyUsed: usageStats.dailyUsage || 0,
        monthlyUsed: usageStats.monthlyUsage || 0,
        dailyRemaining: Math.max(0, tierCapabilities.dailyLimit - (usageStats.dailyUsage || 0)),
        monthlyRemaining: Math.max(0, tierCapabilities.monthlyLimit - (usageStats.monthlyUsage || 0))
      },
      features: tierCapabilities.features,
      restrictions: {
        maxImageSize: tierCapabilities.maxImageSize,
        maxConcurrentRequests: tierCapabilities.maxConcurrentRequests,
        priority: tierCapabilities.priority
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'CAPABILITIES_FETCH_FAILED'
    });
  }
});

/**
 * GET /api/v2/usage/stats
 * Get usage statistics
 * 
 * Query params:
 *   ?period=7d&breakdown=service&detailed=true
 */
router.get('/usage/stats', authenticateUser, async (req, res) => {
  try {
    const {
      period = '7d',
      breakdown = 'service',
      detailed = 'false'
    } = req.query;
    
    const isDetailed = detailed === 'true';
    const userId = req.query.userId === 'all' && req.user.tier === 'admin' ? null : req.user.id;
    
    // Generate report through analytics tracker
    const report = analyticsTracker.generateReport(userId, period, breakdown);
    
    // Add user-specific data
    const userStats = await analyticsTracker.getUserStats(req.user.id);
    
    const response = {
      success: true,
      period,
      breakdown,
      userId: userId || 'all',
      summary: report.summary,
      userStats: {
        totalRequests: userStats.totalRequests || 0,
        totalCost: userStats.totalCost || 0,
        averageResponseTime: userStats.averageResponseTime || 0,
        favoriteServices: userStats.favoriteServices || {},
        recentActivity: userStats.recentActivity || []
      },
      metadata: {
        generatedAt: report.metadata.generatedAt,
        apiVersion: 'v2'
      }
    };
    
    // Add detailed breakdown if requested
    if (isDetailed) {
      response.details = report.details;
      response.systemMetrics = analyticsTracker.analytics;
    }
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'USAGE_STATS_FAILED'
    });
  }
});

/**
 * GET /api/v2/health
 * Health check for Enhanced AI system
 */
router.get('/health', async (req, res) => {
  try {
    const health = await enhancedAIProcessor.healthCheck();
    const metrics = enhancedAIProcessor.getMetrics();
    
    res.json({
      success: true,
      status: health.status,
      components: health.components,
      metrics: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.totalRequests > 0 ? 
          (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
        averageResponseTime: metrics.averageResponseTime,
        cacheHitRate: metrics.cacheHitRate,
        totalCostSaved: metrics.totalCostSaved
      },
      apiVersion: 'v2',
      timestamp: health.timestamp
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: error.message,
      apiVersion: 'v2',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v2/question-types
 * Get available question types and their descriptions
 */
router.get('/question-types', authenticateUser, async (req, res) => {
  try {
    const userTier = req.user.tier || 'free';
    const questionClassifierInstance = new QuestionClassifier();
    const questionTypes = questionClassifierInstance.getAvailableQuestionTypes(userTier);
    
    res.json({
      success: true,
      questionTypes: questionTypes.map(qt => ({
        id: qt.id,
        description: qt.description,
        tier: qt.tier,
        estimatedCost: qt.estimatedCost,
        responseTime: qt.responseTime,
        capabilities: qt.capabilities,
        examples: qt.patterns.slice(0, 3).map(p => p.source.replace(/[\\/^$*+?.()|[\]{}]/g, ''))
      })),
      userTier,
      metadata: {
        timestamp: new Date().toISOString(),
        totalTypes: questionTypes.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'QUESTION_TYPES_FAILED'
    });
  }
});

/**
 * POST /api/v2/cache/clear
 * Clear user's cache (admin or user's own cache)
 */
router.post('/cache/clear', authenticateUser, async (req, res) => {
  try {
    const { cacheType = 'user', pattern } = req.body;
    
    // Only allow users to clear their own cache unless admin
    if (cacheType !== 'user' && req.user.tier !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to clear system cache',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    let clearCount = 0;
    
    if (cacheType === 'user') {
      // Clear user-specific cache entries
      clearCount = await enhancedAIProcessor.cacheManager.clearUserCache(req.user.id);
    } else if (cacheType === 'pattern' && pattern) {
      // Clear by pattern (admin only)
      clearCount = await enhancedAIProcessor.cacheManager.clearByPattern(pattern);
    } else if (cacheType === 'all') {
      // Clear all cache (admin only)
      clearCount = await enhancedAIProcessor.cacheManager.clearAll();
    }
    
    res.json({
      success: true,
      message: `Cache cleared successfully`,
      clearedEntries: clearCount,
      cacheType,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: 'CACHE_CLEAR_FAILED'
    });
  }
});

export default router; 