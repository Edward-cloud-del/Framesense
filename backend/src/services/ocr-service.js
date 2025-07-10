// 🔍 OCR SERVICE - Backend Implementation
// =======================================

// Optional Tesseract.js integration - install with: npm install tesseract.js
async function getTesseract() {
  try {
    const { default: TesseractImport } = await import('tesseract.js');
    return TesseractImport;
  } catch (error) {
    console.log('📝 Tesseract.js not installed - OCR will be simulated');
    return null;
  }
}

class OCRService {
  
  static async extractText(imageBuffer, options = {}) {
    const {
      language = 'eng',
      confidence_threshold = 0.5,
      preprocess = true
    } = options;

    console.log('🔍 Starting OCR text extraction...');

    // Get Tesseract instance
    const Tesseract = await getTesseract();
    
    // If Tesseract is not available, return mock result
    if (!Tesseract) {
      console.log('⚠️ OCR disabled - returning mock result');
      return {
        text: '',
        confidence: 0.0,
        has_text: false,
        processing_time: 0
      };
    }

    const startTime = Date.now();

    try {
      // Preprocess image if requested
      let processedBuffer = imageBuffer;
      if (preprocess) {
        processedBuffer = await this.preprocessImageForOCR(imageBuffer);
      }

      // Run Tesseract OCR
      const result = await Tesseract.recognize(processedBuffer, language, {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            console.log(`🔄 OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });

      const processingTime = Date.now() - startTime;
      const confidence = result.data.confidence / 100; // Convert to 0-1 range

      // Filter out low-confidence text
      const cleanText = this.cleanOCRText(result.data.text);
      const hasText = cleanText.length > 0 && confidence > confidence_threshold;

      console.log(`✅ OCR completed in ${processingTime}ms - Confidence: ${Math.round(confidence * 100)}%`);

      return {
        text: cleanText,
        confidence: confidence,
        has_text: hasText,
        processing_time: processingTime,
        raw_result: result.data // Include full Tesseract result for debugging
      };

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      return {
        text: '',
        confidence: 0.0,
        has_text: false,
        processing_time: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Preprocess image for better OCR results
  static async preprocessImageForOCR(imageBuffer) {
    const { default: sharp } = await import('sharp');
    
    try {
      // OCR preprocessing: convert to grayscale, increase contrast, denoise
      const processed = await sharp(imageBuffer)
        .grayscale()
        .normalize() // Auto contrast
        .sharpen()   // Sharpen text
        .png()       // Convert to PNG for better OCR
        .toBuffer();

      console.log('🎨 Image preprocessed for OCR');
      return processed;

    } catch (error) {
      console.warn('⚠️ Image preprocessing failed, using original:', error);
      return imageBuffer;
    }
  }

  // Clean and filter OCR text
  static cleanOCRText(rawText) {
    if (!rawText) return '';

    return rawText
      .trim()
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII characters except newlines
      .replace(/\s{3,}/g, '  ') // Replace multiple spaces with double space
      .trim();
  }

  // Analyze image to determine if it likely contains text
  static async analyzeImageForText(imageBuffer) {
    const { default: sharp } = await import('sharp');
    
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      
      // Simple heuristics for text detection
      const hasContrastIndicatingText = stats.channels.some(channel => 
        channel.std > 30 // Standard deviation indicates contrast
      );
      
      const isReasonableSize = metadata.width > 50 && metadata.height > 20;
      
      return {
        likely_contains_text: hasContrastIndicatingText && isReasonableSize,
        image_stats: {
          dimensions: { width: metadata.width, height: metadata.height },
          contrast_score: Math.max(...stats.channels.map(c => c.std))
        }
      };

    } catch (error) {
      console.warn('⚠️ Image analysis failed:', error);
      return {
        likely_contains_text: true, // Default to true if analysis fails
        image_stats: null
      };
    }
  }

  // Extract text with intelligent fallback strategies
  static async extractTextIntelligent(imageBuffer, context = {}) {
    const { questionType = 'general', forceOCR = false } = context;

    // Quick analysis to see if image likely contains text
    const analysis = await this.analyzeImageForText(imageBuffer);
    
    if (!analysis.likely_contains_text && !forceOCR) {
      console.log('🚫 Image unlikely to contain text, skipping OCR');
      return {
        text: '',
        confidence: 0.0,
        has_text: false,
        processing_time: 0,
        skipped_reason: 'Image analysis suggests no text content'
      };
    }

    // Use different OCR settings based on question type
    const ocrOptions = this.getOCROptionsForQuestionType(questionType);
    
    return await this.extractText(imageBuffer, ocrOptions);
  }

  // Get optimized OCR options based on question type
  static getOCROptionsForQuestionType(questionType) {
    const optionsMap = {
      text_extraction: {
        language: 'eng',
        confidence_threshold: 0.3, // Lower threshold for text extraction
        preprocess: true
      },
      code_analysis: {
        language: 'eng',
        confidence_threshold: 0.6, // Higher threshold for code
        preprocess: true
      },
      data_analysis: {
        language: 'eng',
        confidence_threshold: 0.5, // Medium threshold for data
        preprocess: true
      },
      general: {
        language: 'eng',
        confidence_threshold: 0.5,
        preprocess: true
      }
    };

    return optionsMap[questionType] || optionsMap.general;
  }

  // Test OCR functionality
  static async testOCR() {
    const Tesseract = await getTesseract();
    
    if (!Tesseract) {
      return {
        available: false,
        message: 'Tesseract.js not installed - OCR functionality disabled'
      };
    }

    try {
      // Test with a simple image buffer (1x1 white pixel)
      const testBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk start
        0x54, 0x78, 0x9C, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, // white pixel data
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
        0xAE, 0x42, 0x60, 0x82
      ]);

      await Tesseract.recognize(testBuffer, 'eng');
      
      return {
        available: true,
        message: 'OCR service is working correctly'
      };

    } catch (error) {
      return {
        available: false,
        message: `OCR test failed: ${error.message}`
      };
    }
  }
}

export { OCRService }; 