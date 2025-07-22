import { ImageAnnotatorClient } from '@google-cloud/vision';

class VisionService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initializeClient() {
    if (this.initialized) return;
    
    try {
      // Try to initialize Google Vision client
      this.client = new ImageAnnotatorClient();
      this.initialized = true;
      console.log('✅ Google Vision client initialized');
    } catch (error) {
      console.warn('⚠️ Google Vision not available:', error.message);
      console.warn('📝 Continuing without Google Vision - OCR + ChatGPT will still work');
      this.client = null;
      this.initialized = false;
    }
  }

  async detectObjects(imageBuffer) {
    await this.initializeClient();
    
    if (!this.client) {
      console.log('🔄 Google Vision unavailable, skipping object detection');
      return { objects: [], confidence: 0, success: false };
    }

    try {
      console.log('🔍 Google Vision: Detecting objects...');
      const [result] = await this.client.labelDetection({
        image: { content: imageBuffer }
      });

      const labels = result.labelAnnotations || [];
      const objects = labels
        .filter(label => label.score > 0.6) // Only high confidence
        .map(label => label.description.toLowerCase())
        .slice(0, 10); // Top 10 objects

      const avgConfidence = labels.length > 0 
        ? labels.reduce((sum, label) => sum + label.score, 0) / labels.length 
        : 0;

      console.log(`✅ Objects detected: ${objects.length} items (confidence: ${Math.round(avgConfidence * 100)}%)`);
      
      return {
        objects,
        confidence: avgConfidence,
        success: true,
        rawLabels: labels.slice(0, 5) // Keep top 5 for debugging
      };
    } catch (error) {
      console.error('❌ Object detection failed:', error.message);
      return { objects: [], confidence: 0, success: false };
    }
  }

  async detectLogos(imageBuffer) {
    await this.initializeClient();
    
    if (!this.client) {
      console.log('🔄 Google Vision unavailable, skipping logo detection');
      return { logos: [], confidence: 0, success: false };
    }

    try {
      console.log('🏷️ Google Vision: Detecting logos...');
      const [result] = await this.client.logoDetection({
        image: { content: imageBuffer }
      });

      const logos = result.logoAnnotations || [];
      const logoNames = logos
        .filter(logo => logo.score > 0.5) // Logos need high confidence
        .map(logo => logo.description);

      const avgConfidence = logos.length > 0 
        ? logos.reduce((sum, logo) => sum + logo.score, 0) / logos.length 
        : 0;

      console.log(`✅ Logos detected: ${logoNames.length} logos (confidence: ${Math.round(avgConfidence * 100)}%)`);
      
      return {
        logos: logoNames,
        confidence: avgConfidence,
        success: true,
        rawLogos: logos // Keep all for debugging
      };
    } catch (error) {
      console.error('❌ Logo detection failed:', error.message);
      return { logos: [], confidence: 0, success: false };
    }
  }

  async detectFaces(imageBuffer) {
    await this.initializeClient();
    
    if (!this.client) {
      console.log('🔄 Google Vision unavailable, skipping face detection');
      return { faces: 0, confidence: 0, success: false };
    }

    try {
      console.log('👤 Google Vision: Detecting faces...');
      const [result] = await this.client.faceDetection({
        image: { content: imageBuffer }
      });

      const faces = result.faceAnnotations || [];
      const faceCount = faces.length;
      
      // Average detection confidence
      const avgConfidence = faces.length > 0 
        ? faces.reduce((sum, face) => sum + face.detectionConfidence, 0) / faces.length 
        : 0;

      console.log(`✅ Faces detected: ${faceCount} faces (confidence: ${Math.round(avgConfidence * 100)}%)`);
      
      return {
        faces: faceCount,
        confidence: avgConfidence,
        success: true,
        faceDetails: faces.map(f => ({ 
          confidence: f.detectionConfidence,
          boundingBox: f.boundingPoly 
        })) // Keep details for debugging
      };
    } catch (error) {
      console.error('❌ Face detection failed:', error.message);
      return { faces: 0, confidence: 0, success: false };
    }
  }

  async detectText(imageBuffer) {
    await this.initializeClient();
    
    if (!this.client) {
      console.log('🔄 Google Vision unavailable, skipping text detection');
      return { text: '', confidence: 0, success: false };
    }

    try {
      console.log('📝 Google Vision: Detecting text...');
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer }
      });

      const textAnnotations = result.textAnnotations || [];
      const text = textAnnotations.length > 0 ? textAnnotations[0].description.trim() : '';
      
      // Get confidence from first annotation
      const confidence = textAnnotations.length > 0 ? (textAnnotations[0].confidence || 0.8) : 0;

      console.log(`✅ Text detected: ${text.length} characters (confidence: ${Math.round(confidence * 100)}%)`);
      
      return {
        text,
        confidence,
        success: true,
        wordCount: textAnnotations.length - 1 // First is full text, rest are words
      };
    } catch (error) {
      console.error('❌ Text detection failed:', error.message);
      return { text: '', confidence: 0, success: false };
    }
  }

  // Main function that combines all detections
  async analyzeImageContent(imageBuffer) {
    console.log('🔍 Starting comprehensive Google Vision analysis...');
    
    // Run all detections in parallel for speed
    const [objects, logos, faces, visionText] = await Promise.all([
      this.detectObjects(imageBuffer),
      this.detectLogos(imageBuffer),
      this.detectFaces(imageBuffer),
      this.detectText(imageBuffer)
    ]);

    const hasAnyResults = objects.success || logos.success || faces.success || visionText.success;
    
    if (!hasAnyResults) {
      console.log('⚠️ Google Vision analysis failed - will use fallback methods');
      return {
        objects: [],
        logos: [],
        faces: 0,
        text: '',
        confidence: 0,
        success: false
      };
    }

    // Calculate overall confidence
    const confidences = [objects, logos, faces, visionText]
      .filter(result => result.success)
      .map(result => result.confidence);
    
    const overallConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    console.log(`✅ Google Vision analysis complete:`, {
      objects: objects.objects?.length || 0,
      logos: logos.logos?.length || 0, 
      faces: faces.faces || 0,
      textLength: visionText.text?.length || 0,
      confidence: Math.round(overallConfidence * 100) + '%'
    });

    return {
      objects: objects.objects || [],
      logos: logos.logos || [],
      faces: faces.faces || 0,
      text: visionText.text || '',
      confidence: overallConfidence,
      success: hasAnyResults,
      // Keep detailed results for debugging
      details: {
        objectsResult: objects,
        logosResult: logos,
        facesResult: faces,
        textResult: visionText
      }
    };
  }
}

// Export singleton instance
const visionService = new VisionService();

export { visionService };
export const analyzeImageContent = (imageBuffer) => visionService.analyzeImageContent(imageBuffer); 