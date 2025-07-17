/**
 * FrameSense Google Vision Service
 * Comprehensive image analysis using Google Cloud Vision API
 * 
 * MOMENT 2.1-2.4: Google Vision Integration
 * Features: Text OCR, Object Detection, Celebrity ID, Logo Detection
 */

import vision from '@google-cloud/vision';
import { GOOGLE_CLOUD_CONFIG, validateGoogleVisionConfig } from '../../config/google-vision-config.js';

/**
 * Google Vision Service Class
 * Handles all Google Vision API interactions with proper error handling and caching
 */
class GoogleVisionService {
  constructor() {
    // Validate configuration
    validateGoogleVisionConfig();
    
    // Initialize Google Vision client
    this.client = new vision.ImageAnnotatorClient({
      credentials: GOOGLE_CLOUD_CONFIG.credentials,
      projectId: GOOGLE_CLOUD_CONFIG.credentials.project_id
    });
    
    this.config = GOOGLE_CLOUD_CONFIG;
    this.requestCounts = new Map(); // Track usage per user
    
    console.log('✅ Google Vision Service initialized');
  }

  /**
   * MOMENT 2.2: Text Detection Service (OCR Fallback)
   * High-accuracy text extraction with language detection
   */
  async detectText(imageData, options = {}) {
    console.log(`👁️ === GOOGLE VISION TEXT DETECTION START ===`);
    console.log(`User Tier: ${options.userTier || 'not provided'}`);
    console.log(`User ID: ${options.userId || 'not provided'}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    console.log(`Image Data Length: ${imageData ? imageData.length : 0}`);
    console.log(`API Config Available: ${!!this.client}`);
    console.log(`============================================`);
    
    try {
      const startTime = Date.now();
      
      // Prepare request
      const request = {
        image: this.prepareImageData(imageData),
        features: [{ type: 'TEXT_DETECTION' }],
        imageContext: {
          languageHints: options.languageHints || ['en', 'sv', 'es', 'fr', 'de']
        }
      };

      console.log(`📡 Calling Google Vision API for text detection...`);
      // Call Google Vision API
      const [result] = await this.client.annotateImage(request);
      console.log(`✅ Google Vision API response received`);
      const responseTime = Date.now() - startTime;

      // Process results
      const textAnnotations = result.textAnnotations || [];
      const fullText = textAnnotations.length > 0 ? textAnnotations[0].description : '';
      
      // Extract individual text regions
      const textRegions = textAnnotations.slice(1).map(annotation => ({
        text: annotation.description,
        confidence: annotation.score || 0.9,
        boundingBox: this.extractBoundingBox(annotation.boundingPoly),
        language: this.detectLanguage(annotation.description)
      }));

      // Language detection from full text
      const detectedLanguage = this.detectLanguage(fullText);

      const response = {
        success: true,
        service: 'google-vision-text',
        result: {
          fullText: fullText,
          textRegions: textRegions,
          detectedLanguage: detectedLanguage,
          confidence: this.calculateAverageConfidence(textRegions),
          wordCount: fullText.split(/\s+/).filter(word => word.length > 0).length
        },
        metadata: {
          responseTime: responseTime,
          cost: 0.0015, // Standard Google Vision text detection cost
          regionsFound: textRegions.length,
          apiVersion: 'v1'
        }
      };

      console.log(`📄 Text detection completed: ${textRegions.length} regions found`);
      return response;

    } catch (error) {
      console.error('❌ Google Vision text detection failed:', error.message);
      return this.handleError(error, 'textDetection');
    }
  }

  /**
   * MOMENT 2.3: Object Detection and Counting
   * Detect and count objects with bounding boxes
   */
  async detectObjects(imageData, options = {}) {
    console.log(`🎯 === GOOGLE VISION OBJECT DETECTION START ===`);
    console.log(`User Tier: ${options.userTier || 'not provided'}`);
    console.log(`User ID: ${options.userId || 'not provided'}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    console.log(`Image Data Length: ${imageData ? imageData.length : 0}`);
    console.log(`API Config Available: ${!!this.client}`);
    console.log(`Service Access: Pro+ required for object detection`);
    console.log(`==============================================`);
    
    try {
      const startTime = Date.now();
      console.log(`📡 Calling Google Vision API for object detection...`);

      // Prepare request for object detection
      const request = {
        image: this.prepareImageData(imageData),
        features: [
          { type: 'OBJECT_LOCALIZATION', maxResults: options.maxResults || 50 },
          { type: 'LABEL_DETECTION', maxResults: options.maxLabels || 20 }
        ]
      };

      const [result] = await this.client.annotateImage(request);
      const responseTime = Date.now() - startTime;

      // Process object localization
      const localizedObjects = (result.localizedObjectAnnotations || []).map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: this.extractBoundingBox(obj.boundingPoly),
        mid: obj.mid
      }));

      // Process labels
      const labels = (result.labelAnnotations || []).map(label => ({
        description: label.description,
        confidence: label.score,
        topicality: label.topicality,
        mid: label.mid
      }));

      // Count objects by type
      const objectCounts = this.countObjectsByType(localizedObjects);

      const response = {
        success: true,
        service: 'google-vision-objects',
        result: {
          objects: localizedObjects,
          labels: labels,
          objectCounts: objectCounts,
          totalObjects: localizedObjects.length,
          summary: this.generateObjectSummary(localizedObjects, labels)
        },
        metadata: {
          responseTime: responseTime,
          cost: 0.006, // Standard Google Vision object detection cost
          objectsDetected: localizedObjects.length,
          labelsDetected: labels.length
        }
      };

      console.log(`🔍 Object detection completed: ${localizedObjects.length} objects, ${labels.length} labels`);
      return response;

    } catch (error) {
      console.error('❌ Google Vision object detection failed:', error.message);
      return this.handleError(error, 'objectLocalization');
    }
  }

  /**
   * MOMENT 2.4: Celebrity/Web Detection Service (PREMIUM FEATURE)
   * Identify celebrities, public figures, and web entities
   */
  async detectCelebritiesAndWeb(imageData, options = {}) {
    console.log(`⭐ === GOOGLE VISION CELEBRITY DETECTION START ===`);
    console.log(`User Tier: ${options.userTier || options || 'not provided'}`);
    console.log(`User ID: ${options.userId || 'not provided'}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    console.log(`Image Data Length: ${imageData ? imageData.length : 0}`);
    console.log(`API Config Available: ${!!this.client}`);
    console.log(`NOTE: This is a PREMIUM-only feature`);
    console.log(`Service Access: Premium required for celebrity detection`);
    console.log(`================================================`);
    
    try {
      const startTime = Date.now();

      console.log(`📡 Calling Google Vision API for celebrity/web detection...`);
      // Prepare request for web detection
      const request = {
        image: this.prepareImageData(imageData),
        features: [
          { type: 'WEB_DETECTION', maxResults: options.maxResults || 20 },
          { type: 'FACE_DETECTION', maxResults: options.maxFaces || 10 }
        ]
      };

      const [result] = await this.client.annotateImage(request);
      const responseTime = Date.now() - startTime;

      // Process web detection
      const webDetection = result.webDetection || {};
      
      // Extract web entities (celebrities, landmarks, etc.)
      const webEntities = (webDetection.webEntities || []).map(entity => ({
        entityId: entity.entityId,
        description: entity.description,
        score: entity.score
      }));

      // Find celebrity/person entities
      const celebrities = webEntities.filter(entity => 
        this.isCelebrityEntity(entity.description) && entity.score > 0.7
      );

      // Process similar images from web
      const similarImages = (webDetection.visuallySimilarImages || []).slice(0, 5).map(img => ({
        url: img.url,
        score: img.score || 0.5
      }));

      // Process web pages mentioning this image
      const webPages = (webDetection.pagesWithMatchingImages || []).slice(0, 5).map(page => ({
        url: page.url,
        title: page.pageTitle || 'Unknown',
        score: page.score || 0.5
      }));

      // Process face detection for additional context
      const faces = (result.faceAnnotations || []).map(face => ({
        confidence: face.detectionConfidence,
        boundingBox: this.extractBoundingBox(face.boundingPoly),
        landmarks: this.extractFaceLandmarks(face.landmarks),
        emotions: this.extractEmotions(face),
        age: this.estimateAge(face),
        gender: this.estimateGender(face)
      }));

      const celebrityDetected = celebrities.length > 0;
      const bestCelebrity = celebrities.length > 0 ? celebrities[0] : null;

      const response = {
        success: true,
        service: 'google-vision-web',
        result: {
          celebrityDetected: celebrityDetected,
          celebrities: celebrities,
          bestMatch: bestCelebrity ? {
            name: bestCelebrity.description,
            confidence: bestCelebrity.score,
            entityId: bestCelebrity.entityId,
            context: this.getCelebrityContext(bestCelebrity.description)
          } : null,
          webEntities: webEntities,
          similarImages: similarImages,
          webPages: webPages,
          faces: faces,
          summary: this.generateCelebritySummary(celebrities, webEntities, faces)
        },
        metadata: {
          responseTime: responseTime,
          cost: 0.0035, // Standard Google Vision web detection cost
          entitiesFound: webEntities.length,
          facesFound: faces.length,
          tier: 'premium'
        }
      };

      console.log(`⭐ Celebrity detection completed: ${celebrities.length} celebrities found`);
      return response;

    } catch (error) {
      console.error('❌ Google Vision celebrity detection failed:', error.message);
      return this.handleError(error, 'webDetection');
    }
  }

  /**
   * Logo Detection Service
   * Identify brands and logos in images
   */
  async detectLogos(imageData, options = {}) {
    try {
      const startTime = Date.now();

      const request = {
        image: this.prepareImageData(imageData),
        features: [{ type: 'LOGO_DETECTION', maxResults: options.maxResults || 20 }]
      };

      const [result] = await this.client.annotateImage(request);
      const responseTime = Date.now() - startTime;

      const logos = (result.logoAnnotations || []).map(logo => ({
        description: logo.description,
        confidence: logo.score,
        boundingBox: this.extractBoundingBox(logo.boundingPoly),
        mid: logo.mid
      }));

      const response = {
        success: true,
        service: 'google-vision-logos',
        result: {
          logos: logos,
          logoCount: logos.length,
          brands: logos.map(logo => logo.description),
          summary: logos.length > 0 ? 
            `Found ${logos.length} logo(s): ${logos.map(l => l.description).join(', ')}` :
            'No logos detected in the image'
        },
        metadata: {
          responseTime: responseTime,
          cost: 0.0015, // Standard Google Vision logo detection cost
          logosDetected: logos.length
        }
      };

      console.log(`🏷️ Logo detection completed: ${logos.length} logos found`);
      return response;

    } catch (error) {
      console.error('❌ Google Vision logo detection failed:', error.message);
      return this.handleError(error, 'logoDetection');
    }
  }

  /**
   * Comprehensive Analysis
   * Run multiple detection types in parallel for complete analysis
   */
  async comprehensiveAnalysis(imageData, features = [], userTier = 'free') {
    try {
      const startTime = Date.now();
      const results = {};

      // Determine which features to run based on user tier and requests
      const enabledFeatures = this.getEnabledFeatures(features, userTier);

      // Run analyses in parallel
      const promises = [];

      if (enabledFeatures.includes('text')) {
        promises.push(
          this.detectText(imageData).then(result => ({ type: 'text', result }))
        );
      }

      if (enabledFeatures.includes('objects')) {
        promises.push(
          this.detectObjects(imageData).then(result => ({ type: 'objects', result }))
        );
      }

      if (enabledFeatures.includes('logos')) {
        promises.push(
          this.detectLogos(imageData).then(result => ({ type: 'logos', result }))
        );
      }

      if (enabledFeatures.includes('celebrities') && userTier === 'premium') {
        promises.push(
          this.detectCelebritiesAndWeb(imageData).then(result => ({ type: 'celebrities', result }))
        );
      }

      // Wait for all analyses to complete
      const completedAnalyses = await Promise.all(promises);
      
      // Organize results
      completedAnalyses.forEach(({ type, result }) => {
        results[type] = result;
      });

      const totalResponseTime = Date.now() - startTime;
      const totalCost = completedAnalyses.reduce((sum, { result }) => sum + (result.metadata?.cost || 0), 0);

      return {
        success: true,
        service: 'google-vision-comprehensive',
        result: results,
        metadata: {
          responseTime: totalResponseTime,
          totalCost: totalCost,
          featuresRun: enabledFeatures,
          userTier: userTier
        }
      };

    } catch (error) {
      console.error('❌ Google Vision comprehensive analysis failed:', error.message);
      return this.handleError(error, 'comprehensive');
    }
  }

  // Helper Methods
  // ===============

  /**
   * Prepare image data for Google Vision API
   */
  prepareImageData(imageData) {
    if (Buffer.isBuffer(imageData)) {
      return { content: imageData };
    } else if (typeof imageData === 'string') {
      // Handle base64 or URL
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        return { content: Buffer.from(base64Data, 'base64') };
      } else if (imageData.startsWith('http')) {
        return { source: { imageUri: imageData } };
      } else {
        // Assume base64
        return { content: Buffer.from(imageData, 'base64') };
      }
    }
    throw new Error('Invalid image data format');
  }

  /**
   * Extract bounding box coordinates
   */
  extractBoundingBox(boundingPoly) {
    if (!boundingPoly || !boundingPoly.vertices) return null;
    
    const vertices = boundingPoly.vertices;
    return {
      x: Math.min(...vertices.map(v => v.x || 0)),
      y: Math.min(...vertices.map(v => v.y || 0)),
      width: Math.max(...vertices.map(v => v.x || 0)) - Math.min(...vertices.map(v => v.x || 0)),
      height: Math.max(...vertices.map(v => v.y || 0)) - Math.min(...vertices.map(v => v.y || 0)),
      vertices: vertices
    };
  }

  /**
   * Detect language of text
   */
  detectLanguage(text) {
    // Simple language detection based on common patterns
    if (/[åäöÅÄÖ]/.test(text)) return 'sv'; // Swedish
    if (/[ñáéíóúü]/.test(text)) return 'es'; // Spanish
    if (/[àâäéèêëïîôöùûüÿç]/.test(text)) return 'fr'; // French
    if (/[äöüßÄÖÜ]/.test(text)) return 'de'; // German
    return 'en'; // Default to English
  }

  /**
   * Calculate average confidence from text regions
   */
  calculateAverageConfidence(textRegions) {
    if (textRegions.length === 0) return 0;
    const sum = textRegions.reduce((acc, region) => acc + region.confidence, 0);
    return sum / textRegions.length;
  }

  /**
   * Count objects by type
   */
  countObjectsByType(objects) {
    const counts = {};
    objects.forEach(obj => {
      counts[obj.name] = (counts[obj.name] || 0) + 1;
    });
    return counts;
  }

  /**
   * Generate object summary
   */
  generateObjectSummary(objects, labels) {
    if (objects.length === 0) return 'No objects detected in the image';
    
    const topObjects = objects.slice(0, 5).map(obj => obj.name);
    const topLabels = labels.slice(0, 3).map(label => label.description);
    
    return `Detected ${objects.length} objects including: ${topObjects.join(', ')}. Scene: ${topLabels.join(', ')}`;
  }

  /**
   * Check if entity is likely a celebrity
   */
  isCelebrityEntity(description) {
    if (!description) return false;
    
    // Common patterns for celebrity/person entities
    const celebrityPatterns = [
      /actor/i, /actress/i, /singer/i, /musician/i, /artist/i,
      /director/i, /producer/i, /celebrity/i, /star/i,
      /politician/i, /athlete/i, /model/i, /influencer/i
    ];
    
    // Check if description contains name-like patterns (Title Case)
    const hasNamePattern = /^[A-Z][a-z]+ [A-Z][a-z]+/.test(description);
    
    // Check for celebrity-related keywords
    const hasCelebrityKeywords = celebrityPatterns.some(pattern => pattern.test(description));
    
    return hasNamePattern || hasCelebrityKeywords;
  }

  /**
   * Get celebrity context information
   */
  getCelebrityContext(name) {
    // In a real implementation, this could query a celebrity database
    // For now, return generic context
    return `Public figure or celebrity`;
  }

  /**
   * Extract face landmarks
   */
  extractFaceLandmarks(landmarks) {
    if (!landmarks) return {};
    
    const landmarkMap = {};
    landmarks.forEach(landmark => {
      landmarkMap[landmark.type] = {
        x: landmark.position.x,
        y: landmark.position.y,
        z: landmark.position.z
      };
    });
    return landmarkMap;
  }

  /**
   * Extract emotions from face detection
   */
  extractEmotions(face) {
    return {
      joy: face.joyLikelihood || 'UNKNOWN',
      sorrow: face.sorrowLikelihood || 'UNKNOWN',
      anger: face.angerLikelihood || 'UNKNOWN',
      surprise: face.surpriseLikelihood || 'UNKNOWN',
      headwear: face.headwearLikelihood || 'UNKNOWN',
      blurred: face.blurredLikelihood || 'UNKNOWN'
    };
  }

  /**
   * Estimate age from face detection
   */
  estimateAge(face) {
    // Google Vision doesn't provide age directly, this would need additional analysis
    return 'unknown';
  }

  /**
   * Estimate gender from face detection
   */
  estimateGender(face) {
    // Google Vision doesn't provide gender directly, this would need additional analysis
    return 'unknown';
  }

  /**
   * Generate celebrity summary
   */
  generateCelebritySummary(celebrities, webEntities, faces) {
    if (celebrities.length > 0) {
      const names = celebrities.slice(0, 3).map(c => c.description);
      return `Celebrity detected: ${names.join(', ')}`;
    } else if (faces.length > 0) {
      return `${faces.length} face(s) detected, but no celebrities identified`;
    } else if (webEntities.length > 0) {
      return `Web entities found but no celebrities identified`;
    } else {
      return 'No celebrities or notable entities detected';
    }
  }

  /**
   * Get enabled features based on user tier
   */
  getEnabledFeatures(requestedFeatures, userTier) {
    const tierFeatures = {
      free: ['text'],
      pro: ['text', 'objects', 'logos'],
      premium: ['text', 'objects', 'logos', 'celebrities']
    };

    const allowedFeatures = tierFeatures[userTier] || tierFeatures.free;
    
    if (requestedFeatures.length === 0) {
      return allowedFeatures;
    }
    
    return requestedFeatures.filter(feature => allowedFeatures.includes(feature));
  }

  /**
   * Handle errors with fallback suggestions
   */
  handleError(error, service) {
    // Simple fallback mapping (simplified from old config structure)
    const fallbackMap = {
      'textDetection': ['tesseract'],
      'webDetection': ['openai-vision'],
      'objectLocalization': ['openai-vision'],
      'logoDetection': ['openai-vision']
    };
    const fallbacks = fallbackMap[service] || [];
    
    return {
      success: false,
      service: `google-vision-${service}`,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        type: 'GOOGLE_VISION_ERROR'
      },
      fallback: {
        suggested: fallbacks,
        message: fallbacks.length > 0 ? 
          `Consider using fallback services: ${fallbacks.join(', ')}` :
          'No fallback services available'
      }
    };
  }

  /**
   * Health check for Google Vision API
   */
  async healthCheck() {
    try {
      // Create a minimal test image (1x1 pixel)
      const testImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );

      const request = {
        image: { content: testImage },
        features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
      };

      await this.client.annotateImage(request);
      
      return {
        healthy: true,
        message: 'Google Vision API is accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Google Vision API health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default GoogleVisionService; 