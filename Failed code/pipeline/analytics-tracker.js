import fs from 'fs/promises';
import path from 'path';

/**
 * Comprehensive Analytics Tracker
 * MOMENT 4.5: Track usage, costs, performance, quality, and generate reports
 */
class AnalyticsTracker {
  constructor() {
    // Core analytics data
    this.analytics = {
      requests: {
        total: 0,
        byService: {},
        byUser: {},
        byTier: {},
        byHour: {},
        byDay: {},
        successful: 0,
        failed: 0
      },
      
      performance: {
        totalResponseTime: 0,
        averageResponseTime: 0,
        byService: {},
        slowestRequests: [],
        fastestRequests: []
      },
      
      costs: {
        total: 0,
        saved: 0,
        byService: {},
        byUser: {},
        byTier: {},
        dailySpend: {},
        monthlySpend: {}
      },
      
      cache: {
        totalRequests: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        byService: {},
        savings: {
          time: 0,
          cost: 0
        }
      },
      
      quality: {
        averageConfidence: 0,
        byService: {},
        userSatisfaction: {},
        errorTypes: {}
      },
      
      usage: {
        peakHours: {},
        popularServices: {},
        userPatterns: {},
        tierUtilization: {}
      }
    };
    
    // Service cost mapping (per request)
    this.serviceCosts = {
      'OCR_RESULTS': 0.001,
      'ENHANCED_OCR': 0.0025,
      'GOOGLE_VISION_TEXT': 0.0015,
      'GOOGLE_VISION_OBJECTS': 0.006,
      'GOOGLE_VISION_WEB': 0.0035,
      'GOOGLE_VISION_LOGO': 0.0015,
      'CELEBRITY_IDS': 0.0035,
      'OPENAI_RESPONSES': 0.03,
      'OPEN_SOURCE_API': 0.001
    };
    
    // Tier multipliers for costs
    this.tierMultipliers = {
      'free': 1.0,
      'pro': 0.8,  // 20% discount
      'premium': 0.6  // 40% discount
    };
    
    // Data persistence settings
    this.persistenceConfig = {
      enabled: true,
      interval: 300000, // 5 minutes
      dataFile: 'analytics-data.json',
      backupInterval: 86400000, // 24 hours
      maxBackups: 7
    };
    
    // Real-time metrics
    this.realtimeMetrics = {
      currentHourRequests: 0,
      currentDayRequests: 0,
      lastHourCosts: 0,
      activeUsers: new Set(),
      recentErrors: []
    };
    
    this.initialize();
  }
  
  /**
   * Initialize analytics tracker
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Analytics Tracker...');
      
      // Load existing analytics data
      await this.loadAnalyticsData();
      
      // Start persistence if enabled
      if (this.persistenceConfig.enabled) {
        this.startPersistence();
      }
      
      // Start real-time metrics updates
      this.startRealtimeTracking();
      
      console.log('✅ Analytics Tracker initialized successfully');
      
    } catch (error) {
      console.error('❌ Analytics Tracker initialization failed:', error.message);
    }
  }
  
  /**
   * Track a request with comprehensive metrics
   */
  async trackRequest(requestData) {
    const timestamp = Date.now();
    const hour = new Date().getHours();
    const day = new Date().toISOString().split('T')[0];
    
    try {
      const {
        userId,
        userTier = 'free',
        questionType,
        service,
        model,
        responseTime,
        success = true,
        cached = false,
        confidence = null,
        error = null,
        imageSize = 0,
        questionText = ''
      } = requestData;
      
      // Track basic request metrics
      this.analytics.requests.total++;
      this.realtimeMetrics.currentHourRequests++;
      this.realtimeMetrics.currentDayRequests++;
      
      if (success) {
        this.analytics.requests.successful++;
      } else {
        this.analytics.requests.failed++;
        this.trackError(error, service, userId);
      }
      
      // Track by service
      if (!this.analytics.requests.byService[service]) {
        this.analytics.requests.byService[service] = 0;
      }
      this.analytics.requests.byService[service]++;
      
      // Track by user
      if (!this.analytics.requests.byUser[userId]) {
        this.analytics.requests.byUser[userId] = {
          count: 0,
          tier: userTier,
          totalCost: 0,
          services: {}
        };
      }
      this.analytics.requests.byUser[userId].count++;
      this.realtimeMetrics.activeUsers.add(userId);
      
      // Track by tier
      if (!this.analytics.requests.byTier[userTier]) {
        this.analytics.requests.byTier[userTier] = 0;
      }
      this.analytics.requests.byTier[userTier]++;
      
      // Track by time
      if (!this.analytics.requests.byHour[hour]) {
        this.analytics.requests.byHour[hour] = 0;
      }
      this.analytics.requests.byHour[hour]++;
      
      if (!this.analytics.requests.byDay[day]) {
        this.analytics.requests.byDay[day] = 0;
      }
      this.analytics.requests.byDay[day]++;
      
      // Track performance metrics
      this.analytics.performance.totalResponseTime += responseTime;
      this.analytics.performance.averageResponseTime = 
        this.analytics.performance.totalResponseTime / this.analytics.requests.total;
      
      if (!this.analytics.performance.byService[service]) {
        this.analytics.performance.byService[service] = {
          totalTime: 0,
          requestCount: 0,
          averageTime: 0
        };
      }
      
      const servicePerf = this.analytics.performance.byService[service];
      servicePerf.totalTime += responseTime;
      servicePerf.requestCount++;
      servicePerf.averageTime = servicePerf.totalTime / servicePerf.requestCount;
      
      // Track cost metrics
      const cost = this.calculateRequestCost(service, userTier, cached);
      this.analytics.costs.total += cost;
      this.realtimeMetrics.lastHourCosts += cost;
      
      if (!this.analytics.costs.byService[service]) {
        this.analytics.costs.byService[service] = 0;
      }
      this.analytics.costs.byService[service] += cost;
      
      if (!this.analytics.costs.byUser[userId]) {
        this.analytics.costs.byUser[userId] = 0;
      }
      this.analytics.costs.byUser[userId] += cost;
      this.analytics.requests.byUser[userId].totalCost += cost;
      
      if (!this.analytics.costs.dailySpend[day]) {
        this.analytics.costs.dailySpend[day] = 0;
      }
      this.analytics.costs.dailySpend[day] += cost;
      
      // Track cache performance
      if (cached) {
        this.analytics.cache.hits++;
        const savedCost = this.serviceCosts[service] || 0.001;
        this.analytics.cache.savings.cost += savedCost;
        this.analytics.cache.savings.time += responseTime;
        this.analytics.costs.saved += savedCost;
      } else {
        this.analytics.cache.misses++;
      }
      
      this.analytics.cache.totalRequests++;
      this.analytics.cache.hitRate = 
        (this.analytics.cache.hits / this.analytics.cache.totalRequests) * 100;
      
      // Track quality metrics
      if (confidence !== null) {
        if (!this.analytics.quality.byService[service]) {
          this.analytics.quality.byService[service] = {
            totalConfidence: 0,
            requestCount: 0,
            averageConfidence: 0
          };
        }
        
        const serviceQuality = this.analytics.quality.byService[service];
        serviceQuality.totalConfidence += confidence;
        serviceQuality.requestCount++;
        serviceQuality.averageConfidence = 
          serviceQuality.totalConfidence / serviceQuality.requestCount;
      }
      
      // Track usage patterns
      this.trackUsagePatterns(userId, service, questionType, hour, day);
      
      console.log(`📊 Request tracked: ${service} for ${userId} (${responseTime}ms, $${cost.toFixed(4)})`);
      
      return {
        success: true,
        cost,
        cached,
        timestamp
      };
      
    } catch (error) {
      console.error('❌ Request tracking failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp
      };
    }
  }
  
  /**
   * Track cache performance specifically
   */
  trackCachePerformance(cacheEvent) {
    try {
      const { type, service, hit, responseTime, cost = 0 } = cacheEvent;
      
      if (!this.analytics.cache.byService[service]) {
        this.analytics.cache.byService[service] = {
          requests: 0,
          hits: 0,
          misses: 0,
          hitRate: 0,
          timeSaved: 0,
          costSaved: 0
        };
      }
      
      const serviceCacheStats = this.analytics.cache.byService[service];
      serviceCacheStats.requests++;
      
      if (hit) {
        serviceCacheStats.hits++;
        serviceCacheStats.timeSaved += responseTime;
        serviceCacheStats.costSaved += cost;
      } else {
        serviceCacheStats.misses++;
      }
      
      serviceCacheStats.hitRate = 
        (serviceCacheStats.hits / serviceCacheStats.requests) * 100;
      
    } catch (error) {
      console.error('❌ Cache performance tracking failed:', error.message);
    }
  }
  
  /**
   * Track errors for analysis
   */
  trackError(error, service, userId) {
    const errorInfo = {
      timestamp: Date.now(),
      service,
      userId,
      message: error?.message || error || 'Unknown error',
      type: this.categorizeError(error)
    };
    
    // Add to recent errors (keep last 100)
    this.realtimeMetrics.recentErrors.unshift(errorInfo);
    if (this.realtimeMetrics.recentErrors.length > 100) {
      this.realtimeMetrics.recentErrors.pop();
    }
    
    // Track error types
    const errorType = errorInfo.type;
    if (!this.analytics.quality.errorTypes[errorType]) {
      this.analytics.quality.errorTypes[errorType] = 0;
    }
    this.analytics.quality.errorTypes[errorType]++;
  }
  
  /**
   * Categorize errors for better analysis
   */
  categorizeError(error) {
    const message = error?.message || error || '';
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('authentication')) return 'auth_error';
    if (message.includes('not found')) return 'not_found';
    if (message.includes('invalid')) return 'validation_error';
    if (message.includes('network')) return 'network_error';
    if (message.includes('token')) return 'token_error';
    
    return 'unknown_error';
  }
  
  /**
   * Track user satisfaction (can be called from feedback endpoints)
   */
  trackUserSatisfaction(userId, rating, feedback = '', service = null) {
    try {
      if (!this.analytics.quality.userSatisfaction[userId]) {
        this.analytics.quality.userSatisfaction[userId] = {
          ratings: [],
          averageRating: 0,
          feedbackCount: 0
        };
      }
      
      const userSatisfaction = this.analytics.quality.userSatisfaction[userId];
      userSatisfaction.ratings.push({
        rating,
        feedback,
        service,
        timestamp: Date.now()
      });
      
      userSatisfaction.averageRating = 
        userSatisfaction.ratings.reduce((sum, r) => sum + r.rating, 0) / 
        userSatisfaction.ratings.length;
      
      userSatisfaction.feedbackCount++;
      
      console.log(`👤 User satisfaction tracked: ${userId} rated ${rating}/5`);
      
    } catch (error) {
      console.error('❌ User satisfaction tracking failed:', error.message);
    }
  }
  
  /**
   * Track usage patterns for insights
   */
  trackUsagePatterns(userId, service, questionType, hour, day) {
    // Track popular services
    if (!this.analytics.usage.popularServices[service]) {
      this.analytics.usage.popularServices[service] = 0;
    }
    this.analytics.usage.popularServices[service]++;
    
    // Track peak hours
    if (!this.analytics.usage.peakHours[hour]) {
      this.analytics.usage.peakHours[hour] = 0;
    }
    this.analytics.usage.peakHours[hour]++;
    
    // Track user patterns
    if (!this.analytics.usage.userPatterns[userId]) {
      this.analytics.usage.userPatterns[userId] = {
        favoriteServices: {},
        activeHours: {},
        questionTypes: {}
      };
    }
    
    const userPattern = this.analytics.usage.userPatterns[userId];
    
    if (!userPattern.favoriteServices[service]) {
      userPattern.favoriteServices[service] = 0;
    }
    userPattern.favoriteServices[service]++;
    
    if (!userPattern.activeHours[hour]) {
      userPattern.activeHours[hour] = 0;
    }
    userPattern.activeHours[hour]++;
    
    if (questionType && !userPattern.questionTypes[questionType]) {
      userPattern.questionTypes[questionType] = 0;
    }
    if (questionType) {
      userPattern.questionTypes[questionType]++;
    }
  }
  
  /**
   * Calculate request cost based on service and tier
   */
  calculateRequestCost(service, userTier, cached = false) {
    if (cached) return 0; // No cost for cached requests
    
    const baseCost = this.serviceCosts[service] || 0.001;
    const tierMultiplier = this.tierMultipliers[userTier] || 1.0;
    
    return baseCost * tierMultiplier;
  }
  
  /**
   * Generate comprehensive usage report
   */
  generateReport(userId = null, timeRange = '7d', breakdown = 'service') {
    try {
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange,
          breakdown,
          userId: userId || 'all'
        },
        summary: this.generateSummary(userId, timeRange),
        details: {}
      };
      
      // Add specific breakdowns
      switch (breakdown) {
        case 'service':
          report.details = this.generateServiceBreakdown(userId, timeRange);
          break;
          
        case 'time':
          report.details = this.generateTimeBreakdown(userId, timeRange);
          break;
          
        case 'cost':
          report.details = this.generateCostBreakdown(userId, timeRange);
          break;
          
        case 'performance':
          report.details = this.generatePerformanceBreakdown(userId, timeRange);
          break;
          
        default:
          report.details = this.generateServiceBreakdown(userId, timeRange);
      }
      
      console.log(`📋 Generated ${breakdown} report for ${userId || 'all users'}`);
      return report;
      
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      return {
        error: error.message,
        generatedAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * Generate summary statistics
   */
  generateSummary(userId, timeRange) {
    const summary = {
      totalRequests: userId ? 
        (this.analytics.requests.byUser[userId]?.count || 0) : 
        this.analytics.requests.total,
        
      totalCost: userId ? 
        (this.analytics.costs.byUser[userId] || 0) : 
        this.analytics.costs.total,
        
      costSaved: this.analytics.costs.saved,
      
      averageResponseTime: this.analytics.performance.averageResponseTime,
      
      cacheHitRate: this.analytics.cache.hitRate,
      
      successRate: this.analytics.requests.total > 0 ? 
        (this.analytics.requests.successful / this.analytics.requests.total) * 100 : 0,
        
      activeUsers: this.realtimeMetrics.activeUsers.size,
      
      topServices: this.getTopServices(5),
      
      recentErrors: this.realtimeMetrics.recentErrors.slice(0, 5)
    };
    
    return summary;
  }
  
  /**
   * Get top services by usage
   */
  getTopServices(limit = 5) {
    return Object.entries(this.analytics.requests.byService)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([service, count]) => ({
        service,
        count,
        percentage: (count / this.analytics.requests.total) * 100
      }));
  }
  
  /**
   * Generate service breakdown
   */
  generateServiceBreakdown(userId, timeRange) {
    const breakdown = {};
    
    for (const [service, count] of Object.entries(this.analytics.requests.byService)) {
      breakdown[service] = {
        requests: count,
        cost: this.analytics.costs.byService[service] || 0,
        averageResponseTime: this.analytics.performance.byService[service]?.averageTime || 0,
        cacheHitRate: this.analytics.cache.byService[service]?.hitRate || 0,
        confidence: this.analytics.quality.byService[service]?.averageConfidence || 0
      };
    }
    
    return breakdown;
  }
  
  /**
   * Generate time breakdown
   */
  generateTimeBreakdown(userId, timeRange) {
    return {
      hourly: this.analytics.requests.byHour,
      daily: this.analytics.requests.byDay,
      peakHours: this.analytics.usage.peakHours
    };
  }
  
  /**
   * Generate cost breakdown
   */
  generateCostBreakdown(userId, timeRange) {
    return {
      totalCost: this.analytics.costs.total,
      costSaved: this.analytics.costs.saved,
      byService: this.analytics.costs.byService,
      byTier: this.analytics.costs.byTier,
      dailySpend: this.analytics.costs.dailySpend,
      projectedMonthlyCost: this.calculateProjectedMonthlyCost()
    };
  }
  
  /**
   * Generate performance breakdown
   */
  generatePerformanceBreakdown(userId, timeRange) {
    return {
      overall: {
        averageResponseTime: this.analytics.performance.averageResponseTime,
        totalRequests: this.analytics.requests.total,
        successRate: (this.analytics.requests.successful / this.analytics.requests.total) * 100
      },
      byService: this.analytics.performance.byService,
      cache: {
        hitRate: this.analytics.cache.hitRate,
        timeSaved: this.analytics.cache.savings.time,
        costSaved: this.analytics.cache.savings.cost
      },
      errors: this.analytics.quality.errorTypes
    };
  }
  
  /**
   * Calculate projected monthly cost
   */
  calculateProjectedMonthlyCost() {
    const today = new Date().toISOString().split('T')[0];
    const todayCost = this.analytics.costs.dailySpend[today] || 0;
    
    // Simple projection based on today's usage
    return todayCost * 30;
  }
  
  /**
   * Get real-time metrics
   */
  getRealtimeMetrics() {
    return {
      ...this.realtimeMetrics,
      activeUsers: this.realtimeMetrics.activeUsers.size,
      currentUtilization: this.calculateCurrentUtilization(),
      systemHealth: this.calculateSystemHealth()
    };
  }
  
  /**
   * Calculate current system utilization
   */
  calculateCurrentUtilization() {
    const hour = new Date().getHours();
    const currentHourRequests = this.realtimeMetrics.currentHourRequests;
    const avgHourlyRequests = Object.values(this.analytics.requests.byHour)
      .reduce((sum, count) => sum + count, 0) / 24;
    
    return avgHourlyRequests > 0 ? (currentHourRequests / avgHourlyRequests) * 100 : 0;
  }
  
  /**
   * Calculate overall system health score
   */
  calculateSystemHealth() {
    const successRate = this.analytics.requests.total > 0 ? 
      (this.analytics.requests.successful / this.analytics.requests.total) * 100 : 100;
    
    const cachePerformance = this.analytics.cache.hitRate;
    const responseTimeScore = this.analytics.performance.averageResponseTime < 5000 ? 100 : 
      Math.max(0, 100 - (this.analytics.performance.averageResponseTime - 5000) / 100);
    
    return Math.round((successRate + cachePerformance + responseTimeScore) / 3);
  }
  
  /**
   * Start real-time tracking
   */
  startRealtimeTracking() {
    // Reset hourly metrics every hour
    setInterval(() => {
      this.realtimeMetrics.currentHourRequests = 0;
      this.realtimeMetrics.lastHourCosts = 0;
    }, 3600000); // 1 hour
    
    // Reset daily metrics every day
    setInterval(() => {
      this.realtimeMetrics.currentDayRequests = 0;
      this.realtimeMetrics.activeUsers.clear();
    }, 86400000); // 24 hours
    
    console.log('⏱️ Real-time tracking started');
  }
  
  /**
   * Start data persistence
   */
  startPersistence() {
    // Save analytics data periodically
    setInterval(() => {
      this.saveAnalyticsData();
    }, this.persistenceConfig.interval);
    
    // Create daily backups
    setInterval(() => {
      this.createBackup();
    }, this.persistenceConfig.backupInterval);
    
    console.log('💾 Analytics persistence started');
  }
  
  /**
   * Save analytics data to file
   */
  async saveAnalyticsData() {
    try {
      const dataToSave = {
        analytics: this.analytics,
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        this.persistenceConfig.dataFile, 
        JSON.stringify(dataToSave, null, 2)
      );
      
    } catch (error) {
      console.error('❌ Failed to save analytics data:', error.message);
    }
  }
  
  /**
   * Load analytics data from file
   */
  async loadAnalyticsData() {
    try {
      const data = await fs.readFile(this.persistenceConfig.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.analytics) {
        this.analytics = { ...this.analytics, ...parsed.analytics };
        console.log('📊 Analytics data loaded from file');
      }
      
    } catch (error) {
      console.log('ℹ️ No existing analytics data found, starting fresh');
    }
  }
  
  /**
   * Create backup of analytics data
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFile = `analytics-backup-${timestamp}.json`;
      
      const dataToBackup = {
        analytics: this.analytics,
        backedUpAt: new Date().toISOString()
      };
      
      await fs.writeFile(backupFile, JSON.stringify(dataToBackup, null, 2));
      console.log(`📦 Analytics backup created: ${backupFile}`);
      
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
    }
  }
  
  /**
   * Get comprehensive analytics metrics
   */
  getMetrics() {
    return {
      requests: this.analytics.requests,
      performance: this.analytics.performance,
      costs: this.analytics.costs,
      cache: this.analytics.cache,
      quality: this.analytics.quality,
      usage: this.analytics.usage,
      realtime: this.getRealtimeMetrics()
    };
  }
  
  /**
   * Health check for analytics tracker
   */
  healthCheck() {
    return {
      status: 'healthy',
      dataIntegrity: this.analytics.requests.total >= 0,
      persistenceEnabled: this.persistenceConfig.enabled,
      realtimeTracking: true,
      metrics: {
        totalRequests: this.analytics.requests.total,
        totalCosts: this.analytics.costs.total,
        systemHealth: this.calculateSystemHealth()
      }
    };
  }
  
  /**
   * Clear all analytics data (for testing)
   */
  clearAllData() {
    this.analytics = {
      requests: { total: 0, byService: {}, byUser: {}, byTier: {}, byHour: {}, byDay: {}, successful: 0, failed: 0 },
      performance: { totalResponseTime: 0, averageResponseTime: 0, byService: {} },
      costs: { total: 0, saved: 0, byService: {}, byUser: {}, byTier: {}, dailySpend: {} },
      cache: { totalRequests: 0, hits: 0, misses: 0, hitRate: 0, byService: {}, savings: { time: 0, cost: 0 } },
      quality: { averageConfidence: 0, byService: {}, userSatisfaction: {}, errorTypes: {} },
      usage: { peakHours: {}, popularServices: {}, userPatterns: {}, tierUtilization: {} }
    };
    
    this.realtimeMetrics.activeUsers.clear();
    this.realtimeMetrics.recentErrors = [];
    
    console.log('🧹 All analytics data cleared');
  }
}

// Create and export singleton instance
const analyticsTracker = new AnalyticsTracker();
export default analyticsTracker; 