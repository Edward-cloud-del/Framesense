import { Request, Response } from 'express';
import { extractTextFromImage } from '../services/ocr.js';
import { analyzeWithChatGPT } from '../services/chatgpt.js';

export async function analyzeImage(req: Request, res: Response) {
  try {
    console.log('📸 Image analysis request received');
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const imageBuffer = req.file.buffer;
    const userQuestion = req.body.question || 'What do you see in this image?';
    
    console.log(`📝 User question: "${userQuestion}"`);
    console.log(`🖼️ Image size: ${Math.round(imageBuffer.length / 1024)}KB`);
    
    // Step 1: Extract text using OCR
    console.log('🔍 Step 1: Running OCR...');
    const ocrResult = await extractTextFromImage(imageBuffer);
    
    // Step 2: Convert image to base64 for ChatGPT
    const imageBase64 = imageBuffer.toString('base64');
    
    // Step 3: Send to ChatGPT with OCR context
    console.log('🤖 Step 2: Sending to ChatGPT...');
    const chatGPTResult = await analyzeWithChatGPT({
      text: userQuestion,
      ocrText: ocrResult.success ? ocrResult.text : undefined,
      imageBase64: imageBase64
    });
    
    // Return comprehensive response
    const response = {
      success: true,
      text: ocrResult.text || 'No text detected',
      textConfidence: ocrResult.confidence,
      answer: chatGPTResult.answer,
      tokensUsed: chatGPTResult.tokensUsed,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Analysis complete:', {
      hasOcrText: !!ocrResult.text,
      ocrConfidence: Math.round(ocrResult.confidence * 100) + '%',
      chatGptSuccess: chatGPTResult.success,
      responseLength: chatGPTResult.answer.length,
      tokensUsed: chatGPTResult.tokensUsed || 0
    });
    
    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Analysis failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
} 