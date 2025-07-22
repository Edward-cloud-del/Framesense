// 🤖 AI PROCESSOR - Intelligent Processing Pipeline
// =================================================

import { PromptOptimizer } from './prompt-optimizer.js';
import { ImageOptimizer } from './image-optimizer.js';
import { OCRService } from './ocr-service.js';
import { ModelSelector } from './model-selector.js';
import { SubscriptionService } from './subscription-service.js';

class AIProcessor {
  
  // Main processing method that combines all optimizations
  static async processRequest(request, openaiClient, userContext = {}) {
    const { message, imageData } = request;
    const { userId, customerId, userTier = 'free', usage = { hourly: 0, daily: 0 } } = userContext;
    
    console.log('🚀 Starting intelligent AI processing pipeline...');
    console.log(`👤 User context: tier=${userTier}, usage=${usage.daily}/${ModelSelector.getModelConfig(userTier, 'general').rateLimits.requestsPerDay}`);
    
    // Step 1: Check rate limits
    const rateLimitCheck = ModelSelector.checkRateLimit(userTier, usage);
    if (!rateLimitCheck.canMakeRequest) {
      throw new Error(`Rate limit exceeded. Remaining: ${rateLimitCheck.remainingDaily} requests today, ${rateLimitCheck.remainingHourly} this hour.`);
    }
    
    // Step 2: Detect question type for optimization strategy
    const questionType = PromptOptimizer.detectQuestionType(message);
    console.log(`🎯 Detected question type: ${questionType}`);
    
    // Step 3: Get model configuration for user's tier
    const modelConfig = ModelSelector.getModelConfig(userTier, questionType);
    console.log(`🤖 Using model: ${modelConfig.model} (${userTier} tier)`);
    
    let processedImageData = null;
    let ocrResult = null;
    let imageBuffer = null;
    
    // Step 4: Process image if provided and user has access
    if (imageData) {
      // Check if user can access image analysis
      if (!ModelSelector.canAccessFeature(userTier, 'imageAnalysis') && questionType !== 'text_extraction') {
        throw new Error(`Image analysis requires ${userTier === 'free' ? 'Premium' : 'Pro'} subscription. Upgrade to analyze images.`);
      }
      
      console.log('🖼️ Processing image...');
      
      // Convert base64 to buffer
      imageBuffer = ImageOptimizer.dataUrlToBuffer(imageData);
      
      // Step 5: Run OCR intelligently based on question type and tier
      const shouldRunOCR = this.shouldRunOCR(questionType, message) && 
                           ModelSelector.canAccessFeature(userTier, 'ocrProcessing');
      if (shouldRunOCR) {
        console.log('🔍 Running OCR analysis...');
        ocrResult = await OCRService.extractTextIntelligent(imageBuffer, { 
          questionType,
          forceOCR: questionType === 'text_extraction'
        });
      }
      
      // Step 6: Optimize image based on question type and tier
      if (ModelSelector.canAccessFeature(userTier, 'imageOptimization')) {
        console.log('🎨 Optimizing image for AI analysis...');
        const optimizedImage = await ImageOptimizer.optimizeForQuestionType(imageBuffer, questionType);
        
        // Convert back to data URL for OpenAI
        processedImageData = ImageOptimizer.bufferToDataUrl(optimizedImage.buffer);
        
        console.log(`✅ Image optimization: ${Math.round(optimizedImage.optimization.compressionRatio * 100)}% compression`);
      } else {
        // Use original image without optimization for free tier
        processedImageData = imageData;
        console.log('⚡ Using original image (no optimization for free tier)');
      }
    }
    
    // Step 7: Build optimized prompt context
    const promptContext = {
      message,
      hasImage: !!imageData,
      hasOCR: !!(ocrResult && ocrResult.has_text),
      ocrText: ocrResult?.text,
      ocrConfidence: ocrResult?.confidence,
      imageSize: imageBuffer ? ImageOptimizer.getImageSizeKB(imageBuffer) : 0
    };
    
    // Step 8: Generate optimized prompt (respecting tier limits)
    const optimizedPrompt = PromptOptimizer.optimizePrompt(promptContext);
    
    // Override token limits based on user tier
    const maxTokens = Math.min(optimizedPrompt.maxTokens, modelConfig.maxTokens);
    const temperature = modelConfig.temperature;
    
    console.log(`🧠 Prompt optimization: ${optimizedPrompt.reasoning} (${maxTokens} tokens max)`);
    
    // Step 9: Prepare OpenAI request
    const messages = this.buildOpenAIMessages(optimizedPrompt.prompt, processedImageData);
    
    // Step 10: Call OpenAI with tier-appropriate model and parameters
    console.log(`📡 Calling OpenAI API: ${modelConfig.model} with ${maxTokens} tokens...`);
    const completion = await openaiClient.chat.completions.create({
      model: modelConfig.model,
      messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
    
    // Step 11: Build comprehensive response with subscription info
    const response = {
      message: aiResponse,
      success: true,
      processing_info: {
        question_type: questionType,
        model_used: modelConfig.model,
        user_tier: userTier,
        optimization_strategy: optimizedPrompt.reasoning,
        ocr_used: !!(ocrResult && ocrResult.has_text),
        image_optimized: !!imageData && ModelSelector.canAccessFeature(userTier, 'imageOptimization'),
        processing_time: {
          ocr: ocrResult?.processing_time || 0,
          total: Date.now() - (request.start_time || Date.now())
        },
        tokens_used: maxTokens,
        rate_limits: {
          remaining_hourly: rateLimitCheck.remainingHourly - 1,
          remaining_daily: rateLimitCheck.remainingDaily - 1,
          tier_limits: modelConfig.rateLimits
        }
      },
      usage: {
        requestCount: 1,
        remainingRequests: rateLimitCheck.remainingDaily - 1,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ AI processing pipeline completed successfully');
    return response;
  }
  
  // Determine if OCR should be run based on question type and content
  static shouldRunOCR(questionType, message) {
    const lowerMessage = message.toLowerCase();
    
    // Always run OCR for text extraction questions
    if (questionType === 'text_extraction') {
      return true;
    }
    
    // Run OCR if message explicitly asks about text
    const textKeywords = ['text', 'read', 'say', 'written', 'words', 'type'];
    if (textKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // Run OCR for code analysis (might contain text)
    if (questionType === 'code_analysis') {
      return true;
    }
    
    // Skip OCR for pure visual questions
    const visualKeywords = ['color', 'shape', 'design', 'layout', 'appearance'];
    if (visualKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return false;
    }
    
    // Default: run OCR for most questions (it's fast and often helpful)
    return true;
  }
  
  // Build OpenAI messages array
  static buildOpenAIMessages(optimizedPrompt, imageData) {
    const messages = [];
    
    if (imageData) {
      // Image + text message
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: optimizedPrompt },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      });
    } else {
      // Text-only message
      messages.push({
        role: 'user',
        content: optimizedPrompt
      });
    }
    
    return messages;
  }
  
  // Process multiple strategies and return best result
  static async processWithFallback(request, openaiClient, userContext = {}) {
    const strategies = [
      'intelligent', // Full pipeline
      'simple',      // Skip OCR
      'minimal'      // Basic processing
    ];
    
    console.log(`🔍 === AI PROCESSOR WITH FALLBACK ===`);
    console.log(`User Context:`, JSON.stringify(userContext, null, 2));
    console.log(`===================================`);
    
    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying strategy: ${strategy}`);
        
        if (strategy === 'intelligent') {
          return await this.processRequest(request, openaiClient, userContext);
        } else if (strategy === 'simple') {
          return await this.processSimple(request, openaiClient);
        } else {
          return await this.processMinimal(request, openaiClient);
        }
        
      } catch (error) {
        console.warn(`⚠️ Strategy ${strategy} failed:`, error.message);
        
        if (strategy === strategies[strategies.length - 1]) {
          throw error; // Re-throw if last strategy fails
        }
      }
    }
  }
  
  // Simple processing without OCR
  static async processSimple(request, openaiClient) {
    const { message, imageData } = request;
    
    console.log('⚡ Using simple processing pipeline...');
    
    let processedImageData = imageData;
    
    if (imageData) {
      // Still optimize image but skip OCR
      const imageBuffer = ImageOptimizer.dataUrlToBuffer(imageData);
      const optimizedImage = await ImageOptimizer.optimizeForAI(imageBuffer);
      processedImageData = ImageOptimizer.bufferToDataUrl(optimizedImage.buffer);
    }
    
    const messages = this.buildOpenAIMessages(message, processedImageData);
    
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.4,
    });
    
    return {
      message: completion.choices[0]?.message?.content || 'No response generated',
      success: true,
      processing_info: {
        strategy: 'simple',
        ocr_used: false,
        image_optimized: !!imageData
      }
    };
  }
  
  // Minimal processing for fallback
  static async processMinimal(request, openaiClient) {
    const { message, imageData } = request;
    
    console.log('🔧 Using minimal processing pipeline...');
    
    const messages = this.buildOpenAIMessages(message, imageData);
    
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.3,
    });
    
    return {
      message: completion.choices[0]?.message?.content || 'No response generated',
      success: true,
      processing_info: {
        strategy: 'minimal',
        ocr_used: false,
        image_optimized: false
      }
    };
  }
  
  // Health check for all services
  static async healthCheck() {
    const results = {
      prompt_optimizer: true, // Always available
      image_optimizer: false,
      ocr_service: false,
      overall: false
    };
    
    try {
      // Test image optimizer
      const testBuffer = Buffer.from('test');
      await ImageOptimizer.getImageInfo(testBuffer);
      results.image_optimizer = true;
    } catch (error) {
      console.warn('Image optimizer test failed:', error.message);
    }
    
    try {
      // Test OCR service
      const ocrStatus = await OCRService.testOCR();
      results.ocr_service = ocrStatus.available;
    } catch (error) {
      console.warn('OCR service test failed:', error.message);
    }
    
    results.overall = results.prompt_optimizer && results.image_optimizer;
    
    return results;
  }
}

export { AIProcessor }; 