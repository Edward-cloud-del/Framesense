export class EnhancedOCR {
    constructor(cacheManager?: null, googleVisionService?: null);
    cacheManager: any;
    googleVision: any;
    QUALITY_THRESHOLDS: {
        MIN_CONFIDENCE: number;
        MIN_TEXT_LENGTH: number;
        MIN_WORD_COUNT: number;
        MAX_GIBBERISH_RATIO: number;
    };
    PREPROCESSING_OPTIONS: {
        contrast: number;
        brightness: number;
        denoise: boolean;
        deskew: boolean;
        scale: number;
    };
    /**
     * Main entry point for enhanced OCR
     * @param {Buffer|string} imageData - Image buffer or base64 string
     * @param {Object} options - OCR options
     * @returns {Object} OCR result with metadata
     */
    extractText(imageData: Buffer | string, options?: Object): Object;
    /**
     * Tesseract OCR with preprocessing (with robust error handling)
     */
    tesseractOCR(imageData: any, options?: {}): Promise<{
        text: string;
        confidence: number;
        has_text: boolean;
        word_count: number;
        language_detected: any;
        regions: {
            text: string;
            confidence: number;
            boundingBox: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[];
        cost: number;
        preprocessing_used: any;
        fullText: string;
        textRegions: {
            text: string;
            confidence: number;
            boundingBox: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[];
    }>;
    /**
     * Google Vision fallback for OCR
     */
    googleVisionFallback(imageData: any, language?: string): Promise<{
        text: any;
        confidence: any;
        has_text: boolean;
        word_count: any;
        language_detected: string;
        regions: any;
        cost: any;
        preprocessing_used: boolean;
        fullText: any;
        textRegions: any;
    }>;
    /**
     * Validate OCR text quality - ENHANCED with better debug and more permissive validation
     */
    validateTextQuality(result: any): boolean;
    /**
     * Calculate gibberish ratio (simple heuristic)
     */
    calculateGibberishRatio(text: any): number;
    /**
     * Preprocess image for better OCR accuracy
     */
    preprocessImageForOCR(imageData: any): Promise<any>;
    /**
     * Generate hash for caching
     */
    generateImageHash(imageData: any): string;
    /**
     * Get OCR service capabilities
     */
    getCapabilities(): {
        methods: string[];
        languages: string[];
        features: string[];
        cost: {
            tesseract: number;
            google_vision_fallback: number;
        };
        performance: {
            tesseract: string;
            google_vision_fallback: string;
        };
    };
}
