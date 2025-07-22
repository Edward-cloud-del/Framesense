import type { IAIService, AIRequest, AIResponse } from '../../../src/types/ai-types';

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
    
    // Always use Railway in production - based on RAILWAY-SETUP.md
    // Development can also use Railway to avoid localhost issues
    return 'https://api.finalyze.pro';
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
    try {
      console.log('📡 Sending request to backend API...');
      
      // Get authentication token from localStorage
      const token = this.getAuthToken();
      console.log('🔍 Auth token retrieved:', token ? `${token.substring(0, 20)}...` : 'none');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header added to request');
      } else {
        console.warn('⚠️ No authentication token found - request may fail');
      }
      
      const response = await fetch(`${this.apiUrl}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: request.message,
          imageData: request.imageData
        })
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