export class PromptOptimizer {
    static optimizePrompt(context: any): {
        prompt: string;
        maxTokens: any;
        temperature: any;
        reasoning: string;
    };
    static detectQuestionType(message: any): "code_analysis" | "text_extraction" | "ui_analysis" | "data_analysis" | "explanation" | "problem_solving" | "general";
    static selectPromptStyle(questionType: any, context: any): any;
    static buildOptimizedPrompt(context: any, style: any): string;
    static getSpecificInstructions(context: any): string;
    static getOptimalTokenCount(questionType: any): any;
    static getOptimalTemperature(questionType: any): any;
    static matchesKeywords(text: any, keywords: any): any;
}
