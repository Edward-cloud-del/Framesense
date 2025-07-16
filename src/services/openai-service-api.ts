import type { IAIService, AIRequest, AIResponse } from '../types/ai-types';

export class OpenAIServiceAPI implements IAIService {
  private apiUrl: string;

  constructor(config: { apiUrl?: string } = {}) {
    this.apiUrl = config.apiUrl || this.getAPIUrl();
    console.log('🔧 OpenAI API Service - Calling backend at:', this.apiUrl);
  }

  private getAPIUrl(): string {
    // Use environment variable or default to production
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Development fallback
    if (import.meta.env.DEV) {
      return 'http://localhost:8080';
    }
    
    // Production - Railway backend
    return 'https://framesense-production.up.railway.app';
  }

  async analyzeImageWithText(request: AIRequest): Promise<AIResponse> {
    try {
      console.log('📡 Sending request to backend API...');
      
      const response = await fetch(`${this.apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          imageData: request.imageData
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Backend API request successful');
      
      // Convert backend response to frontend format
      return {
        content: result.message,
        tokensUsed: undefined, // Backend doesn't return this yet
        model: 'gpt-4o-mini',
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('❌ Backend API error:', error);
      throw new Error(`Backend API error: ${error.message}`);
    }
  }

  getRemainingRequests(): number {
    // TODO: Get from backend API
    return 50;
  }

  getUsageStats() {
    // TODO: Get from backend API
    return {
      requestCount: 0,
      dailyLimit: 100,
      remaining: 50,
      lastReset: new Date().toDateString()
    };
  }
} 