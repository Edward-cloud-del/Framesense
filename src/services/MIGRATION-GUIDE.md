# 🔄 Frontend → Backend Migration Guide

## Current Architecture (Temporary)
```
React/TypeScript (Frontend)
    ↓
OpenAI JavaScript SDK
    ↓
OpenAI API (Direct HTTP calls)
```

**⚠️ Issues:**
- API key exposed in browser
- CORS limitations
- Security concerns
- Client-side rate limiting only

## Target Architecture (Production)
```
React/TypeScript (Frontend)
    ↓
Tauri Commands (IPC)
    ↓
Rust Backend
    ↓
OpenAI API (HTTP via reqwest)
```

**✅ Benefits:**
- API key secure on backend
- No CORS issues
- Better error handling
- Server-side rate limiting
- Encrypted storage

## Migration Steps

### 1. Add Backend Dependencies
```toml
# src-tauri/Cargo.toml
[dependencies]
reqwest = { version = "0.11", features = ["json"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
```

### 2. Create Rust Commands
```rust
// src-tauri/src/main.rs

#[tauri::command]
async fn openai_analyze_image(
    message: String,
    image_data: Option<String>,
    api_key: String
) -> Result<String, String> {
    // HTTP call to OpenAI API
    // Return JSON response
}

#[tauri::command]
async fn store_api_key_secure(key: String) -> Result<(), String> {
    // Store in encrypted form
}

#[tauri::command]
async fn get_api_key_secure() -> Result<Option<String>, String> {
    // Retrieve and decrypt
}
```

### 3. Update Frontend Service
```typescript
// src/services/openai-service.ts

// CHANGE THIS LINE:
export function createAIService(apiKey: string): IAIService {
  // FROM:
  return new OpenAIServiceFrontend({ apiKey });
  
  // TO:
  return new OpenAIServiceBackend({ apiKey });
}
```

### 4. Update App Integration
```typescript
// src/App.tsx

// REMOVE: import { getApiKey } from '../config/api-config';
// ADD: Use Tauri secure storage

const initializeAI = async () => {
  const apiKey = await invoke('get_api_key_secure');
  if (apiKey) {
    setAiService(createAIService(apiKey));
  }
};
```

### 5. Clean Up Frontend Files
- Delete: `src/config/api-config.ts`
- Delete: `OpenAIServiceFrontend` class
- Delete: OpenAI npm dependency (`pnpm remove openai`)

## Migration Checklist

- [ ] Add Rust dependencies
- [ ] Implement `openai_analyze_image` command
- [ ] Implement secure API key storage
- [ ] Update `createAIService()` function
- [ ] Test backend integration
- [ ] Remove frontend OpenAI code
- [ ] Remove API key config file
- [ ] Update .gitignore
- [ ] Test security (API key not in browser)

## Security Improvements After Migration

1. **API Key Protection**: Never exposed to browser
2. **Request Validation**: Backend validates all requests
3. **Rate Limiting**: Server-side enforcement
4. **Error Sanitization**: No sensitive errors to frontend
5. **Audit Logging**: Track API usage server-side

## Performance Benefits

1. **Smaller Bundle**: No OpenAI SDK on frontend
2. **Better Caching**: Backend can cache responses
3. **Connection Pooling**: Reuse HTTP connections
4. **Parallel Processing**: Backend can handle multiple requests

---

**🎯 When ready to migrate, follow these steps in order for a smooth transition!** 