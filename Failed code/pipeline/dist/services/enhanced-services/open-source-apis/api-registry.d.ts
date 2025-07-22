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
export class APIPlugin {
    constructor(config?: {});
    config: {};
    enabled: boolean;
    healthStatus: string;
    lastHealthCheck: string | null;
    /**
     * Analyze image with the plugin's AI service
     * @param {Buffer|string} imageData - Image data (Buffer or base64)
     * @param {Object} questionType - Question type from classifier
     * @param {Object} parameters - Additional parameters
     * @returns {Promise<Object>} Analysis result
     */
    analyzeImage(imageData: Buffer | string, questionType: Object, parameters?: Object): Promise<Object>;
    /**
     * Get plugin capabilities
     * @returns {Array} List of capabilities (e.g., ['text', 'objects', 'scenes'])
     */
    getCapabilities(): any[];
    /**
     * Get estimated cost for analysis
     * @param {Object} questionType - Question type
     * @returns {number} Cost estimate in USD
     */
    getCost(questionType: Object): number;
    /**
     * Get estimated response time
     * @param {Object} questionType - Question type
     * @returns {number} Response time estimate in seconds
     */
    getResponseTime(questionType: Object): number;
    /**
     * Health check for the plugin service
     * @returns {Promise<Object>} Health status
     */
    healthCheck(): Promise<Object>;
    /**
     * Plugin-specific health check implementation
     * @returns {Promise<void>} Should resolve if healthy, throw if not
     */
    performHealthCheck(): Promise<void>;
    /**
     * Initialize the plugin
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Cleanup plugin resources
     * @returns {Promise<void>}
     */
    cleanup(): Promise<void>;
    /**
     * Get plugin metadata
     * @returns {Object} Plugin information
     */
    getMetadata(): Object;
}
/**
 * API Plugin Registry
 * Manages registration, discovery, and lifecycle of API plugins
 */
export class APIRegistry {
    registeredPlugins: Map<any, any>;
    enabledPlugins: Set<any>;
    pluginInstances: Map<any, any>;
    healthCheckInterval: NodeJS.Timeout | null;
    eventHandlers: Map<any, any>;
    /**
     * Register a new API plugin
     * @param {string} pluginId - Unique plugin identifier
     * @param {class} PluginClass - Plugin class (extends APIPlugin)
     * @param {Object} config - Plugin configuration
     */
    registerPlugin(pluginId: string, PluginClass: class, config?: Object): void;
    /**
     * Enable a registered plugin
     * @param {string} pluginId - Plugin to enable
     * @returns {Promise<void>}
     */
    enablePlugin(pluginId: string): Promise<void>;
    /**
     * Disable a plugin
     * @param {string} pluginId - Plugin to disable
     * @returns {Promise<void>}
     */
    disablePlugin(pluginId: string): Promise<void>;
    /**
     * Get enabled plugin instance
     * @param {string} pluginId - Plugin identifier
     * @returns {APIPlugin|null} Plugin instance or null
     */
    getPlugin(pluginId: string): APIPlugin | null;
    /**
     * Get all enabled plugins
     * @returns {Map} Map of enabled plugin instances
     */
    getEnabledPlugins(): Map<any, any>;
    /**
     * Find plugins by capabilities
     * @param {Array} requiredCapabilities - Required capabilities
     * @returns {Array} Plugins that support all required capabilities
     */
    findPluginsByCapabilities(requiredCapabilities: any[]): any[];
    /**
     * Get registry status and statistics
     * @returns {Object} Registry status
     */
    getStatus(): Object;
    /**
     * Start automatic health checks for all enabled plugins
     * @param {number} intervalMs - Health check interval in milliseconds
     */
    startHealthChecks(intervalMs?: number): void;
    /**
     * Stop automatic health checks
     */
    stopHealthChecks(): void;
    /**
     * Event handling for plugin lifecycle
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event: string, handler: Function): void;
    /**
     * Emit event to all handlers
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event: string, data: Object): void;
    /**
     * Cleanup all plugins and stop health checks
     * @returns {Promise<void>}
     */
    cleanup(): Promise<void>;
    /**
     * Load plugin configuration from file or environment
     * @param {Object} config - Configuration object
     */
    loadConfig(config: Object): void;
}
export const registry: APIRegistry;
export function discoverPlugins(): Promise<void>;
