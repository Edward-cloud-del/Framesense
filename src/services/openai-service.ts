// 🚨 TEMPORARY FRONTEND IMPLEMENTATION 🚨
// ==========================================
// ⚠️  WARNING: This runs OpenAI API calls from the browser (frontend)
// ⚠️  SECURITY: API key is exposed in browser - NOT suitable for production
// ⚠️  TODO: Move this entire implementation to Rust/Tauri backend
// ⚠️  MIGRATION: Replace this file with backend Tauri commands
// ==========================================

import OpenAI from 'openai';
import type { IAIService, AIRequest, AIResponse, AIServiceConfig, UsageTracker } from '../types/ai-types';
import { PromptOptimizer, type PromptContext } from './prompt-optimizer';
import { ImageOptimizer } from '../utils/image-optimizer';

export class OpenAIServiceFrontend implements IAIService {
  private client: OpenAI;
  private config: AIServiceConfig;
  private usageTracker: UsageTracker;

  constructor(config: AIServiceConfig) {
    this.config = {
      model: 'gpt-4o',
      maxTokens: 1000,
      temperature: 0.7,
      ...config
    };

    // 🚨 SECURITY WARNING: API key exposed in browser!
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Required for frontend usage
    });
    
    // Load or initialize usage tracking for cost protection
    this.usageTracker = this.loadUsageTracker();
    
    console.warn('🚨 OpenAI Frontend Service Active - API key exposed in browser!');
    console.warn('🔧 TODO: Migrate to backend Tauri service for production');
  }

  async analyzeImageWithText(request: AIRequest): Promise<AIResponse> {
    // Cost protection check
    if (this.usageTracker.requestCount >= this.usageTracker.dailyLimit) {
      throw new Error(`Daily limit of ${this.usageTracker.dailyLimit} requests reached. Limit resets tomorrow.`);
    }

    // Image size check (OpenAI 20MB limit)
    if (request.imageData) {
      const imageSizeKB = (request.imageData.length * 0.75) / 1024;
      if (imageSizeKB > 15000) { // 15MB safety margin
        throw new Error(`Image too large (${Math.round(imageSizeKB)}KB). Max 15MB. Try selecting a smaller area.`);
      }
    }

    try {
      // 🧠 Smart prompt optimization based on question type and context
      const ocrMatch = request.message.match(/\[OCR Context - Text found in image: "(.+?)" \(Confidence: (\d+)%\)\]/);
      const ocrText = ocrMatch ? ocrMatch[1] : undefined;
      const ocrConfidence = ocrMatch ? parseInt(ocrMatch[2]) / 100 : undefined;
      const cleanMessage = request.message.replace(/\[OCR Context[^\]]*\]/, '').trim();
      
      const promptContext: PromptContext = {
        message: cleanMessage,
        hasImage: !!request.imageData,
        hasOCR: !!ocrText,
        ocrText,
        ocrConfidence: ocrConfidence || 0.7, // Use real OCR confidence or default
        imageSize: request.imageData ? request.imageData.length : undefined
      };

      const optimizedPrompt = PromptOptimizer.optimizePrompt(promptContext);
      
      console.log(`🧠 Smart prompt optimization: ${optimizedPrompt.reasoning}`);
      console.log(`📊 Optimized: ${optimizedPrompt.maxTokens} tokens, temp ${optimizedPrompt.temperature}`);

      // 🖼️ Smart image optimization based on detected question type
      let finalImageData = request.imageData;
      if (request.imageData) {
        const questionTypeMatch = optimizedPrompt.reasoning.match(/Detected: (\w+)/);
        const questionType = questionTypeMatch ? questionTypeMatch[1] : 'general';
        
        try {
          const optimizedImage = await ImageOptimizer.optimizeForQuestionType(request.imageData, questionType);
          finalImageData = optimizedImage.dataUrl;
          
          console.log(`🖼️ Image optimized: ${Math.round(optimizedImage.optimization.originalSize)}KB → ${Math.round(optimizedImage.optimization.compressedSize)}KB (${Math.round(optimizedImage.optimization.compressionRatio * 100)}% compression)`);
        } catch (error) {
          console.warn('⚠️ Image optimization failed, using original:', error);
          // Continue with original image if optimization fails
        }
      }

      const messages: any[] = [
        {
          role: "user",
          content: finalImageData ? [
            { 
              type: "text", 
              text: optimizedPrompt.prompt
            },
            { 
              type: "image_url", 
              image_url: { url: finalImageData }
            }
          ] : [
            {
              type: "text",
              text: optimizedPrompt.prompt
            }
          ]
        }
      ];

      const response = await this.client.chat.completions.create({
        model: this.config.model!,
        messages,
        max_tokens: optimizedPrompt.maxTokens,
        temperature: optimizedPrompt.temperature,
        stream: false // Set to true for streaming in future
      });

      // Update usage tracking
      this.usageTracker.requestCount++;
      this.saveUsageTracker();

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log(`✅ OpenAI request successful (${this.usageTracker.requestCount}/${this.usageTracker.dailyLimit} today)`);
      
      return {
        content,
        tokensUsed: response.usage?.total_tokens,
        model: this.config.model!,
        timestamp: Date.now()
      };

    } catch (error: any) {
      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key.");
      } else if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.status === 413) {
        throw new Error("Image too large. Please select a smaller area.");
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  getRemainingRequests(): number {
    return this.usageTracker.dailyLimit - this.usageTracker.requestCount;
  }

  getUsageStats() {
    return {
      requestCount: this.usageTracker.requestCount,
      dailyLimit: this.usageTracker.dailyLimit,
      remaining: this.getRemainingRequests(),
      lastReset: this.usageTracker.lastReset
    };
  }

  private loadUsageTracker(): UsageTracker {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('openai_usage_frontend');
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lastReset === today) {
        return parsed;
      }
    }
    
    // Reset daily counter
    return {
      requestCount: 0,
      dailyLimit: 50, // Conservative limit for frontend testing
      lastReset: today
    };
  }

  private saveUsageTracker(): void {
    localStorage.setItem('openai_usage_frontend', JSON.stringify(this.usageTracker));
  }
}

// 🔧 FACTORY FUNCTION - This is what the app will use
// When migrating to backend, only change this function!
export function createAIService(apiKey: string): IAIService {
  // 🚨 TEMPORARY: Frontend implementation
  return new OpenAIServiceFrontend({ apiKey });
  
  // 🔮 FUTURE: Backend implementation
  // return new OpenAIServiceBackend({ apiKey });
} 