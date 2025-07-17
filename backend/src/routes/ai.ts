import { Request, Response } from 'express';
import OpenAI from 'openai';
import { AIProcessor } from '../services/ai-processor.js';

// Lazy-load OpenAI client to avoid startup errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test-dummy')) {
      throw new Error('OpenAI API key not configured for production use');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

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

export const analyzeImageRoute = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { message } = req.body;
    let imageData: string | undefined;

    // Handle image from either base64 string or uploaded file
    if (req.file) {
      // Convert uploaded file to base64
      const buffer = req.file.buffer;
      const base64 = buffer.toString('base64');
      imageData = `data:${req.file.mimetype};base64,${base64}`;
    } else if (req.body.imageData) {
      // Use provided base64 image data
      imageData = req.body.imageData;
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('🚀 Processing optimized AI request:', { 
      hasImage: !!imageData, 
      messageLength: message.length 
    });

    // Extract user information from request (now available via authentication middleware)
    const user = (req as any).user;
    const userContext = {
      userId: user?.id,
      userTier: user?.tier || 'free',
      usage: { daily: user?.usage_daily || 0, monthly: user?.usage_total || 0 }
    };

    console.log(`🔍 === ENHANCED AI PROCESSOR VIA LEGACY ROUTE ===`);
    console.log(`User ID: ${userContext.userId}`);
    console.log(`User Tier: ${userContext.userTier}`);
    console.log(`User Usage: Daily=${userContext.usage.daily}, Monthly=${userContext.usage.monthly}`);
    console.log(`📍 ROUTE: /api/analyze (legacy) → Enhanced AI Processor`);
    console.log(`🎯 PURPOSE: Enable Google Vision for pro users via legacy endpoint`);
    console.log(`================================================`);

    // Import Enhanced AI Processor for Google Vision support
    const { default: enhancedAIProcessor } = await import('../services/pipeline/enhanced-ai-processor.js');

    // Use Enhanced AI Processor instead of legacy processor
    const options = {
      modelPreference: null, // Let system choose best model
      forceModel: false,
      cacheStrategy: 'default'
    };

    // Enhanced AI Processor expects string | Buffer, use empty base64 for text-only requests
    const defaultImageData = 'data:image/png;base64,'; // Empty but valid base64 format
    const response = await enhancedAIProcessor.processAnalysisRequest(
      imageData || defaultImageData, // Pass valid empty base64 for text-only requests
      message,
      userContext.userId,
      options
    ) as any; // Type assertion to handle Enhanced AI Processor response

    console.log('✅ Enhanced AI processing completed via legacy route');
    console.log('🔍 === ENHANCED AI PROCESSOR RESPONSE DEBUG ===');
    console.log('Response structure:', JSON.stringify(response, null, 2));
    console.log('Response.result type:', typeof response?.result);
    console.log('Response.result keys:', response?.result ? Object.keys(response.result) : 'no result');
    console.log('==============================================');
    
    // Convert Enhanced AI Processor response to legacy format for frontend compatibility
    // Enhanced AI Processor returns different formats depending on service:
    // - Google Vision: response.result.summary (text description of objects/scene)
    // - OpenAI: response.result.content (direct text response)
    // - OCR: response.result.fullText (extracted text)
    const extractMessageFromResponse = (response: any) => {
      if (!response?.result) {
        return response?.content || 'No response generated';
      }
      
      // Google Vision services return summary text (check both standardized and original format)
      if (response.result.summary) {
        return response.result.summary;
      }
      
      // Check standardized format from response optimizer
      if (response.result.data?.summary) {
        return response.result.data.summary;
      }
      
      // OCR services return fullText
      if (response.result.fullText) {
        return `Text found in image: "${response.result.fullText}"`;
      }
      
      // OpenAI and other text services return content
      if (response.result.content) {
        return response.result.content;
      }
      
      // Fallback to any text-like field
      if (typeof response.result === 'string') {
        return response.result;
      }
      
      return 'Analysis completed, but no text response was generated.';
    };

    const legacyResponse = {
      message: extractMessageFromResponse(response),
      success: response?.success !== false,
      processing_info: {
        question_type: response?.questionType || 'unknown',
        optimization_strategy: response?.metadata?.service || 'enhanced',
        ocr_used: false, // Will be set by Enhanced AI Processor if OCR was used
        image_optimized: !!response?.metadata?.optimized,
        processing_time: {
          ocr: 0,
          total: response?.metadata?.responseTime || (Date.now() - startTime)
        }
      },
      usage: {
        requestCount: 1,
        remainingRequests: 999,
        timestamp: new Date().toISOString()
      },
      // Enhanced metadata (backwards compatible addition)
      enhanced_metadata: response?.metadata || {}
    };
    
    console.log('📤 Legacy response formatted:', {
      messageLength: legacyResponse.message.length,
      service: response?.metadata?.service || 'unknown',
      tier: response?.metadata?.user?.tier || 'unknown',
      cached: response?.metadata?.cached || false
    });
    
    res.json(legacyResponse);

  } catch (error: any) {
    console.error('❌ AI processing error:', error);

    let errorMessage = 'Failed to process AI request';
    let statusCode = 500;

    if (error?.code === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded';
      statusCode = 429;
    } else if (error?.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key';
      statusCode = 401;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      processing_info: {
        question_type: 'unknown',
        optimization_strategy: 'failed',
        ocr_used: false,
        image_optimized: false,
        processing_time: {
          ocr: 0,
          total: Date.now() - startTime
        }
      }
    });
  }
}; 