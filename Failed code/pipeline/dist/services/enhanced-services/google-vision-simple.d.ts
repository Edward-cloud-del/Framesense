export default GoogleVisionService;
/**
 * Google Vision Service Class (ES Module)
 * Ready for celebrity identification and image analysis
 */
declare class GoogleVisionService {
    client: import("@google-cloud/vision/build/src/v1").ImageAnnotatorClient;
    /**
     * MOMENT 2.4: Celebrity/Web Detection Service (PREMIUM FEATURE)
     * Identify celebrities, public figures, and web entities
     */
    detectCelebritiesAndWeb(imageData: any, options?: {}): Promise<{
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
                } | null;
                emotions: {
                    joy: any;
                    sorrow: any;
                    anger: any;
                    surprise: any;
                };
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
    } | {
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
    }>;
    /**
     * MOMENT 2.2: Text Detection Service (OCR Fallback)
     */
    detectText(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
    } | {
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
                } | null;
            }[];
            confidence: number;
            wordCount: number;
        };
        metadata: {
            responseTime: number;
            cost: number;
            regionsFound: number;
        };
    }>;
    /**
     * MOMENT 2.3: Object Detection and Counting
     */
    detectObjects(imageData: any, options?: {}): Promise<{
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
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
                } | null;
            }[];
            labels: {
                description: string | null | undefined;
                confidence: number | null | undefined;
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
    prepareImageData(imageData: any): {
        content: Buffer<ArrayBufferLike>;
        source?: undefined;
    } | {
        source: {
            imageUri: string;
        };
        content?: undefined;
    };
    extractBoundingBox(boundingPoly: any): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    calculateAverageConfidence(textRegions: any): number;
    countObjectsByType(objects: any): {};
    generateObjectSummary(objects: any, labels: any): string;
    isCelebrityEntity(description: any): boolean;
    getCelebrityContext(name: any): string;
    extractEmotions(face: any): {
        joy: any;
        sorrow: any;
        anger: any;
        surprise: any;
    };
    generateCelebritySummary(celebrities: any, webEntities: any, faces: any): string;
    handleError(error: any, service: any): {
        success: boolean;
        service: string;
        error: {
            message: any;
            code: any;
            type: string;
        };
    };
    healthCheck(): Promise<{
        healthy: boolean;
        message: string;
        timestamp: string;
    }>;
}
