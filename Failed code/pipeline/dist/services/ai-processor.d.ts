export class AIProcessor {
    static processRequest(request: any, openaiClient: any, userContext?: {}): Promise<{
        message: any;
        success: boolean;
        processing_info: {
            question_type: string;
            model_used: any;
            user_tier: any;
            optimization_strategy: string;
            ocr_used: boolean;
            image_optimized: any;
            processing_time: {
                ocr: number;
                total: number;
            };
            tokens_used: number;
            rate_limits: {
                remaining_hourly: number;
                remaining_daily: number;
                tier_limits: any;
            };
        };
        usage: {
            requestCount: number;
            remainingRequests: number;
            timestamp: string;
        };
    }>;
    static shouldRunOCR(questionType: any, message: any): boolean;
    static buildOpenAIMessages(optimizedPrompt: any, imageData: any): {
        role: string;
        content: any;
    }[];
    static processWithFallback(request: any, openaiClient: any, userContext?: {}): Promise<{
        message: any;
        success: boolean;
        processing_info: {
            question_type: string;
            model_used: any;
            user_tier: any;
            optimization_strategy: string;
            ocr_used: boolean;
            image_optimized: any;
            processing_time: {
                ocr: number;
                total: number;
            };
            tokens_used: number;
            rate_limits: {
                remaining_hourly: number;
                remaining_daily: number;
                tier_limits: any;
            };
        };
        usage: {
            requestCount: number;
            remainingRequests: number;
            timestamp: string;
        };
    } | {
        message: any;
        success: boolean;
        processing_info: {
            strategy: string;
            ocr_used: boolean;
            image_optimized: boolean;
        };
    } | undefined>;
    static processSimple(request: any, openaiClient: any): Promise<{
        message: any;
        success: boolean;
        processing_info: {
            strategy: string;
            ocr_used: boolean;
            image_optimized: boolean;
        };
    }>;
    static processMinimal(request: any, openaiClient: any): Promise<{
        message: any;
        success: boolean;
        processing_info: {
            strategy: string;
            ocr_used: boolean;
            image_optimized: boolean;
        };
    }>;
    static healthCheck(): Promise<{
        prompt_optimizer: boolean;
        image_optimizer: boolean;
        ocr_service: boolean;
        overall: boolean;
    }>;
}
