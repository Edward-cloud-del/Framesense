/**
 * FrameSense Google Vision Service (ES Module)
 * Comprehensive image analysis using Google Cloud Vision API
 * 
 * MOMENT 2.1-2.4: Google Vision Integration (Working Version)
 */

import vision from '@google-cloud/vision';

// Inline configuration to avoid module loading issues
const GOOGLE_VISION_CREDENTIALS = {
  type: "service_account",
  project_id: "orbital-anchor-466111-c9",
  private_key_id: "cf682b8fbe3ddf6650a4e735c213d90e6af37aaf",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDZ9FLKv3C7AaHZ\n1yegKbbjg/jkjmJ7PU6iLmTaoV8Qmtr79ry5rqXxMxVpsRgluxDKdpsH4fi5wyRR\nmric9D/GVO6rFExfH/3NepsMBN6CI/cxjGJJeXR4pQKM0fvPnMzhFVz7x68myhJ8\nG7MrvGODJrWafPr1yWW93qfIiQotkhGsDH4G6BbE8wTt+OB6eG+aica6hZLbus2w\nKo+JsI/EdsOOKygklrjlLoye7OozIxA4/0CZp/tYt72/KRFxm5Lgy9PfYmHqzgki\neF6BCrAVWwRTER6fD0yUYGzDQeqNio+AkK5o/iDRVOM8QWXAWM7a4YNrxVx3OjpU\nWaLoV4iTAgMBAAECggEAWGm1AAvilemWl0ChEWZ6ixZo64YayvVWpZF+VfXqE1lO\nBbHUYtpG9G4NfJ9bNUsKB6dPQkZXWDuhyvyhcQHfsPuZCYslY90dXrIinSCIhnBC\ngTX6VOXQ6nO9chRoOpLXxWKeIoChO3HzR6cQ6mf0UipstquGPhghjoD4vO9iUpNT\nrrMM2sMGFPkVL9Sgh5kgZYr3h5mTY4YKop5OJIsDT68yXijPHAMREkxq0D8QDR23\nIEekL9oyZ11gv3uhySrlPiZHmMZvcZhLuatn+FYukjTd0flHDowMTZZOqdT0zBPM\nxP5JV+FAg9R9XKBXRx/MutZKnWLYQI226CvC3P29WQKBgQDwOVrS74m0/lgsHIWU\nyzOZ5/1IaUabh++CsmgDKfXxEDoPrE6SemcctrLv4Ph5A5SsQTvIp4/oCa39Z4F/\nrdATzFwSxuLKJbeIwi9kOG/VlUgT1C3sN8AYbvKQCNv4fb0nqDYqrcLCm7fepf0h\nOYI0vN0paMuVzLmGTeJwHCwq1wKBgQDoRJJC34TQkp+QWPLfkAPOjjkNnjQuY0Yx\nTZRRx6sPYbKnXsEjU3Eb7EGTAoScq7sRqiR4thbIWO3/gOnMZpWifK4s0f2wXQFX\np0DOQpNLldUZPVQ3ycKiQ1AuhQkGSIiYQ6KbeeFlWBY94Z7LojRdo07mFdXfA+JN\npUdDMu30pQKBgQCmNBiJvp95MUyR4H3vj5O5FVAhbG0kqK1msMbUAZEe40o4k8+c\n+sEilalB3FYta/POJigV0RD4ytGtdJKdYwWG3SqK9z3r/KJ6JVgisAV4MZu31GKd\nf4kRnpmGXArNZzmbGX+4kZYhjRlvG0sCVMaodE9UGiRZFVb6/CIBzQwl6wKBgQCd\n6cj7GFaHK7i6fg8aOiKsc3uMq6vUggA+Ev2tIDBH8+dv7XcoWlnDXzwyA/s/PW6h\nEula/Im+yt984BuUsYY4g8YziM2O85yvCHKCCTd1ozfPwieZCl5+zX8dMauyDux3\ngTxzskixC1OL3PKGhhBOPXKt8diHmG9q1Nz/bgfkVQKBgQCCbKWQKH6pIIenMUNi\nOYur9dunlJ51cDnb3WjozPovDTvtoDnImht+rdTOXH8L13ds+wlxszxrvNXjKXFq\nwD65Y9oQzT6ESfpea6/weVPAMOhv6oDzy2OZCTHL6I26iIhXJ0ZjRNIfhTtnRiY3\nR09Ko3+kKmmBUrcRk7WAR9au4A==\n-----END PRIVATE KEY-----\n",
  client_email: "framesense@orbital-anchor-466111-c9.iam.gserviceaccount.com",
  client_id: "103936804983902424976",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/framesense%40orbital-anchor-466111-c9.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

/**
 * Google Vision Service Class (ES Module)
 * Ready for celebrity identification and image analysis
 */
class GoogleVisionService {
  constructor() {
    // Initialize Google Vision client with credentials
    this.client = new vision.ImageAnnotatorClient({
      credentials: GOOGLE_VISION_CREDENTIALS,
      projectId: GOOGLE_VISION_CREDENTIALS.project_id
    });
    
    console.log('✅ Google Vision Service initialized for celebrity detection');
  }

  /**
   * MOMENT 2.4: Celebrity/Web Detection Service (PREMIUM FEATURE)
   * Identify celebrities, public figures, and web entities
   */
  async detectCelebritiesAndWeb(imageData, options = {}) {
    try {
      const startTime = Date.now();

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
        this.isCelebrityEntity(entity.description) && entity.score > 0.5
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
        emotions: this.extractEmotions(face)
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
          cost: 0.0035, // Google Vision Web Detection cost
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
   * MOMENT 2.2: Text Detection Service (OCR Fallback)
   */
  async detectText(imageData, options = {}) {
    try {
      const startTime = Date.now();
      
      const request = {
        image: this.prepareImageData(imageData),
        features: [{ type: 'TEXT_DETECTION' }],
        imageContext: {
          languageHints: options.languageHints || ['en', 'sv', 'es', 'fr', 'de']
        }
      };

      const [result] = await this.client.annotateImage(request);
      const responseTime = Date.now() - startTime;

      const textAnnotations = result.textAnnotations || [];
      const fullText = textAnnotations.length > 0 ? textAnnotations[0].description : '';
      
      const textRegions = textAnnotations.slice(1).map(annotation => ({
        text: annotation.description,
        confidence: annotation.score || 0.9,
        boundingBox: this.extractBoundingBox(annotation.boundingPoly)
      }));

      const response = {
        success: true,
        service: 'google-vision-text',
        result: {
          fullText: fullText,
          textRegions: textRegions,
          confidence: this.calculateAverageConfidence(textRegions),
          wordCount: fullText.split(/\s+/).filter(word => word.length > 0).length
        },
        metadata: {
          responseTime: responseTime,
          cost: 0.0015,
          regionsFound: textRegions.length
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
   */
  async detectObjects(imageData, options = {}) {
    try {
      const startTime = Date.now();

      const request = {
        image: this.prepareImageData(imageData),
        features: [
          { type: 'OBJECT_LOCALIZATION', maxResults: options.maxResults || 50 },
          { type: 'LABEL_DETECTION', maxResults: options.maxLabels || 20 }
        ]
      };

      const [result] = await this.client.annotateImage(request);
      const responseTime = Date.now() - startTime;

      const localizedObjects = (result.localizedObjectAnnotations || []).map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: this.extractBoundingBox(obj.boundingPoly)
      }));

      const labels = (result.labelAnnotations || []).map(label => ({
        description: label.description,
        confidence: label.score
      }));

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
          cost: 0.006,
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

  // Helper Methods
  // ==============

  prepareImageData(imageData) {
    if (Buffer.isBuffer(imageData)) {
      return { content: imageData };
    } else if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        return { content: Buffer.from(base64Data, 'base64') };
      } else if (imageData.startsWith('http')) {
        return { source: { imageUri: imageData } };
      } else {
        return { content: Buffer.from(imageData, 'base64') };
      }
    }
    throw new Error('Invalid image data format');
  }

  extractBoundingBox(boundingPoly) {
    if (!boundingPoly || !boundingPoly.vertices) return null;
    
    const vertices = boundingPoly.vertices;
    return {
      x: Math.min(...vertices.map(v => v.x || 0)),
      y: Math.min(...vertices.map(v => v.y || 0)),
      width: Math.max(...vertices.map(v => v.x || 0)) - Math.min(...vertices.map(v => v.x || 0)),
      height: Math.max(...vertices.map(v => v.y || 0)) - Math.min(...vertices.map(v => v.y || 0))
    };
  }

  calculateAverageConfidence(textRegions) {
    if (textRegions.length === 0) return 0;
    const sum = textRegions.reduce((acc, region) => acc + region.confidence, 0);
    return sum / textRegions.length;
  }

  countObjectsByType(objects) {
    const counts = {};
    objects.forEach(obj => {
      counts[obj.name] = (counts[obj.name] || 0) + 1;
    });
    return counts;
  }

  generateObjectSummary(objects, labels) {
    if (objects.length === 0) return 'No objects detected in the image';
    
    const topObjects = objects.slice(0, 5).map(obj => obj.name);
    const topLabels = labels.slice(0, 3).map(label => label.description);
    
    return `Detected ${objects.length} objects including: ${topObjects.join(', ')}. Scene: ${topLabels.join(', ')}`;
  }

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

  getCelebrityContext(name) {
    return `Public figure or celebrity`;
  }

  extractEmotions(face) {
    return {
      joy: face.joyLikelihood || 'UNKNOWN',
      sorrow: face.sorrowLikelihood || 'UNKNOWN',
      anger: face.angerLikelihood || 'UNKNOWN',
      surprise: face.surpriseLikelihood || 'UNKNOWN'
    };
  }

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

  handleError(error, service) {
    return {
      success: false,
      service: `google-vision-${service}`,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        type: 'GOOGLE_VISION_ERROR'
      }
    };
  }

  async healthCheck() {
    try {
      // Test with a minimal request
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