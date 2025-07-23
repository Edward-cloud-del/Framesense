// 🚨 SECURE API CONFIGURATION 🚨
// =====================================
// ✅ SECURITY: Uses environment variables for API keys
// ✅ PRODUCTION: No hardcoded secrets in code
// =====================================

// 🔐 SECURE: Get API key from environment
export function getApiKey(): string {
  // Get from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    throw new Error('❌ Please set VITE_OPENAI_API_KEY environment variable');
  }
  
  return apiKey;
}

// 🔮 AI Configuration
export const AI_CONFIG = {
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.2,
  dailyLimit: 50,
};

// 🔧 SETUP INSTRUCTIONS:
// 1. Create .env file in project root
// 2. Add: VITE_OPENAI_API_KEY=your-actual-api-key-here
// 3. Never commit .env files to git 