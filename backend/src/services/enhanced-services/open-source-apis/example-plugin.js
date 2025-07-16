/**
 * Example API Plugin
 * Demonstrates how to create a plugin for the FrameSense system
 * 
 * FUTURE: This shows how HuggingFace, Ollama, etc. plugins will work
 */

const { APIPlugin } = require('./api-registry');

/**
 * Example Plugin - Shows the plugin interface in action
 * In the future, this pattern will be used for:
 * - HuggingFace BLIP-2, CLIP, etc.
 * - Ollama LLaVA, Moondream
 * - Replicate custom models
 * - Community contributed APIs
 */
class ExampleAIPlugin extends APIPlugin {
  constructor(config) {
    super(config);
    this.apiUrl = config.apiUrl || 'https://api.example.com';
    this.apiKey = config.apiKey || null;
  }

  /**
   * Analyze image with this AI service
   */
  async analyzeImage(imageData, questionType, parameters = {}) {
    // In a real plugin, this would call the actual AI service
    // For example, HuggingFace Inference API:
    // const response = await fetch(`${this.apiUrl}/models/Salesforce/blip2-opt-2.7b`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ inputs: imageData })
    // });
    
    // Mock response for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return {
      success: true,
      result: {
        description: `Example AI analysis for question type: ${questionType.id}`,
        confidence: 0.85,
        processing_time: 1.2,
        service: 'example-ai'
      },
      metadata: {
        model: 'example-model-v1',
        cost: this.getCost(questionType),
        responseTime: this.getResponseTime(questionType)
      }
    };
  }

  /**
   * Get plugin capabilities
   */
  getCapabilities() {
    return ['basic-scenes', 'captions', 'open-source'];
  }

  /**
   * Get cost estimate
   */
  getCost(questionType) {
    return 0.002; // Very low cost for open source
  }

  /**
   * Get response time estimate
   */
  getResponseTime(questionType) {
    return 5; // 5 seconds average
  }

  /**
   * Health check implementation
   */
  async performHealthCheck() {
    // In a real plugin, ping the actual service
    // For example:
    // const response = await fetch(`${this.apiUrl}/health`);
    // if (!response.ok) throw new Error('Service unavailable');
    
    // Mock health check
    return Promise.resolve();
  }
}

// Example of how to register the plugin:
// const { registry } = require('./api-registry');
// registry.registerPlugin('example-ai', ExampleAIPlugin, {
//   apiUrl: 'https://api.example.com',
//   apiKey: process.env.EXAMPLE_API_KEY,
//   provider: 'Example AI',
//   version: '1.0.0',
//   description: 'Example AI service for demonstration'
// });

module.exports = ExampleAIPlugin; 