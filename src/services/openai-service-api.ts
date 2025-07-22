import type { IAIService, AIRequest, AIResponse } from '../types/ai-types';

export class OpenAIServiceAPI implements IAIService {
  private apiUrl: string;

  constructor(config: { apiUrl?: string } = {}) {
    this.apiUrl = config.apiUrl || this.getAPIUrl();
    console.log('🔧 OpenAI API Service - Calling backend at:', this.apiUrl);
  }

  private getAPIUrl(): string {
    // Try different possible API URLs
    const possibleUrls = [
      'http://localhost:8080/api/analyze',   // Simple backend
      'https://api.finalyze.pro/api/analyze', // Railway
      'http://localhost:3001/api/analyze'    // Local backend
    ];
    
    // For now, return the first one (simple backend)
    return possibleUrls[0];
  }

  private getAuthToken(): string | null {
    try {
      // Try multiple possible storage keys for backward compatibility
      const sessionKeys = [
        'framesense_user_session',  // auth-service-db.ts format
        'framesense_token',         // user-service.ts format
        'framesense_user'           // fallback format
      ];
      
      for (const key of sessionKeys) {
        console.log(`🔍 Checking localStorage key: ${key}`);
        const storedData = localStorage.getItem(key);
        
        if (storedData) {
          try {
            // Try to parse as JSON first (user session object)
            const parsed = JSON.parse(storedData);
            if (parsed.token) {
              console.log(`✅ Found token in ${key} (JSON format)`);
              return parsed.token;
            }
          } catch {
            // If parsing fails, treat as direct token string
            console.log(`✅ Found token in ${key} (string format)`);
            return storedData;
          }
        }
      }
      
      console.warn('❌ No authentication token found in any storage key');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving auth token:', error);
      return null;
    }
  }

  async analyzeImageWithText(request: AIRequest): Promise<AIResponse> {
    console.log('🔄 Making backend API request...');
    
    try {
      // Get auth token (optional for simple backend)
      const authToken = this.getAuthToken();
      
      // Convert base64 image to blob for multipart upload
      const formData = new FormData();
      formData.append('question', request.message);
      
      if (request.imageData) {
        // Convert base64 data URL to blob
        const base64Data = request.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'image/png' });
        formData.append('image', blob, 'screenshot.png');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
                 headers: authToken ? {
           'Authorization': `Bearer ${authToken}`
         } : {}
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        // Enhanced error handling for authentication issues
        if (response.status === 401) {
          console.error('❌ Authentication failed - token may be invalid or expired');
          console.log('🔍 Current localStorage state:');
          console.log('  framesense_user_session:', localStorage.getItem('framesense_user_session') ? 'exists' : 'missing');
          console.log('  framesense_token:', localStorage.getItem('framesense_token') ? 'exists' : 'missing');
          
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Backend API request successful');
      
      // Convert backend response to frontend format
      return {
        content: result.answer || result.message || 'No response',
        tokensUsed: result.tokensUsed,
        model: 'gpt-4o-mini',
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('❌ Backend API error:', error);
      throw new Error(`Backend API error: ${error.message}`);
    }
  }

  getRemainingRequests(): number {
    return 100; // Mock value for now
  }

  getUsageStats() {
    return {
      requestCount: 0,
      dailyLimit: 100,
      remaining: 100,
      lastReset: new Date().toDateString()
    };
  }
} 