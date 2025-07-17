import { encoding_for_model } from 'tiktoken';
import zlib from 'zlib';
import { promisify } from 'util';

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

/**
 * Response Optimizer for Cache and Transmission
 * MOMENT 4.4: Token reduction, compression, format standardization, metadata stripping
 */
class ResponseOptimizer {
  constructor() {
    // Token encoders for different models
    this.encoders = new Map();
    
    // Optimization strategies per service
    this.strategies = {
      OPENAI_RESPONSES: {
        tokenOptimization: true,
        metadataStripping: 'aggressive',
        formatStandardization: true,
        redundancyRemoval: true,
        compressionLevel: 'high'
      },
      
      GOOGLE_VISION_WEB: {
        tokenOptimization: false,
        metadataStripping: 'moderate',
        formatStandardization: true,
        redundancyRemoval: true,
        compressionLevel: 'medium'
      },
      
      GOOGLE_VISION_OBJECTS: {
        tokenOptimization: false,
        metadataStripping: 'light',
        formatStandardization: true,
        redundancyRemoval: false,
        compressionLevel: 'medium'
      },
      
      OCR_RESULTS: {
        tokenOptimization: false,
        metadataStripping: 'light',
        formatStandardization: true,
        redundancyRemoval: false,
        compressionLevel: 'low'
      },
      
      CELEBRITY_IDS: {
        tokenOptimization: false,
        metadataStripping: 'moderate',
        formatStandardization: true,
        redundancyRemoval: true,
        compressionLevel: 'high'
      }
    };
    
    // Tier-based optimization levels
    this.tierOptimizations = {
      'free': {
        detailLevel: 'basic',
        maxResponseSize: 1024, // 1KB
        stripSensitiveData: true,
        compressResponse: true
      },
      
      'pro': {
        detailLevel: 'standard',
        maxResponseSize: 10240, // 10KB
        stripSensitiveData: false,
        compressResponse: true
      },
      
      'premium': {
        detailLevel: 'full',
        maxResponseSize: 102400, // 100KB
        stripSensitiveData: false,
        compressResponse: false
      }
    };
    
    // Performance metrics
    this.metrics = {
      totalOptimizations: 0,
      tokensSaved: 0,
      bytesSaved: 0,
      compressionRatio: 0,
      averageOptimizationTime: 0,
      totalOptimizationTime: 0,
      optimizationsByService: {}
    };
    
    console.log('✅ Response Optimizer initialized');
  }
  
  /**
   * Get or create token encoder for specific model
   */
  getTokenEncoder(model = 'gpt-4') {
    if (!this.encoders.has(model)) {
      try {
        const encoder = encoding_for_model(model);
        this.encoders.set(model, encoder);
      } catch (error) {
        console.warn(`⚠️ Failed to load encoder for ${model}, using gpt-4 fallback`);
        if (!this.encoders.has('gpt-4')) {
          const fallbackEncoder = encoding_for_model('gpt-4');
          this.encoders.set('gpt-4', fallbackEncoder);
        }
        return this.encoders.get('gpt-4');
      }
    }
    return this.encoders.get(model);
  }
  
  /**
   * Calculate accurate token count for text
   */
  calculateTokens(text, model = 'gpt-4') {
    try {
      if (!text || typeof text !== 'string') return 0;
      
      const encoder = this.getTokenEncoder(model);
      const tokens = encoder.encode(text);
      return tokens.length;
    } catch (error) {
      console.error('❌ Token calculation failed:', error.message);
      // Fallback to rough estimation (4 chars per token)
      return Math.ceil((text || '').length / 4);
    }
  }
  
  /**
   * Optimize response for cache storage
   */
  optimizeForCache(response, serviceType) {
    const startTime = Date.now();
    
    try {
      const strategy = this.strategies[serviceType] || this.strategies.OCR_RESULTS;
      let optimizedResponse = { ...response };
      
      // 1. Token optimization for OpenAI responses
      if (strategy.tokenOptimization && response.choices) {
        optimizedResponse = this.optimizeTokens(optimizedResponse);
      }
      
      // 2. Metadata stripping
      optimizedResponse = this.stripMetadata(optimizedResponse, strategy.metadataStripping);
      
      // 3. Format standardization
      if (strategy.formatStandardization) {
        optimizedResponse = this.standardizeFormat(optimizedResponse, serviceType);
      }
      
      // 4. Redundancy removal
      if (strategy.redundancyRemoval) {
        optimizedResponse = this.removeRedundancy(optimizedResponse);
      }
      
      // Track metrics
      const optimizationTime = Date.now() - startTime;
      this.updateMetrics(serviceType, response, optimizedResponse, optimizationTime);
      
      console.log(`🎯 Cache optimization complete for ${serviceType} (${optimizationTime}ms)`);
      
      return {
        optimized: optimizedResponse,
        originalSize: JSON.stringify(response).length,
        optimizedSize: JSON.stringify(optimizedResponse).length,
        optimizationTime,
        strategy: strategy
      };
      
    } catch (error) {
      console.error('❌ Cache optimization failed:', error.message);
      return {
        optimized: response,
        originalSize: JSON.stringify(response).length,
        optimizedSize: JSON.stringify(response).length,
        optimizationTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize response for transmission to user
   */
  async optimizeForTransmission(response, userTier = 'free', serviceType = 'OCR_RESULTS') {
    const startTime = Date.now();
    
    try {
      const tierConfig = this.tierOptimizations[userTier] || this.tierOptimizations.free;
      let optimizedResponse = { ...response };
      
      // 1. Adjust detail level based on tier
      optimizedResponse = this.adjustDetailLevel(optimizedResponse, tierConfig.detailLevel, serviceType);
      
      // 2. Enforce size limits
      optimizedResponse = this.enforceSizeLimit(optimizedResponse, tierConfig.maxResponseSize);
      
      // 3. Strip sensitive data for lower tiers
      if (tierConfig.stripSensitiveData) {
        optimizedResponse = this.stripSensitiveData(optimizedResponse);
      }
      
      // 4. Compress response if needed
      let compressed = null;
      if (tierConfig.compressResponse) {
        compressed = await this.compressResponse(optimizedResponse);
      }
      
      const optimizationTime = Date.now() - startTime;
      
      console.log(`📡 Transmission optimization complete for ${userTier} tier (${optimizationTime}ms)`);
      
      return {
        optimized: optimizedResponse,
        compressed: compressed,
        originalSize: JSON.stringify(response).length,
        optimizedSize: JSON.stringify(optimizedResponse).length,
        compressionRatio: compressed ? compressed.compressionRatio : 1,
        optimizationTime,
        tierConfig
      };
      
    } catch (error) {
      console.error('❌ Transmission optimization failed:', error.message);
      return {
        optimized: response,
        compressed: null,
        optimizationTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize token usage for OpenAI responses
   */
  optimizeTokens(response) {
    if (!response.choices || !Array.isArray(response.choices)) {
      return response;
    }
    
    const optimized = { ...response };
    let totalTokensSaved = 0;
    
    optimized.choices = response.choices.map(choice => {
      if (choice.message && choice.message.content) {
        const originalContent = choice.message.content;
        const originalTokens = this.calculateTokens(originalContent);
        
        // Optimize content
        let optimizedContent = originalContent
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
          .replace(/(\. ){2,}/g, '. ') // Remove excessive periods
          .trim();
        
        // Remove redundant phrases
        optimizedContent = this.removeRedundantPhrases(optimizedContent);
        
        const newTokens = this.calculateTokens(optimizedContent);
        totalTokensSaved += (originalTokens - newTokens);
        
        return {
          ...choice,
          message: {
            ...choice.message,
            content: optimizedContent
          }
        };
      }
      return choice;
    });
    
    this.metrics.tokensSaved += totalTokensSaved;
    
    if (totalTokensSaved > 0) {
      console.log(`🔤 Token optimization: saved ${totalTokensSaved} tokens`);
    }
    
    return optimized;
  }
  
  /**
   * Remove redundant phrases from text
   */
  removeRedundantPhrases(text) {
    const redundantPatterns = [
      /I can see that /gi,
      /It appears that /gi,
      /It looks like /gi,
      /In this image, /gi,
      /Based on the image, /gi,
      /Looking at this image, /gi,
      /From what I can observe, /gi,
      /As shown in the image, /gi
    ];
    
    let optimized = text;
    redundantPatterns.forEach(pattern => {
      optimized = optimized.replace(pattern, '');
    });
    
    return optimized;
  }
  
  /**
   * Strip metadata based on strategy level
   */
  stripMetadata(response, level) {
    const optimized = { ...response };
    
    switch (level) {
      case 'aggressive':
        // Remove all non-essential metadata
        delete optimized.id;
        delete optimized.created;
        delete optimized.model;
        delete optimized.system_fingerprint;
        delete optimized.object;
        if (optimized.usage) {
          delete optimized.usage.prompt_tokens;
          delete optimized.usage.completion_tokens;
        }
        break;
        
      case 'moderate':
        // Remove some metadata
        delete optimized.system_fingerprint;
        delete optimized.object;
        break;
        
      case 'light':
        // Remove only non-functional metadata
        delete optimized.system_fingerprint;
        break;
    }
    
    return optimized;
  }
  
  /**
   * Standardize response format across services
   */
  standardizeFormat(response, serviceType) {
    const standardized = {
      service: serviceType,
      timestamp: Date.now(),
      data: null,
      metadata: {}
    };
    
    switch (serviceType) {
      case 'OPENAI_RESPONSES':
        standardized.data = {
          content: response.choices?.[0]?.message?.content || '',
          role: response.choices?.[0]?.message?.role || 'assistant',
          finish_reason: response.choices?.[0]?.finish_reason
        };
        standardized.metadata = {
          model: response.model,
          usage: response.usage
        };
        break;
        
      case 'GOOGLE_VISION_WEB':
        standardized.data = {
          webEntities: response.webDetection?.webEntities || [],
          pages: response.webDetection?.pagesWithMatchingImages || [],
          partialMatches: response.webDetection?.partialMatchingImages || []
        };
        break;
        
      case 'GOOGLE_VISION_OBJECTS':
        // Extract the essential data and preserve the summary text for text extraction
        standardized.data = {
          objects: response.result?.objects || [],
          labels: response.result?.labels || [],
          objectCounts: response.result?.objectCounts || {},
          totalObjects: response.result?.totalObjects || 0,
          summary: response.result?.summary || 'No objects detected',
          confidence: response.metadata?.confidence || 0.9
        };
        standardized.metadata = {
          responseTime: response.metadata?.responseTime || 0,
          cost: response.metadata?.cost || 0,
          objectsDetected: response.result?.objects?.length || 0
        };
        break;
        
      case 'OCR_RESULTS':
        // FIXED: Improved blocks creation to handle different OCR response formats
        let blocks = [];
        
        console.log('🔍 === RESPONSE OPTIMIZER OCR DEBUG ===');
        console.log('Input response type:', typeof response);
        console.log('Input response keys:', Object.keys(response || {}));
        console.log('Response structure sample:', JSON.stringify(response, null, 2).substring(0, 500));
        
        // Try different sources for text blocks/regions
        if (response.textAnnotations && Array.isArray(response.textAnnotations)) {
          // Google Vision format with textAnnotations
          blocks = response.textAnnotations;
          console.log('✅ Found textAnnotations:', blocks.length);
        } else if (response.result?.textRegions && Array.isArray(response.result.textRegions)) {
          // Google Vision enhanced format with textRegions
          blocks = response.result.textRegions;
          console.log('✅ Found result.textRegions:', blocks.length);
        } else if (response.textRegions && Array.isArray(response.textRegions)) {
          // Direct textRegions format
          blocks = response.textRegions;
          console.log('✅ Found textRegions:', blocks.length);
        } else if (response.regions && Array.isArray(response.regions)) {
          // Enhanced OCR regions format
          blocks = response.regions;
          console.log('✅ Found regions:', blocks.length);
        } else if (response.text || response.result?.fullText || response.result?.text || response.fullText) {
          // If we have text but no blocks, create a single block
          const text = response.text || response.result?.fullText || response.result?.text || response.fullText || '';
          blocks = [{
            text: text,
            confidence: response.confidence || response.result?.confidence || 0.9,
            boundingBox: null,
            source: 'consolidated'
          }];
          console.log('✅ Created consolidated block from text:', text.length, 'chars');
        } else {
          console.log('❌ No text blocks/regions found in response');
        }
        
        // ENHANCED: Try multiple text extraction strategies
        let extractedText = '';
        const textSources = [
          response.text,
          response.result?.fullText,
          response.result?.text,
          response.fullText,
          response.fullTextAnnotation?.text,
          // Try from blocks if available
          blocks?.[0]?.text,
          // Try from textAnnotations
          response.textAnnotations?.[0]?.description
        ];
        
        for (const source of textSources) {
          if (source && typeof source === 'string' && source.length > 0) {
            extractedText = source;
            console.log('✅ Extracted text from source:', extractedText.substring(0, 50) + (extractedText.length > 50 ? '...' : ''));
            break;
          }
        }
        
        if (!extractedText) {
          console.log('❌ No text found in any source');
          console.log('Available text sources check:');
          textSources.forEach((source, index) => {
            console.log(`  Source ${index}: ${typeof source} - "${String(source).substring(0, 30)}"`);
          });
        }
        
        console.log(`🔧 OCR_RESULTS blocks creation: Found ${blocks.length} blocks from response`);
        console.log(`📝 Available text: "${extractedText || 'none'}"`);
        console.log('=====================================');
        
        standardized.data = {
          text: extractedText,
          confidence: response.confidence || response.result?.confidence || 0,
          blocks: blocks,
          hasText: !!(extractedText && extractedText.length > 0),
          wordCount: extractedText ? extractedText.split(/\s+/).filter(w => w.length > 0).length : 0
        };
        break;
        
      default:
        standardized.data = response;
    }
    
    return standardized;
  }
  
  /**
   * Remove redundant data from response
   */
  removeRedundancy(response) {
    // Remove duplicate entries in arrays
    const optimized = JSON.parse(JSON.stringify(response));
    
    // Handle Google Vision responses
    if (optimized.webDetection?.webEntities) {
      optimized.webDetection.webEntities = this.removeDuplicateEntities(
        optimized.webDetection.webEntities
      );
    }
    
    if (optimized.textAnnotations) {
      optimized.textAnnotations = this.removeDuplicateTextAnnotations(
        optimized.textAnnotations
      );
    }
    
    return optimized;
  }
  
  /**
   * Remove duplicate web entities
   */
  removeDuplicateEntities(entities) {
    const seen = new Set();
    return entities.filter(entity => {
      const key = `${entity.entityId || entity.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Remove duplicate text annotations
   */
  removeDuplicateTextAnnotations(annotations) {
    const seen = new Set();
    return annotations.filter(annotation => {
      const key = `${annotation.description}_${JSON.stringify(annotation.boundingPoly)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Adjust detail level based on user tier
   */
  adjustDetailLevel(response, detailLevel, serviceType) {
    const optimized = { ...response };
    
    switch (detailLevel) {
      case 'basic':
        // Limit to essential information only
        if (serviceType === 'GOOGLE_VISION_WEB') {
          if (optimized.webDetection?.webEntities) {
            optimized.webDetection.webEntities = optimized.webDetection.webEntities.slice(0, 3);
          }
          delete optimized.webDetection?.pagesWithMatchingImages;
          delete optimized.webDetection?.visuallySimilarImages;
        }
        break;
        
      case 'standard':
        // Moderate detail
        if (serviceType === 'GOOGLE_VISION_WEB') {
          if (optimized.webDetection?.webEntities) {
            optimized.webDetection.webEntities = optimized.webDetection.webEntities.slice(0, 10);
          }
        }
        break;
        
      case 'full':
        // Keep all details
        break;
    }
    
    return optimized;
  }
  
  /**
   * Enforce response size limits
   */
  enforceSizeLimit(response, maxSize) {
    const responseStr = JSON.stringify(response);
    
    if (responseStr.length <= maxSize) {
      return response;
    }
    
    // Truncate response to fit size limit
    const truncated = { ...response };
    truncated._truncated = true;
    truncated._originalSize = responseStr.length;
    
    // Truncate arrays first
    for (const [key, value] of Object.entries(truncated)) {
      if (Array.isArray(value) && value.length > 1) {
        const itemSize = JSON.stringify(value[0]).length;
        const maxItems = Math.floor(maxSize / (itemSize * 2)); // Conservative estimate
        truncated[key] = value.slice(0, Math.max(1, maxItems));
        
        if (JSON.stringify(truncated).length <= maxSize) {
          break;
        }
      }
    }
    
    return truncated;
  }
  
  /**
   * Strip sensitive data for lower tiers
   */
  stripSensitiveData(response) {
    const sanitized = { ...response };
    
    // Remove potentially sensitive metadata
    delete sanitized.id;
    delete sanitized.created;
    delete sanitized.system_fingerprint;
    
    // Remove usage statistics (can reveal usage patterns)
    if (sanitized.usage) {
      delete sanitized.usage.prompt_tokens;
      delete sanitized.usage.completion_tokens;
    }
    
    return sanitized;
  }
  
  /**
   * Compress response for transmission
   */
  async compressResponse(response) {
    try {
      const responseStr = JSON.stringify(response);
      const originalSize = Buffer.byteLength(responseStr, 'utf8');
      
      // Use gzip for better compression
      const compressed = await gzip(responseStr);
      const compressedSize = compressed.length;
      
      const compressionRatio = originalSize / compressedSize;
      
      console.log(`🗜️ Response compressed: ${originalSize} → ${compressedSize} bytes (${compressionRatio.toFixed(2)}x)`);
      
      return {
        data: compressed.toString('base64'),
        originalSize,
        compressedSize,
        compressionRatio,
        algorithm: 'gzip'
      };
      
    } catch (error) {
      console.error('❌ Response compression failed:', error.message);
      return null;
    }
  }
  
  /**
   * Update optimization metrics
   */
  updateMetrics(serviceType, original, optimized, optimizationTime) {
    this.metrics.totalOptimizations++;
    this.metrics.totalOptimizationTime += optimizationTime;
    this.metrics.averageOptimizationTime = 
      this.metrics.totalOptimizationTime / this.metrics.totalOptimizations;
    
    const originalSize = JSON.stringify(original).length;
    const optimizedSize = JSON.stringify(optimized).length;
    const bytesSaved = originalSize - optimizedSize;
    
    if (bytesSaved > 0) {
      this.metrics.bytesSaved += bytesSaved;
    }
    
    if (!this.metrics.optimizationsByService[serviceType]) {
      this.metrics.optimizationsByService[serviceType] = {
        count: 0,
        totalBytesSaved: 0,
        totalTokensSaved: 0
      };
    }
    
    this.metrics.optimizationsByService[serviceType].count++;
    this.metrics.optimizationsByService[serviceType].totalBytesSaved += Math.max(0, bytesSaved);
  }
  
  /**
   * Get optimization metrics
   */
  getMetrics() {
    const averageBytesSaved = this.metrics.totalOptimizations > 0 
      ? this.metrics.bytesSaved / this.metrics.totalOptimizations 
      : 0;
    
    return {
      totalOptimizations: this.metrics.totalOptimizations,
      tokensSaved: this.metrics.tokensSaved,
      bytesSaved: this.metrics.bytesSaved,
      averageBytesSaved: Math.round(averageBytesSaved),
      averageOptimizationTime: Math.round(this.metrics.averageOptimizationTime * 100) / 100,
      optimizationsByService: this.metrics.optimizationsByService,
      compressionRatio: this.metrics.compressionRatio
    };
  }
  
  /**
   * Health check for response optimizer
   */
  healthCheck() {
    try {
      // Test token encoding
      const testTokens = this.calculateTokens('Hello world');
      
      return {
        status: 'healthy',
        tokenEncodingWorking: testTokens > 0,
        encodersLoaded: this.encoders.size,
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        metrics: this.getMetrics()
      };
    }
  }
  
  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = {
      totalOptimizations: 0,
      tokensSaved: 0,
      bytesSaved: 0,
      compressionRatio: 0,
      averageOptimizationTime: 0,
      totalOptimizationTime: 0,
      optimizationsByService: {}
    };
    
    console.log('🧹 Response optimizer metrics cleared');
  }
}

// Create and export singleton instance
const responseOptimizer = new ResponseOptimizer();
export default responseOptimizer; 