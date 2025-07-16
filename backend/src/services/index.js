// FrameSense Enhanced Services
// Master export for all AI analysis services

// Enhanced service categories
const Classification = require('./classification');
const EnhancedServices = require('./enhanced-services');
const Routing = require('./routing');
const Caching = require('./caching');
const Pipeline = require('./pipeline');

// Legacy services (will be gradually migrated)
const LegacyServices = {
  SubscriptionService: require('./subscription-service'),
  UserService: require('./user-service'),
  // Current AI processor will be replaced by Pipeline.EnhancedAIProcessor
  CurrentAIProcessor: require('./ai-processor'),
  // Current model selector will be enhanced by Classification.ModelSelector  
  CurrentModelSelector: require('./model-selector'),
  PromptOptimizer: require('./prompt-optimizer'),
  // Current OCR will be enhanced by EnhancedServices.EnhancedOCR
  CurrentOCRService: require('./ocr-service'),
  ImageOptimizer: require('./image-optimizer')
};

module.exports = {
  // Enhanced MVP services
  Classification,
  EnhancedServices,
  Routing,
  Caching,
  Pipeline,
  
  // Legacy services (for backward compatibility during migration)
  Legacy: LegacyServices,
  
  // Quick access to main components
  QuestionClassifier: Classification.QuestionClassifier,
  ModelSelector: Classification.ModelSelector,
  SmartRouter: Routing.SmartRouter,
  EnhancedAIProcessor: Pipeline.EnhancedAIProcessor,
  CacheManager: Caching.CacheManager
}; 