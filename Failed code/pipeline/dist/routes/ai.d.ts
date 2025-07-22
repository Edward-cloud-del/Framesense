import { Request, Response } from 'express';
export interface AIRequest {
    message: string;
    imageData?: string;
}
export interface AIResponse {
    message: string;
    success: boolean;
    processing_info?: {
        question_type: string;
        optimization_strategy: string;
        ocr_used: boolean;
        image_optimized: boolean;
        processing_time?: {
            ocr: number;
            total: number;
        };
    };
    usage?: {
        requestCount: number;
        remainingRequests: number;
        timestamp: string;
    };
}
export declare const analyzeImageRoute: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
