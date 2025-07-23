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

You are an AI assistant that adapts your response style:

For identification (logos, people, car brands, products): Give concise answers (1-3 words). Examples: "BMW M3", "Elon Musk", "Nike Air Jordan"
For reasoning (analysis questions): Use step-by-step thinking to reach conclusions
For complex questions: Explain clearly and pedagogically 
For calculations: Show all calculation steps with clear final answer
For emails/texts: Write professionally in Swedish or English as needed

IMPORTANT: Write without extra formatting symbols (such as bold, italics, or markdown). Avoid unnecessary repetition and filler text. Never use special formatting unless specifically asked for. Present numbers and terms in the simplest possible way, always prioritizing clarity and user-friendliness over technical correctness in presentation.

Adapt your tone: short for identification, elaborate for reasoning, formal for professional text.`;
      console.log(`✅ OCR successful: "${ocrResult.text.substring(0, 50)}..." (${Math.round(ocrResult.confidence * 100)}%)`);
    } else {
      // OCR failed or low confidence - rely on ChatGPT Vision
      enhancedQuestion += `\n\nYou are an AI assistant that adapts your response style:

For identification (logos, people, car brands, products): Give concise answers (1-3 words). Examples: "Tesla Model Y", "Cristiano Ronaldo", "Adidas Ultraboost"
For reasoning (analysis questions): Use step-by-step chain-of-thought thinking
For complex questions: Explain clearly and pedagogically, adjusting complexity appropriately
For calculations: Show all calculation steps and end with clear final answer
For emails/texts: Write, improve, and proofread professionally.

IMPORTANT: Write without extra formatting symbols (such as bold, italics, or markdown). Avoid unnecessary repetition and filler text. Never use special formatting unless specifically asked for. Present numbers and terms in the simplest possible way, always prioritizing clarity and user-friendliness over technical correctness in presentation.

Adapt your tone: short and direct for identification, more elaborate for reasoning, formal and structured for professional content.`;
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