export default googleVisionService;
declare const googleVisionService: GoogleVisionService;
/**
 * Google Vision Service Class
 * Handles all Google Vision API interactions with proper error handling and caching
 */
export class GoogleVisionService {
    client: import("@google-cloud/vision/build/src/v1/image_annotator_client.js").ImageAnnotatorClient;
    config: {
        projectId: string;
        credentials: {
            type: string;
            project_id: string;
            private_key_id: string;
            private_key: string;
            client_email: string;
            client_id: string;
            auth_uri: string;
            token_uri: string;
            auth_provider_x509_cert_url: string;
            client_x509_cert_url: string;
            universe_domain: string;
        };
        apiSettings: {
            textDetection: {
                maxResults: number;
                languages: string[];
                confidence: number;
            };
            objectDetection: {
                maxResults: number;
                confidence: number;
            };
            webDetection: {
                maxResults: number;
                confidence: number;
                includeGeoResults: boolean;
                websiteSearch: boolean;
            };
            faceDetection: {
                maxResults: number;
                landmarks: boolean;
                emotions: boolean;
                confidence: number;
            };
        };
        rateLimits: {
            requestsPerMinute: number;
            requestsPerDay: number;
            concurrentRequests: number;
        };
        tierAccess: {
            free: {
                services: string[];
                dailyLimit: number;
                features: string[];
            };
            pro: {
                services: string[];
                dailyLimit: number;
                features: string[];
            };
            premium: {
                services: string[];
                dailyLimit: number;
                features: string[];
            };
        };
    };
    requestCounts: Map<any, any>;
    /**
     * MOMENT 2.2: Text Detection Service (OCR Fallback)
     * High-accuracy text extraction with language detecti
     */
    detectText(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        result: {
            fullText: string | null | undefined;
            textRegions: {
                text: string | null | undefined;
                confidence: number;
                boundingBox: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    vertices: any;
                } | null;
                language: string;
            }[];
            detectedLanguage: string;
            confidence: number;
            wordCount: number;
        };
        metadata: {
            responseTime: number;
            cost: number;
            regionsFound: number;
            apiVersion: string;
        };
    } | {
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    }>;
    /**
     * MOMENT 2.3: Object Detection and Counting
     * Detect and count objects with bounding boxes
     */
    detectObjects(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    } | {
        success: boolean;
        service: string;
        result: {
            objects: {
                name: string | null | undefined;
                confidence: number | null | undefined;
                boundingBox: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    vertices: any;
                } | null;
                mid: string | null | undefined;
            }[];
            labels: {
                description: string | null | undefined;
                confidence: number | null | undefined;
                topicality: number | null | undefined;
                mid: string | null | undefined;
            }[];
            objectCounts: {};
            totalObjects: number;
            summary: string;
        };
        metadata: {
            responseTime: number;
            cost: number;
            objectsDetected: number;
            labelsDetected: number;
        };
    }>;
    /**
     * MOMENT 2.4: Celebrity/Web Detection Service (PREMIUM FEATURE)
     * Identify celebrities, public figures, and web entities
     */
    detectCelebritiesAndWeb(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    } | {
        success: boolean;
        service: string;
        result: {
            celebrityDetected: boolean;
            celebrities: {
                entityId: string | null | undefined;
                description: string | null | undefined;
                score: number | null | undefined;
            }[];
            bestMatch: {
                name: string | null | undefined;
                confidence: number | null | undefined;
                entityId: string | null | undefined;
                context: string;
            } | null;
            webEntities: {
                entityId: string | null | undefined;
                description: string | null | undefined;
                score: number | null | undefined;
            }[];
            similarImages: {
                url: string | null | undefined;
                score: number;
            }[];
            webPages: {
                url: string | null | undefined;
                title: string;
                score: number;
            }[];
            faces: {
                confidence: number | null | undefined;
                boundingBox: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    vertices: any;
                } | null;
                landmarks: {};
                emotions: {
                    joy: any;
                    sorrow: any;
                    anger: any;
                    surprise: any;
                    headwear: any;
                    blurred: any;
                };
                age: string;
                gender: string;
            }[];
            summary: string;
        };
        metadata: {
            responseTime: number;
            cost: number;
            entitiesFound: number;
            facesFound: number;
            tier: string;
        };
    }>;
    /**
     * Logo Detection Service
     * Identify brands and logos in images
     */
    detectLogos(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    } | {
        success: boolean;
        service: string;
        result: {
            logos: {
                description: string | null | undefined;
                confidence: number | null | undefined;
                boundingBox: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    vertices: any;
                } | null;
                mid: string | null | undefined;
            }[];
            logoCount: number;
            brands: (string | null | undefined)[];
            summary: string;
        };
        metadata: {
            responseTime: number;
            cost: number;
            logosDetected: number;
        };
    }>;
    /**
     * Comprehensive Analysis
     * Run multiple detection types in parallel for complete analysis
     */
    comprehensiveAnalysis(imageData: any, features?: any[], userTier?: string): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    } | {
        success: boolean;
        service: string;
        result: {};
        metadata: {
            responseTime: number;
            totalCost: number;
            featuresRun: any;
            userTier: string;
        };
    }>;
    /**
     * Prepare image data for Google Vision API
     */
    prepareImageData(imageData: any): {
        content: Buffer<ArrayBufferLike>;
        source?: undefined;
    } | {
        source: {
            imageUri: string;
        };
        content?: undefined;
    };
    /**
     * Extract bounding box coordinates
     */
    extractBoundingBox(boundingPoly: any): {
        x: number;
        y: number;
        width: number;
        height: number;
        vertices: any;
    } | null;
    /**
     * Detect language of text
     */
    detectLanguage(text: any): "de" | "en" | "es" | "fr" | "sv";
    /**
     * Calculate average confidence from text regions
     */
    calculateAverageConfidence(textRegions: any): number;
    /**
     * Count objects by type
     */
    countObjectsByType(objects: any): {};
    /**
     * Generate object summary
     */
    generateObjectSummary(objects: any, labels: any): string;
    /**
     * Check if entity is likely a celebrity
     */
    isCelebrityEntity(description: any): boolean;
    /**
     * Get celebrity context information
     */
    getCelebrityContext(name: any): string;
    /**
     * Extract face landmarks
     */
    extractFaceLandmarks(landmarks: any): {};
    /**
     * Extract emotions from face detection
     */
    extractEmotions(face: any): {
        joy: any;
        sorrow: any;
        anger: any;
        surprise: any;
        headwear: any;
        blurred: any;
    };
    /**
     * Estimate age from face detection
     */
    estimateAge(face: any): string;
    /**
     * Estimate gender from face detection
     */
    estimateGender(face: any): string;
    /**
     * Generate celebrity summary
     */
    generateCelebritySummary(celebrities: any, webEntities: any, faces: any): string;
    /**
     * Get enabled features based on user tier
     */
    getEnabledFeatures(requestedFeatures: any, userTier: any): any;
    /**
     * Handle errors with fallback suggestions
     */
    handleError(error: any, service: any): {
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
        fallback: {
            suggested: any;
            message: string;
        };
    };
    /**
     * Health check for Google Vision API
     */
    healthCheck(): Promise<{
        healthy: boolean;
        message: string;
        timestamp: string;
    }>;
}
