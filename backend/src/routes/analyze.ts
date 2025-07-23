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
    
    // Step 1: Try OCR first
    console.log('🔍 Step 1: Running OCR...');
    const ocrResult = await extractTextFromImage(imageBuffer);
    
    // Step 2: Prepare enhanced question for ChatGPT Vision
    let enhancedQuestion = userQuestion;
    
    // If OCR found good text, include it as context
    if (ocrResult.success && ocrResult.confidence > 0.5) {
      enhancedQuestion += `\n\nOCR detected text: "${ocrResult.text}" (${Math.round(ocrResult.confidence * 100)}% confidence)

Give a natural, conversational response identifying what you see. If it's a vehicle, tell me the brand, model, and approximate year. If you see people, brands, or logos, mention them naturally. Be confident and specific even if you're not 100% certain - give your best assessment in a friendly, flowing way without bullet points or formatting.`;
      console.log(`✅ OCR successful: "${ocrResult.text.substring(0, 50)}..." (${Math.round(ocrResult.confidence * 100)}%)`);
    } else {
      // OCR failed or low confidence - rely on ChatGPT Vision
      enhancedQuestion += `\n\nAnalyze this image and tell me what you see in a natural, conversational way. If it's a car, tell me the brand, model, and year. If you see logos, people, or other interesting details, mention them naturally. Be confident in your identifications even if you're not 100% sure - just give me your best assessment in a friendly, flowing response without bullet points or special formatting.`;
      console.log(`⚠️ OCR low confidence (${Math.round(ocrResult.confidence * 100)}%) - using enhanced ChatGPT Vision`);
    }
    
    // Step 3: Send to ChatGPT with image + enhanced context
    console.log('🤖 Step 2: Sending to ChatGPT Vision...');
    const imageBase64 = imageBuffer.toString('base64');
    
    const chatGPTResult = await analyzeWithChatGPT({
      text: enhancedQuestion,
      ocrText: ocrResult.success ? ocrResult.text : undefined,
      imageBase64: imageBase64
    });
    
    // Return simple response
    const response = {
      success: true,
      text: ocrResult.text || 'No text detected by OCR',
      textConfidence: ocrResult.confidence,
      answer: chatGPTResult.answer,
      tokensUsed: chatGPTResult.tokensUsed,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Analysis complete:', {
      ocrText: ocrResult.success ? `"${ocrResult.text.substring(0, 30)}..."` : 'None',
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