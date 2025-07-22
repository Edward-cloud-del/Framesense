export class APIPlugin {
    constructor(config?: {});
    config: {};
    name: string;
    version: string;
    description: string;
    author: string;
    /**
     * Analyze image with AI service
     * @param {Buffer|string} imageData - Image data
     * @param {string} questionType - Type of analysis requested
     * @param {Object} parameters - Additional parameters
     * @returns {Object} Analysis result
     */
    analyzeImage(imageData: Buffer | string, questionType: string, parameters?: Object): Object;
    /**
     * Get plugin capabilities
     * @returns {Array} Array of capability strings
     */
    getCapabilities(): any[];
    /**
     * Get cost per request
     * @returns {number} Cost in USD
     */
    getCost(): number;
    /**
     * Get average response time
     * @returns {number} Response time in milliseconds
     */
    getResponseTime(): number;
    /**
     * Health check
     * @returns {Object} Health status
     */
    healthCheck(): Object;
}
export default pluginLoader;
declare const pluginLoader: PluginLoader;
/**
 * Plugin Loader System - MOMENT 5.4
 * Dynamic API loading system for future open source integrations
 *
 * Features:
 * - Dynamic plugin discovery and loading
 * - Standardized plugin interface validation
 * - Plugin lifecycle management (load, enable, disable, unload)
 * - Configuration management per plugin
 * - Health monitoring and metrics collection
 * - Automatic fallback and error recovery
 */
declare class PluginLoader {
    registeredPlugins: Map<any, any>;
    enabledPlugins: Set<any>;
    pluginConfigs: Map<any, any>;
    pluginMetrics: Map<any, any>;
    pluginPaths: string[];
    requiredInterface: string[];
    lifecycleHooks: {
        beforeLoad: never[];
        afterLoad: never[];
        beforeEnable: never[];
        afterEnable: never[];
        beforeDisable: never[];
        afterDisable: never[];
        onError: never[];
    };
    metrics: {
        totalPlugins: number;
        enabledPlugins: number;
        loadedPlugins: number;
        failedPlugins: number;
        totalRequests: number;
        averageResponseTime: number;
    };
    /**
     * Discover and register available plugins
     */
    discoverPlugins(): Promise<{
        id: string;
        path: string;
        metadata: {};
        discovered: boolean;
    }[]>;
    /**
     * Load a plugin by ID
     */
    loadPlugin(pluginId: any, config?: {}): Promise<any>;
    /**
     * Enable a loaded plugin for use
     */
    enablePlugin(pluginId: any): Promise<void>;
    /**
     * Disable a plugin
     */
    disablePlugin(pluginId: any): Promise<void>;
    /**
     * Get all available plugins that match required capabilities
     */
    getAvailablePlugins(capabilities?: any[]): {
        id: any;
        capabilities: any;
        cost: any;
        responseTime: any;
        metadata: any;
        metrics: any;
    }[];
    /**
     * Execute a plugin with request tracking
     */
    executePlugin(pluginId: any, imageData: any, questionType: any, parameters?: {}): Promise<{
        success: boolean;
        result: any;
        metadata: {
            pluginId: any;
            responseTime: number;
            cost: any;
            timestamp: string;
        };
    }>;
    /**
     * Validate plugin interface compliance
     */
    validatePluginInterface(pluginInstance: any, pluginId: any): Promise<void>;
    /**
     * Read plugin metadata from file
     */
    readPluginMetadata(pluginPath: any): Promise<{}>;
    /**
     * Get plugin metadata from instance
     */
    getPluginMetadata(pluginInstance: any): Promise<{
        name: any;
        version: any;
        description: any;
        author: any;
        capabilities: any;
        cost: any;
        responseTime: any;
        qualityScore: any;
        error?: undefined;
    } | {
        name: string;
        version: string;
        description: string;
        error: any;
        author?: undefined;
        capabilities?: undefined;
        cost?: undefined;
        responseTime?: undefined;
        qualityScore?: undefined;
    }>;
    /**
     * Update plugin performance metrics
     */
    updatePluginMetrics(pluginId: any, responseTime: any, success: any): void;
    /**
     * Execute lifecycle hooks
     */
    executeHooks(hookName: any, context: any): Promise<void>;
    /**
     * Register a lifecycle hook
     */
    registerHook(hookName: any, hookFunction: any): void;
    /**
     * Get plugin status and metrics
     */
    getPluginStatus(): {
        total: number;
        enabled: number;
        disabled: number;
        plugins: {};
    };
    /**
     * Health check for the plugin system
     */
    healthCheck(): Promise<{
        status: string;
        totalPlugins: number;
        enabledPlugins: number;
        healthyPlugins: number;
        metrics: {
            totalPlugins: number;
            enabledPlugins: number;
            loadedPlugins: number;
            failedPlugins: number;
            totalRequests: number;
            averageResponseTime: number;
        };
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        error: any;
        timestamp: string;
        totalPlugins?: undefined;
        enabledPlugins?: undefined;
        healthyPlugins?: undefined;
        metrics?: undefined;
    }>;
    /**
     * Get system metrics
     */
    getMetrics(): {
        pluginMetrics: any;
        timestamp: string;
        totalPlugins: number;
        enabledPlugins: number;
        loadedPlugins: number;
        failedPlugins: number;
        totalRequests: number;
        averageResponseTime: number;
    };
}
