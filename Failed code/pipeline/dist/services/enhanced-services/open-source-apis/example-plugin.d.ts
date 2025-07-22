export = ExampleAIPlugin;
/**
 * Example Plugin - Shows the plugin interface in action
 * In the future, this pattern will be used for:
 * - HuggingFace BLIP-2, CLIP, etc.
 * - Ollama LLaVA, Moondream
 * - Replicate custom models
 * - Community contributed APIs
 */
declare class ExampleAIPlugin extends APIPlugin {
    constructor(config: any);
    apiUrl: any;
    apiKey: any;
    /**
     * Analyze image with this AI service
     */
    analyzeImage(imageData: any, questionType: any, parameters?: {}): Promise<{
        success: boolean;
        result: {
            description: string;
            confidence: number;
            processing_time: number;
            service: string;
        };
        metadata: {
            model: string;
            cost: number;
            responseTime: number;
        };
    }>;
    /**
     * Get plugin capabilities
     */
    getCapabilities(): string[];
    /**
     * Get cost estimate
     */
    getCost(questionType: any): number;
    /**
     * Get response time estimate
     */
    getResponseTime(questionType: any): number;
}
import { APIPlugin } from "./api-registry";
