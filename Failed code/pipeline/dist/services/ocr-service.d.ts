export class OCRService {
    static extractText(imageBuffer: any, options?: {}): Promise<{
        text: string;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        raw_result?: undefined;
        error?: undefined;
    } | {
        text: any;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        raw_result: import("tesseract.js").Page;
        error?: undefined;
    } | {
        text: string;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        error: any;
        raw_result?: undefined;
    }>;
    static preprocessImageForOCR(imageBuffer: any): Promise<any>;
    static cleanOCRText(rawText: any): any;
    static analyzeImageForText(imageBuffer: any): Promise<{
        likely_contains_text: boolean;
        image_stats: {
            dimensions: {
                width: number | undefined;
                height: number | undefined;
            };
            contrast_score: number;
        };
    } | {
        likely_contains_text: boolean;
        image_stats: null;
    }>;
    static extractTextIntelligent(imageBuffer: any, context?: {}): Promise<{
        text: string;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        raw_result?: undefined;
        error?: undefined;
    } | {
        text: any;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        raw_result: import("tesseract.js").Page;
        error?: undefined;
    } | {
        text: string;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        error: any;
        raw_result?: undefined;
    } | {
        text: string;
        confidence: number;
        has_text: boolean;
        processing_time: number;
        skipped_reason: string;
    }>;
    static getOCROptionsForQuestionType(questionType: any): any;
    static testOCR(): Promise<{
        available: boolean;
        message: string;
    }>;
}
