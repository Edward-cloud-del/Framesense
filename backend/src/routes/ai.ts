import { Request, Response } from 'express';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface AIRequest {
  message: string;
  imageData?: string;
}

export interface AIResponse {
  message: string;
  success: boolean;
  usage?: {
    requestCount: number;
    remainingRequests: number;
    timestamp: string;
  };
}

export const analyzeImageRoute = async (req: Request, res: Response) => {
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

    console.log('🤖 Processing AI request:', { 
      hasImage: !!imageData, 
      messageLength: message.length 
    });

    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: 'user',
        content: imageData ? [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: imageData } }
        ] : message
      }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model with vision capabilities
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'No response generated';

    console.log('✅ OpenAI API call successful');

    const response: AIResponse = {
      message: responseMessage,
      success: true,
      usage: {
        requestCount: 1,
        remainingRequests: 49, // You can implement proper rate limiting here
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ OpenAI API error:', error);

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
      message: errorMessage
    });
  }
}; 