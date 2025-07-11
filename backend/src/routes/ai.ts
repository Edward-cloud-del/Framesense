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

    // Use optimized AI processor with fallback strategies
    const request = {
      message,
      imageData,
      start_time: startTime
    };

    const openaiClient = getOpenAIClient();
    const response = await AIProcessor.processWithFallback(request, openaiClient);

    console.log('✅ Optimized AI processing completed');
    res.json(response);

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