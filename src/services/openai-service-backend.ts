// 🔮 FUTURE BACKEND IMPLEMENTATION
// =====================================
// 🎯 This file shows how to migrate from frontend to backend
// 🔧 When ready: Move OpenAI logic to Rust/Tauri commands
// 🔄 Then implement this service to call Tauri instead of OpenAI directly
// =====================================

import { invoke } from '@tauri-apps/api/core';
import type { IAIService, AIRequest, AIResponse } from '../types/ai-types';

export class OpenAIServiceBackend implements IAIService {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    console.log('🔧 OpenAI Backend Service - API calls via Tauri/Rust');
  }

  async analyzeImageWithText(request: AIRequest): Promise<AIResponse> {
    // 🔮 FUTURE: Call Rust backend instead of OpenAI directly
    try {
      const response = await invoke('openai_analyze_image', {
        message: request.message,
        imageData: request.imageData,
        apiKey: this.apiKey // Or get from secure storage
      }) as AIResponse;

      return response;
    } catch (error) {
      throw new Error(`Backend AI service error: ${error}`);
    }
  }

  getRemainingRequests(): number {
    // 🔮 FUTURE: Get from Rust backend
    return 50; // Placeholder
  }

  getUsageStats() {
    // 🔮 FUTURE: Get from Rust backend
    return {
      requestCount: 0,
      dailyLimit: 100,
      remaining: 50,
      lastReset: new Date().toDateString()
    };
  }
}

// 🔮 FUTURE MIGRATION STEPS:
// 1. Add these Tauri commands to src-tauri/src/main.rs:
//    - openai_analyze_image
//    - get_openai_usage_stats
//    - store_api_key_secure
//    - get_api_key_secure
//
// 2. Add reqwest dependency to Cargo.toml:
//    reqwest = { version = "0.11", features = ["json"] }
//
// 3. Update createAIService() in openai-service.ts:
//    return new OpenAIServiceBackend({ apiKey });
//
// 4. Delete OpenAIServiceFrontend class
//
// 5. API key will be stored securely in Tauri backend 