import path from 'path';
import fs from 'fs/promises';
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
class PluginLoader {
    constructor() {
        // Plugin registry
        this.registeredPlugins = new Map();
        this.enabledPlugins = new Set();
        this.pluginConfigs = new Map();
        this.pluginMetrics = new Map();
        // Plugin discovery paths
        this.pluginPaths = [
            '../enhanced-services/open-source-apis/',
            '../../../plugins/', // User plugins directory
            './plugins/' // Local plugins
        ];
        // Standard plugin interface requirements
        this.requiredInterface = [
            'analyzeImage',
            'getCapabilities',
            'getCost',
            'getResponseTime',
            'healthCheck'
        ];
        // Plugin lifecycle hooks
        this.lifecycleHooks = {
            beforeLoad: [],
            afterLoad: [],
            beforeEnable: [],
            afterEnable: [],
            beforeDisable: [],
            afterDisable: [],
            onError: []
        };
        // Performance tracking
        this.metrics = {
            totalPlugins: 0,
            enabledPlugins: 0,
            loadedPlugins: 0,
            failedPlugins: 0,
            totalRequests: 0,
            averageResponseTime: 0
        };
        console.log('✅ Plugin Loader System initialized');
    }
    /**
     * Discover and register available plugins
     */
    async discoverPlugins() {
        console.log('🔍 Plugin Loader: Discovering available plugins...');
        const discoveredPlugins = [];
        for (const pluginPath of this.pluginPaths) {
            try {
                const fullPath = path.resolve(process.cwd(), 'src/services', pluginPath);
                // Check if directory exists
                try {
                    await fs.access(fullPath);
                }
                catch {
                    console.log(`📁 Plugin directory not found: ${fullPath}`);
                    continue;
                }
                const files = await fs.readdir(fullPath);
                for (const file of files) {
                    if (file.endsWith('.js') && !file.startsWith('index') && !file.startsWith('.')) {
                        const pluginId = path.basename(file, '.js');
                        const pluginFilePath = path.join(fullPath, file);
                        try {
                            // Attempt to read plugin metadata
                            const pluginInfo = await this.readPluginMetadata(pluginFilePath);
                            discoveredPlugins.push({
                                id: pluginId,
                                path: pluginFilePath,
                                metadata: pluginInfo,
                                discovered: true
                            });
                            console.log(`🔌 Discovered plugin: ${pluginId}`);
                        }
                        catch (error) {
                            console.warn(`⚠️ Failed to read plugin metadata for ${pluginId}:`, error.message);
                        }
                    }
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to scan plugin directory ${pluginPath}:`, error.message);
            }
        }
        console.log(`✅ Plugin discovery completed. Found ${discoveredPlugins.length} plugins`);
        return discoveredPlugins;
    }
    /**
     * Load a plugin by ID
     */
    async loadPlugin(pluginId, config = {}) {
        console.log(`📦 Plugin Loader: Loading plugin ${pluginId}...`);
        try {
            // Execute beforeLoad hooks
            await this.executeHooks('beforeLoad', { pluginId, config });
            // Import the plugin module
            const pluginModule = await import(`../enhanced-services/open-source-apis/${pluginId}.js`);
            const PluginClass = pluginModule.default || pluginModule[pluginId] || pluginModule;
            if (typeof PluginClass !== 'function') {
                throw new Error(`Plugin ${pluginId} does not export a valid class`);
            }
            // Create plugin instance
            const pluginInstance = new PluginClass(config);
            // Validate plugin interface
            await this.validatePluginInterface(pluginInstance, pluginId);
            // Register plugin
            this.registeredPlugins.set(pluginId, {
                instance: pluginInstance,
                config: config,
                loadedAt: Date.now(),
                status: 'loaded',
                version: pluginInstance.version || '1.0.0',
                metadata: await this.getPluginMetadata(pluginInstance)
            });
            this.pluginConfigs.set(pluginId, config);
            this.metrics.loadedPlugins++;
            this.metrics.totalPlugins++;
            // Initialize plugin metrics
            this.pluginMetrics.set(pluginId, {
                requests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                errors: 0,
                lastUsed: null,
                successRate: 0
            });
            // Execute afterLoad hooks
            await this.executeHooks('afterLoad', { pluginId, instance: pluginInstance });
            console.log(`✅ Plugin ${pluginId} loaded successfully`);
            return pluginInstance;
        }
        catch (error) {
            console.error(`❌ Failed to load plugin ${pluginId}:`, error.message);
            this.metrics.failedPlugins++;
            // Execute error hooks
            await this.executeHooks('onError', { pluginId, error, phase: 'load' });
            throw error;
        }
    }
    /**
     * Enable a loaded plugin for use
     */
    async enablePlugin(pluginId) {
        console.log(`🔌 Plugin Loader: Enabling plugin ${pluginId}...`);
        try {
            const plugin = this.registeredPlugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin ${pluginId} is not loaded`);
            }
            if (this.enabledPlugins.has(pluginId)) {
                console.log(`⚠️ Plugin ${pluginId} is already enabled`);
                return;
            }
            // Execute beforeEnable hooks
            await this.executeHooks('beforeEnable', { pluginId, instance: plugin.instance });
            // Run plugin health check
            const healthStatus = await plugin.instance.healthCheck();
            if (healthStatus.status !== 'healthy') {
                throw new Error(`Plugin ${pluginId} failed health check: ${healthStatus.error || 'Unknown error'}`);
            }
            // Enable plugin
            this.enabledPlugins.add(pluginId);
            plugin.status = 'enabled';
            plugin.enabledAt = Date.now();
            this.metrics.enabledPlugins++;
            // Execute afterEnable hooks
            await this.executeHooks('afterEnable', { pluginId, instance: plugin.instance });
            console.log(`✅ Plugin ${pluginId} enabled successfully`);
        }
        catch (error) {
            console.error(`❌ Failed to enable plugin ${pluginId}:`, error.message);
            // Execute error hooks
            await this.executeHooks('onError', { pluginId, error, phase: 'enable' });
            throw error;
        }
    }
    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId) {
        console.log(`🔌 Plugin Loader: Disabling plugin ${pluginId}...`);
        try {
            const plugin = this.registeredPlugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin ${pluginId} is not loaded`);
            }
            if (!this.enabledPlugins.has(pluginId)) {
                console.log(`⚠️ Plugin ${pluginId} is already disabled`);
                return;
            }
            // Execute beforeDisable hooks
            await this.executeHooks('beforeDisable', { pluginId, instance: plugin.instance });
            // Disable plugin
            this.enabledPlugins.delete(pluginId);
            plugin.status = 'disabled';
            plugin.disabledAt = Date.now();
            this.metrics.enabledPlugins--;
            // Execute afterDisable hooks
            await this.executeHooks('afterDisable', { pluginId, instance: plugin.instance });
            console.log(`✅ Plugin ${pluginId} disabled successfully`);
        }
        catch (error) {
            console.error(`❌ Failed to disable plugin ${pluginId}:`, error.message);
            // Execute error hooks
            await this.executeHooks('onError', { pluginId, error, phase: 'disable' });
            throw error;
        }
    }
    /**
     * Get all available plugins that match required capabilities
     */
    getAvailablePlugins(capabilities = []) {
        const availablePlugins = [];
        for (const [pluginId, plugin] of this.registeredPlugins) {
            if (this.enabledPlugins.has(pluginId)) {
                const pluginCapabilities = plugin.instance.getCapabilities();
                // Check if plugin supports required capabilities
                const supportsCapabilities = capabilities.length === 0 ||
                    capabilities.every(cap => pluginCapabilities.includes(cap));
                if (supportsCapabilities) {
                    availablePlugins.push({
                        id: pluginId,
                        capabilities: pluginCapabilities,
                        cost: plugin.instance.getCost(),
                        responseTime: plugin.instance.getResponseTime(),
                        metadata: plugin.metadata,
                        metrics: this.pluginMetrics.get(pluginId)
                    });
                }
            }
        }
        // Sort by cost-effectiveness (quality/cost ratio if available)
        return availablePlugins.sort((a, b) => {
            const aRatio = (a.metadata.qualityScore || 50) / (a.cost || 1);
            const bRatio = (b.metadata.qualityScore || 50) / (b.cost || 1);
            return bRatio - aRatio;
        });
    }
    /**
     * Execute a plugin with request tracking
     */
    async executePlugin(pluginId, imageData, questionType, parameters = {}) {
        const startTime = Date.now();
        try {
            const plugin = this.registeredPlugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin ${pluginId} is not loaded`);
            }
            if (!this.enabledPlugins.has(pluginId)) {
                throw new Error(`Plugin ${pluginId} is not enabled`);
            }
            // Execute plugin
            const result = await plugin.instance.analyzeImage(imageData, questionType, parameters);
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updatePluginMetrics(pluginId, responseTime, true);
            this.metrics.totalRequests++;
            return {
                success: true,
                result,
                metadata: {
                    pluginId,
                    responseTime,
                    cost: plugin.instance.getCost(),
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.updatePluginMetrics(pluginId, responseTime, false);
            console.error(`❌ Plugin execution failed for ${pluginId}:`, error.message);
            throw error;
        }
    }
    /**
     * Validate plugin interface compliance
     */
    async validatePluginInterface(pluginInstance, pluginId) {
        console.log(`🔍 Validating plugin interface for ${pluginId}...`);
        // Check required methods
        for (const method of this.requiredInterface) {
            if (typeof pluginInstance[method] !== 'function') {
                throw new Error(`Plugin ${pluginId} is missing required method: ${method}`);
            }
        }
        // Test method calls
        try {
            const capabilities = pluginInstance.getCapabilities();
            if (!Array.isArray(capabilities)) {
                throw new Error(`getCapabilities() must return an array`);
            }
            const cost = pluginInstance.getCost();
            if (typeof cost !== 'number' || cost < 0) {
                throw new Error(`getCost() must return a non-negative number`);
            }
            const responseTime = pluginInstance.getResponseTime();
            if (typeof responseTime !== 'number' || responseTime < 0) {
                throw new Error(`getResponseTime() must return a non-negative number`);
            }
            // Health check
            const health = await pluginInstance.healthCheck();
            if (!health || typeof health.status !== 'string') {
                throw new Error(`healthCheck() must return an object with status property`);
            }
        }
        catch (error) {
            throw new Error(`Plugin interface validation failed: ${error.message}`);
        }
        console.log(`✅ Plugin interface validation passed for ${pluginId}`);
    }
    /**
     * Read plugin metadata from file
     */
    async readPluginMetadata(pluginPath) {
        try {
            const content = await fs.readFile(pluginPath, 'utf8');
            // Extract metadata from comments (simple implementation)
            const metadataMatch = content.match(/\/\*\*\s*\n\s*\*\s*@plugin\s+(.*?)\n[\s\S]*?\*\//);
            if (metadataMatch) {
                const metadataLines = content.match(/\*\s*@(\w+)\s+(.*)/g) || [];
                const metadata = {};
                for (const line of metadataLines) {
                    const match = line.match(/\*\s*@(\w+)\s+(.*)/);
                    if (match) {
                        metadata[match[1]] = match[2].trim();
                    }
                }
                return metadata;
            }
            return {};
        }
        catch (error) {
            console.warn(`⚠️ Failed to read plugin metadata from ${pluginPath}:`, error.message);
            return {};
        }
    }
    /**
     * Get plugin metadata from instance
     */
    async getPluginMetadata(pluginInstance) {
        try {
            return {
                name: pluginInstance.name || 'Unknown Plugin',
                version: pluginInstance.version || '1.0.0',
                description: pluginInstance.description || 'No description',
                author: pluginInstance.author || 'Unknown',
                capabilities: pluginInstance.getCapabilities(),
                cost: pluginInstance.getCost(),
                responseTime: pluginInstance.getResponseTime(),
                qualityScore: pluginInstance.qualityScore || 50
            };
        }
        catch (error) {
            return {
                name: 'Unknown Plugin',
                version: '1.0.0',
                description: 'Failed to load metadata',
                error: error.message
            };
        }
    }
    /**
     * Update plugin performance metrics
     */
    updatePluginMetrics(pluginId, responseTime, success) {
        const metrics = this.pluginMetrics.get(pluginId);
        if (metrics) {
            metrics.requests++;
            metrics.totalResponseTime += responseTime;
            metrics.averageResponseTime = metrics.totalResponseTime / metrics.requests;
            metrics.lastUsed = Date.now();
            if (!success) {
                metrics.errors++;
            }
            metrics.successRate = ((metrics.requests - metrics.errors) / metrics.requests) * 100;
        }
    }
    /**
     * Execute lifecycle hooks
     */
    async executeHooks(hookName, context) {
        const hooks = this.lifecycleHooks[hookName] || [];
        for (const hook of hooks) {
            try {
                await hook(context);
            }
            catch (error) {
                console.warn(`⚠️ Hook ${hookName} failed:`, error.message);
            }
        }
    }
    /**
     * Register a lifecycle hook
     */
    registerHook(hookName, hookFunction) {
        if (!this.lifecycleHooks[hookName]) {
            this.lifecycleHooks[hookName] = [];
        }
        this.lifecycleHooks[hookName].push(hookFunction);
    }
    /**
     * Get plugin status and metrics
     */
    getPluginStatus() {
        const status = {
            total: this.registeredPlugins.size,
            enabled: this.enabledPlugins.size,
            disabled: this.registeredPlugins.size - this.enabledPlugins.size,
            plugins: {}
        };
        for (const [pluginId, plugin] of this.registeredPlugins) {
            status.plugins[pluginId] = {
                status: plugin.status,
                loadedAt: plugin.loadedAt,
                enabledAt: plugin.enabledAt,
                metadata: plugin.metadata,
                metrics: this.pluginMetrics.get(pluginId),
                enabled: this.enabledPlugins.has(pluginId)
            };
        }
        return status;
    }
    /**
     * Health check for the plugin system
     */
    async healthCheck() {
        try {
            const enabledPlugins = Array.from(this.enabledPlugins);
            const pluginHealthChecks = await Promise.allSettled(enabledPlugins.map(async (pluginId) => {
                const plugin = this.registeredPlugins.get(pluginId);
                const health = await plugin.instance.healthCheck();
                return { pluginId, health };
            }));
            const healthyPlugins = pluginHealthChecks.filter(result => result.status === 'fulfilled' && result.value.health.status === 'healthy').length;
            return {
                status: healthyPlugins === enabledPlugins.length ? 'healthy' : 'degraded',
                totalPlugins: this.registeredPlugins.size,
                enabledPlugins: this.enabledPlugins.size,
                healthyPlugins,
                metrics: this.metrics,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Get system metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            pluginMetrics: Object.fromEntries(this.pluginMetrics),
            timestamp: new Date().toISOString()
        };
    }
}
// Standard plugin interface for future implementations
export class APIPlugin {
    constructor(config = {}) {
        this.config = config;
        this.name = 'Base API Plugin';
        this.version = '1.0.0';
        this.description = 'Base class for API plugins';
        this.author = 'FrameSense';
    }
    /**
     * Analyze image with AI service
     * @param {Buffer|string} imageData - Image data
     * @param {string} questionType - Type of analysis requested
     * @param {Object} parameters - Additional parameters
     * @returns {Object} Analysis result
     */
    async analyzeImage(imageData, questionType, parameters = {}) {
        throw new Error('analyzeImage method must be implemented by plugin');
    }
    /**
     * Get plugin capabilities
     * @returns {Array} Array of capability strings
     */
    getCapabilities() {
        return ['basic-analysis'];
    }
    /**
     * Get cost per request
     * @returns {number} Cost in USD
     */
    getCost() {
        return 0.01;
    }
    /**
     * Get average response time
     * @returns {number} Response time in milliseconds
     */
    getResponseTime() {
        return 5000;
    }
    /**
     * Health check
     * @returns {Object} Health status
     */
    async healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString()
        };
    }
}
// Create and export singleton instance
const pluginLoader = new PluginLoader();
export default pluginLoader;
