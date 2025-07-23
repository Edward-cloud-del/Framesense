import { ImageAnnotatorClient } from '@google-cloud/vision';

interface VisionResult {
  objects: string[];
  logos: string[];
  faces: number;
  text: string;
  confidence: number;
  success: boolean;
  details?: any;
}

interface DetectionResult {
  success: boolean;
  confidence: number;
}

interface ObjectResult extends DetectionResult {
  objects: string[];
  rawLabels?: any[];
}

interface LogoResult extends DetectionResult {
  logos: string[];
  rawLogos?: any[];
}

interface FaceResult extends DetectionResult {
  faces: number;
  faceDetails?: any[];
}

interface TextResult extends DetectionResult {
  text: string;
  wordCount?: number;
}

class VisionService {
  private client: ImageAnnotatorClient | null = null;
  private initialized: boolean = false;

  async initializeClient(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Try to initialize Google Vision client
      this.client = new ImageAnnotatorClient();
      this.initialized = true;
      console.log('✅ Google Vision client initialized');
    } catch (error: any) {
      console.warn('⚠️ Google Vision not available:', error.message);
      console.warn('📝 Continuing without Google Vision - OCR + ChatGPT will still work');
      this.client = null;
      this.initialized = true; // Mark as initialized to avoid retry loops
    }
  }

  async detectObjects(imageBuffer: Buffer): Promise<ObjectResult> {
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
        .filter(label => (label.score || 0) > 0.6) // Only high confidence
        .map(label => label.description?.toLowerCase() || '')
        .slice(0, 10); // Top 10 objects

      const avgConfidence = labels.length > 0 
        ? labels.reduce((sum, label) => sum + (label.score || 0), 0) / labels.length 
        : 0;

      console.log(`✅ Objects detected: ${objects.length} items (confidence: ${Math.round(avgConfidence * 100)}%)`);
      
      return {
        objects,
        confidence: avgConfidence,
        success: true,
        rawLabels: labels.slice(0, 5) // Keep top 5 for debugging
      };
    } catch (error: any) {
      console.error('❌ Object detection failed:', error.message);
      return { objects: [], confidence: 0, success: false };
    }
  }

  async detectLogos(imageBuffer: Buffer): Promise<LogoResult> {
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
        .filter(logo => (logo.score || 0) > 0.5) // Logos need high confidence
        .map(logo => logo.description || '');

      const avgConfidence = logos.length > 0 
        ? logos.reduce((sum, logo) => sum + (logo.score || 0), 0) / logos.length 
        : 0;

      console.log(`✅ Logos detected: ${logoNames.length} logos (confidence: ${Math.round(avgConfidence * 100)}%)`);
      
      return {
        logos: logoNames,
        confidence: avgConfidence,
        success: true,
        rawLogos: logos // Keep all for debugging
      };
    } catch (error: any) {
      console.error('❌ Logo detection failed:', error.message);
      return { logos: [], confidence: 0, success: false };
    }
  }

  async detectFaces(imageBuffer: Buffer): Promise<FaceResult> {
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
        ? faces.reduce((sum, face) => sum + (face.detectionConfidence || 0), 0) / faces.length 
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
    } catch (error: any) {
      console.error('❌ Face detection failed:', error.message);
      return { faces: 0, confidence: 0, success: false };
    }
  }

  async detectText(imageBuffer: Buffer): Promise<TextResult> {
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
      const text = textAnnotations.length > 0 ? (textAnnotations[0].description?.trim() || '') : '';
      
      // Get confidence from first annotation
      const confidence = textAnnotations.length > 0 ? (textAnnotations[0].confidence || 0.8) : 0;

      console.log(`✅ Text detected: ${text.length} characters (confidence: ${Math.round(confidence * 100)}%)`);
      
      return {
        text,
        confidence,
        success: true,
        wordCount: textAnnotations.length - 1 // First is full text, rest are words
      };
    } catch (error: any) {
      console.error('❌ Text detection failed:', error.message);
      return { text: '', confidence: 0, success: false };
    }
  }

  // Main function that combines all detections
  async analyzeImageContent(imageBuffer: Buffer): Promise<VisionResult> {
    console.log('🔍 Starting comprehensive Google Vision analysis...');
    
    // Run detections with timeouts to prevent hanging
    const timeoutMs = 8000; // 8 second timeout per detection
    
    const detectWithTimeout = async (detectFn: Promise<any>, name: string) => {
      try {
        return await Promise.race([
          detectFn,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${name} timeout`)), timeoutMs)
          )
        ]);
      } catch (error: any) {
        console.warn(`⚠️ ${name} failed:`, error.message);
        return { success: false, confidence: 0 };
      }
    };

    const [objects, logos, faces, visionText] = await Promise.all([
      detectWithTimeout(this.detectObjects(imageBuffer), 'Objects'),
      detectWithTimeout(this.detectLogos(imageBuffer), 'Logos'),
      detectWithTimeout(this.detectFaces(imageBuffer), 'Faces'),
      detectWithTimeout(this.detectText(imageBuffer), 'Text')
    ]);

    // Handle fallback results from timeouts
    const safeObjects = objects.success ? objects : { objects: [], confidence: 0, success: false };
    const safeLogos = logos.success ? logos : { logos: [], confidence: 0, success: false };
    const safeFaces = faces.success ? faces : { faces: 0, confidence: 0, success: false };
    const safeText = visionText.success ? visionText : { text: '', confidence: 0, success: false };
    
    const hasAnyResults = safeObjects.success || safeLogos.success || safeFaces.success || safeText.success;
    
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
    const confidences = [safeObjects, safeLogos, safeFaces, safeText]
      .filter(result => result.success)
      .map(result => result.confidence);
    
    const overallConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    console.log(`✅ Google Vision analysis complete:`, {
      objects: safeObjects.objects?.length || 0,
      logos: safeLogos.logos?.length || 0, 
      faces: safeFaces.faces || 0,
      textLength: safeText.text?.length || 0,
      confidence: Math.round(overallConfidence * 100) + '%'
    });

    return {
      objects: safeObjects.objects || [],
      logos: safeLogos.logos || [],
      faces: safeFaces.faces || 0,
      text: safeText.text || '',
      confidence: overallConfidence,
      success: hasAnyResults,
      // Keep detailed results for debugging
      details: {
        objectsResult: safeObjects,
        logosResult: safeLogos,
        facesResult: safeFaces,
        textResult: safeText
      }
    };
  }
}

// Export singleton instance
const visionService = new VisionService();

export { visionService };
export const analyzeImageContent = (imageBuffer: Buffer): Promise<VisionResult> => 
  visionService.analyzeImageContent(imageBuffer); 