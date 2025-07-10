// 🤖 AI PROCESSOR - Intelligent Processing Pipeline
// =================================================

import { PromptOptimizer } from './prompt-optimizer.js';
import { ImageOptimizer } from './image-optimizer.js';
import { OCRService } from './ocr-service.js';

class AIProcessor {
  
  // Main processing method that combines all optimizations
  static async processRequest(request, openaiClient) {
    const { message, imageData } = request;
    
    console.log('🚀 Starting intelligent AI processing pipeline...');
    
    // Step 1: Detect question type for optimization strategy
    const questionType = PromptOptimizer.detectQuestionType(message);
    console.log(`🎯 Detected question type: ${questionType}`);
    
    let processedImageData = null;
    let ocrResult = null;
    let imageBuffer = null;
    
    // Step 2: Process image if provided
    if (imageData) {
      console.log('🖼️ Processing image...');
      
      // Convert base64 to buffer
      imageBuffer = ImageOptimizer.dataUrlToBuffer(imageData);
      
      // Step 3: Run OCR intelligently based on question type
      const shouldRunOCR = this.shouldRunOCR(questionType, message);
      if (shouldRunOCR) {
        console.log('🔍 Running OCR analysis...');
        ocrResult = await OCRService.extractTextIntelligent(imageBuffer, { 
          questionType,
          forceOCR: questionType === 'text_extraction'
        });
      }
      
      // Step 4: Optimize image based on question type
      console.log('🎨 Optimizing image for AI analysis...');
      const optimizedImage = await ImageOptimizer.optimizeForQuestionType(imageBuffer, questionType);
      
      // Convert back to data URL for OpenAI
      processedImageData = ImageOptimizer.bufferToDataUrl(optimizedImage.buffer);
      
      console.log(`✅ Image optimization: ${Math.round(optimizedImage.optimization.compressionRatio * 100)}% compression`);
    }
    
    // Step 5: Build optimized prompt context
    const promptContext = {
      message,
      hasImage: !!imageData,
      hasOCR: !!(ocrResult && ocrResult.has_text),
      ocrText: ocrResult?.text,
      ocrConfidence: ocrResult?.confidence,
      imageSize: imageBuffer ? ImageOptimizer.getImageSizeKB(imageBuffer) : 0
    };
    
    // Step 6: Generate optimized prompt
    const optimizedPrompt = PromptOptimizer.optimizePrompt(promptContext);
    console.log(`🧠 Prompt optimization: ${optimizedPrompt.reasoning}`);
    
    // Step 7: Prepare OpenAI request
    const messages = this.buildOpenAIMessages(optimizedPrompt.prompt, processedImageData);
    
    // Step 8: Call OpenAI with optimized parameters
    console.log('📡 Calling OpenAI API with optimizations...');
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: optimizedPrompt.maxTokens,
      temperature: optimizedPrompt.temperature,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
    
    // Step 9: Build comprehensive response
    const response = {
      message: aiResponse,
      success: true,
      processing_info: {
        question_type: questionType,
        optimization_strategy: optimizedPrompt.reasoning,
        ocr_used: !!(ocrResult && ocrResult.has_text),
        image_optimized: !!imageData,
        processing_time: {
          ocr: ocrResult?.processing_time || 0,
          total: Date.now() - (request.start_time || Date.now())
        }
      },
      usage: {
        requestCount: 1,
        remainingRequests: 49,
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
  static async processWithFallback(request, openaiClient) {
    const strategies = [
      'intelligent', // Full pipeline
      'simple',      // Skip OCR
      'minimal'      // Basic processing
    ];
    
    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying strategy: ${strategy}`);
        
        if (strategy === 'intelligent') {
          return await this.processRequest(request, openaiClient);
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