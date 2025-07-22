/**
 * FrameSense API Plugin Registry
 * Extensible plugin system for open source AI API integration
 * 
 * MOMENT 1.4: Plugin Registration System (1 hour)
 * Makes it easy to add HuggingFace, Ollama, Replicate, and community APIs
 */

/**
 * Standard API Plugin Interface
 * All plugins must implement this interface for seamless integration
 */
class APIPlugin {
  constructor(config = {}) {
    this.config = config;
    this.enabled = false;
    this.healthStatus = 'unknown';
    this.lastHealthCheck = null;
  }

  /**
   * Analyze image with the plugin's AI service
   * @param {Buffer|string} imageData - Image data (Buffer or base64)
   * @param {Object} questionType - Question type from classifier
   * @param {Object} parameters - Additional parameters
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(imageData, questionType, parameters = {}) {
    throw new Error('analyzeImage must be implemented by plugin');
  }

  /**
   * Get plugin capabilities
   * @returns {Array} List of capabilities (e.g., ['text', 'objects', 'scenes'])
   */
  getCapabilities() {
    throw new Error('getCapabilities must be implemented by plugin');
  }

  /**
   * Get estimated cost for analysis
   * @param {Object} questionType - Question type
   * @returns {number} Cost estimate in USD
   */
  getCost(questionType) {
    throw new Error('getCost must be implemented by plugin');
  }

  /**
   * Get estimated response time
   * @param {Object} questionType - Question type  
   * @returns {number} Response time estimate in seconds
   */
  getResponseTime(questionType) {
    throw new Error('getResponseTime must be implemented by plugin');
  }

  /**
   * Health check for the plugin service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.performHealthCheck();
      const responseTime = Date.now() - startTime;
      
      const status = {
        healthy: true,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        message: 'Service is healthy'
      };
      
      this.healthStatus = 'healthy';
      this.lastHealthCheck = status.timestamp;
      
      return status;
    } catch (error) {
      const status = {
        healthy: false,
        responseTime: null,
        timestamp: new Date().toISOString(),
        message: error.message,
        error: error.toString()
      };
      
      this.healthStatus = 'unhealthy';
      this.lastHealthCheck = status.timestamp;
      
      return status;
    }
  }

  /**
   * Plugin-specific health check implementation
   * @returns {Promise<void>} Should resolve if healthy, throw if not
   */
  async performHealthCheck() {
    // Default implementation - plugins should override
    return Promise.resolve();
  }

  /**
   * Initialize the plugin
   * @returns {Promise<void>}
   */
  async initialize() {
    this.enabled = true;
    await this.healthCheck();
  }

  /**
   * Cleanup plugin resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.enabled = false;
  }

  /**
   * Get plugin metadata
   * @returns {Object} Plugin information
   */
  getMetadata() {
    return {
      name: this.constructor.name,
      version: this.config.version || '1.0.0',
      provider: this.config.provider || 'unknown',
      description: this.config.description || 'AI analysis plugin',
      author: this.config.author || 'Unknown',
      capabilities: this.getCapabilities(),
      enabled: this.enabled,
      healthStatus: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

/**
 * API Plugin Registry
 * Manages registration, discovery, and lifecycle of API plugins
 */
class APIRegistry {
  constructor() {
    this.registeredPlugins = new Map();
    this.enabledPlugins = new Set();
    this.pluginInstances = new Map();
    this.healthCheckInterval = null;
    this.eventHandlers = new Map();
  }

  /**
   * Register a new API plugin
   * @param {string} pluginId - Unique plugin identifier
   * @param {class} PluginClass - Plugin class (extends APIPlugin)
   * @param {Object} config - Plugin configuration
   */
  registerPlugin(pluginId, PluginClass, config = {}) {
    // Validate plugin ID
    if (!pluginId || typeof pluginId !== 'string') {
      throw new Error('Plugin ID must be a non-empty string');
    }
    
    if (this.registeredPlugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`);
    }

    // Validate plugin class
    if (!PluginClass || !PluginClass.prototype) {
      throw new Error('Plugin must be a valid class');
    }

    // Create plugin instance to validate interface
    const tempInstance = new PluginClass(config);
    if (!(tempInstance instanceof APIPlugin)) {
      throw new Error('Plugin must extend APIPlugin class');
    }

    // Validate required methods
    const requiredMethods = ['analyzeImage', 'getCapabilities', 'getCost', 'getResponseTime'];
    for (const method of requiredMethods) {
      if (typeof tempInstance[method] !== 'function') {
        throw new Error(`Plugin must implement ${method} method`);
      }
    }

    // Register the plugin
    this.registeredPlugins.set(pluginId, {
      id: pluginId,
      PluginClass: PluginClass,
      config: config,
      registeredAt: new Date().toISOString(),
      metadata: tempInstance.getMetadata()
    });

    this.emit('pluginRegistered', { pluginId, config });

    console.log(`✅ Plugin registered: ${pluginId}`);
  }

  /**
   * Enable a registered plugin
   * @param {string} pluginId - Plugin to enable
   * @returns {Promise<void>}
   */
  async enablePlugin(pluginId) {
    if (!this.registeredPlugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    if (this.enabledPlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is already enabled`);
      return;
    }

    try {
      // Create and initialize plugin instance
      const pluginInfo = this.registeredPlugins.get(pluginId);
      const instance = new pluginInfo.PluginClass(pluginInfo.config);
      
      await instance.initialize();
      
      this.pluginInstances.set(pluginId, instance);
      this.enabledPlugins.add(pluginId);
      
      this.emit('pluginEnabled', { pluginId, instance });
      
      console.log(`✅ Plugin enabled: ${pluginId}`);
    } catch (error) {
      console.error(`❌ Failed to enable plugin ${pluginId}:`, error.message);
      throw error;
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin to disable
   * @returns {Promise<void>}
   */
  async disablePlugin(pluginId) {
    if (!this.enabledPlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is not enabled`);
      return;
    }

    try {
      const instance = this.pluginInstances.get(pluginId);
      if (instance) {
        await instance.cleanup();
      }
      
      this.pluginInstances.delete(pluginId);
      this.enabledPlugins.delete(pluginId);
      
      this.emit('pluginDisabled', { pluginId });
      
      console.log(`✅ Plugin disabled: ${pluginId}`);
    } catch (error) {
      console.error(`❌ Failed to disable plugin ${pluginId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get enabled plugin instance
   * @param {string} pluginId - Plugin identifier
   * @returns {APIPlugin|null} Plugin instance or null
   */
  getPlugin(pluginId) {
    return this.pluginInstances.get(pluginId) || null;
  }

  /**
   * Get all enabled plugins
   * @returns {Map} Map of enabled plugin instances
   */
  getEnabledPlugins() {
    return new Map(this.pluginInstances);
  }

  /**
   * Find plugins by capabilities
   * @param {Array} requiredCapabilities - Required capabilities
   * @returns {Array} Plugins that support all required capabilities
   */
  findPluginsByCapabilities(requiredCapabilities) {
    const matchingPlugins = [];
    
    for (const [pluginId, instance] of this.pluginInstances) {
      const pluginCapabilities = instance.getCapabilities();
      const hasAllCapabilities = requiredCapabilities.every(cap => 
        pluginCapabilities.includes(cap)
      );
      
      if (hasAllCapabilities) {
        matchingPlugins.push({
          id: pluginId,
          instance: instance,
          capabilities: pluginCapabilities,
          metadata: instance.getMetadata()
        });
      }
    }
    
    return matchingPlugins;
  }

  /**
   * Get registry status and statistics
   * @returns {Object} Registry status
   */
  getStatus() {
    const registeredCount = this.registeredPlugins.size;
    const enabledCount = this.enabledPlugins.size;
    
    const pluginStatus = [];
    for (const [pluginId, info] of this.registeredPlugins) {
      const enabled = this.enabledPlugins.has(pluginId);
      const instance = enabled ? this.pluginInstances.get(pluginId) : null;
      
      pluginStatus.push({
        id: pluginId,
        enabled: enabled,
        metadata: info.metadata,
        healthStatus: instance ? instance.healthStatus : 'disabled',
        lastHealthCheck: instance ? instance.lastHealthCheck : null
      });
    }
    
    return {
      registeredPlugins: registeredCount,
      enabledPlugins: enabledCount,
      plugins: pluginStatus,
      healthCheckRunning: this.healthCheckInterval !== null
    };
  }

  /**
   * Start automatic health checks for all enabled plugins
   * @param {number} intervalMs - Health check interval in milliseconds
   */
  startHealthChecks(intervalMs = 300000) { // 5 minutes default
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      console.log('🔍 Running plugin health checks...');
      
      for (const [pluginId, instance] of this.pluginInstances) {
        try {
          await instance.healthCheck();
        } catch (error) {
          console.error(`❌ Health check failed for ${pluginId}:`, error.message);
          this.emit('pluginUnhealthy', { pluginId, error });
        }
      }
    }, intervalMs);
    
    console.log(`✅ Health checks started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('✅ Health checks stopped');
    }
  }

  /**
   * Event handling for plugin lifecycle
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Emit event to all handlers
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup all plugins and stop health checks
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.stopHealthChecks();
    
    const cleanupPromises = [];
    for (const [pluginId, instance] of this.pluginInstances) {
      cleanupPromises.push(
        instance.cleanup().catch(error => 
          console.error(`Error cleaning up ${pluginId}:`, error)
        )
      );
    }
    
    await Promise.all(cleanupPromises);
    
    this.pluginInstances.clear();
    this.enabledPlugins.clear();
    
    console.log('✅ All plugins cleaned up');
  }

  /**
   * Load plugin configuration from file or environment
   * @param {Object} config - Configuration object
   */
  loadConfig(config) {
    // Future implementation for loading plugin configs
    // from files, environment variables, or database
    console.log('🔧 Loading plugin configuration...');
    
    for (const [pluginId, pluginConfig] of Object.entries(config.plugins || {})) {
      if (pluginConfig.enabled && this.registeredPlugins.has(pluginId)) {
        this.enablePlugin(pluginId).catch(error => 
          console.error(`Failed to auto-enable ${pluginId}:`, error)
        );
      }
    }
  }
}

// Global registry instance
const registry = new APIRegistry();

// Future plugin auto-discovery (for development)
async function discoverPlugins() {
  // This will be implemented to automatically discover
  // and register plugins from the open-source-apis directory
  console.log('🔍 Plugin auto-discovery will be implemented in future versions');
}

module.exports = {
  APIPlugin,
  APIRegistry,
  registry, // Global instance for easy access
  discoverPlugins
}; 