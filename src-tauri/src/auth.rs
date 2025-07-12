use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use reqwest;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use chrono;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    pub tier: String, // "free", "premium", "pro", "enterprise"
    pub token: String,
    pub usage: UserUsage,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserUsage {
    pub daily: i32,
    pub total: i32,
    pub last_reset: String,
}

// Add the missing Usage struct that main.rs references
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Usage {
    pub daily: i32,
    pub total: i32,
    pub last_reset: String,
}

impl Default for UserUsage {
    fn default() -> Self {
        Self {
            daily: 0,
            total: 0,
            last_reset: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub user: Option<User>,
    pub token: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: String,
    pub email: String,
    pub exp: usize,
}

#[derive(Clone)]
pub struct AuthService {
    api_url: String,
    storage_path: Option<PathBuf>,
}

impl AuthService {
    pub fn new() -> Self {
        Self {
            api_url: "http://localhost:3001".to_string(),
            storage_path: None,
        }
    }

    pub fn with_storage_path(mut self, path: PathBuf) -> Self {
        self.storage_path = Some(path);
        self
    }

    pub async fn login_user(&self, email: String, password: String) -> Result<User, String> {
        let client = reqwest::Client::new();
        
        let login_data = LoginRequest { email, password };
        
        let response = client
            .post(&format!("{}/api/auth/login", self.api_url))
            .json(&login_data)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;
        
        if response.status().is_success() {
            let auth_response: AuthResponse = response.json().await
                .map_err(|e| format!("Parse error: {}", e))?;
            
            if auth_response.success {
                if let (Some(mut user), Some(token)) = (auth_response.user, auth_response.token) {
                    user.token = token;
                    
                    // Save user session locally
                    self.save_user_session(&user).await?;
                    
                    println!("✅ User logged in successfully: {} ({})", user.email, user.tier);
                    Ok(user)
                } else {
                    Err("Invalid response format".to_string())
                }
            } else {
                Err(auth_response.message.unwrap_or("Login failed".to_string()))
            }
        } else {
            Err("Authentication failed".to_string())
        }
    }

    pub async fn handle_payment_success(&self, token: String, plan: String) -> Result<User, String> {
        // Real payment verification with backend - no more test mode
        let client = reqwest::Client::new();
        
        let response = client
            .get(&format!("{}/api/auth/verify", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Verification error: {}", e))?;
        
        if response.status().is_success() {
            let auth_response: AuthResponse = response.json().await
                .map_err(|e| format!("Parse error: {}", e))?;
            
            if auth_response.success {
                if let Some(mut user) = auth_response.user {
                    user.token = token;
                    
                    // Clear any old session before saving new one
                    self.clear_user_session().await?;
                    
                    // Save user session locally
                    self.save_user_session(&user).await?;
                    
                    println!("🎉 User automatically logged in after payment: {} ({}) - Plan: {}", 
                             user.email, user.tier, plan);
                    
                    Ok(user)
                } else {
                    Err("Invalid response format".to_string())
                }
            } else {
                Err("Token verification failed".to_string())
            }
        } else {
            Err("Authentication failed".to_string())
        }
    }

    // Manual payment verification - loads fresh user data from backend
    pub async fn verify_payment_and_update(&self) -> Result<Option<User>, String> {
        // First check if we have a current session
        if let Some(current_user) = self.load_user_session().await? {
            // Verify current token with backend to get latest user data
            let updated_user = self.verify_token(current_user.token).await?;
            
            // If tier changed, save updated session
            if updated_user.tier != current_user.tier {
                println!("🔄 User tier updated from {} to {}", current_user.tier, updated_user.tier);
                self.save_user_session(&updated_user).await?;
            }
            
            Ok(Some(updated_user))
        } else {
            // No current session
            Ok(None)
        }
    }

    pub async fn verify_token(&self, token: String) -> Result<User, String> {
        let client = reqwest::Client::new();
        
        let response = client
            .get(&format!("{}/api/auth/verify", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Verification error: {}", e))?;
        
        if response.status().is_success() {
            let auth_response: AuthResponse = response.json().await
                .map_err(|e| format!("Parse error: {}", e))?;
            
            if auth_response.success {
                if let Some(mut user) = auth_response.user {
                    user.token = token;
                    Ok(user)
                } else {
                    Err("Invalid response format".to_string())
                }
            } else {
                Err("Token verification failed".to_string())
            }
        } else {
            Err("Authentication failed".to_string())
        }
    }

    pub async fn logout_user(&self) -> Result<(), String> {
        self.clear_user_session().await
    }

    pub async fn get_current_user(&self) -> Result<Option<User>, String> {
        self.load_user_session().await
    }

    pub fn get_available_models(&self, user_tier: &str) -> Vec<&'static str> {
        match user_tier {
            "free" => vec!["GPT-3.5-turbo", "Gemini Flash"],
            "premium" => vec![
                "GPT-3.5-turbo", "Gemini Flash",
                "GPT-4o-mini", "Claude 3 Haiku", "Gemini Pro"
            ],
            "pro" => vec![
                "GPT-3.5-turbo", "Gemini Flash",
                "GPT-4o-mini", "Claude 3 Haiku", "Gemini Pro",
                "GPT-4o", "Claude 3.5 Sonnet", "Llama 3.1 70B"
            ],
            "enterprise" => vec![
                "GPT-3.5-turbo", "Gemini Flash",
                "GPT-4o-mini", "Claude 3 Haiku", "Gemini Pro",
                "GPT-4o", "Claude 3.5 Sonnet", "Llama 3.1 70B",
                "GPT-4o 32k", "Claude 3 Opus", "Llama 3.1 405B"
            ],
            _ => vec!["GPT-3.5-turbo"] // Fallback
        }
    }
    
    pub fn can_use_model(&self, user_tier: &str, model: &str) -> bool {
        self.get_available_models(user_tier).contains(&model)
    }
    
    pub fn get_daily_limit(&self, user_tier: &str) -> i32 {
        match user_tier {
            "free" => 50,
            "premium" => 1000,
            "pro" => 5000,
            "enterprise" => -1, // Unlimited
            _ => 10 // Very limited fallback
        }
    }

    pub fn get_required_tier(&self, model: &str) -> &'static str {
        if ["GPT-4o 32k", "Claude 3 Opus", "Llama 3.1 405B"].contains(&model) {
            "enterprise"
        } else if ["GPT-4o", "Claude 3.5 Sonnet", "Llama 3.1 70B"].contains(&model) {
            "pro"
        } else if ["GPT-4o-mini", "Claude 3 Haiku", "Gemini Pro"].contains(&model) {
            "premium"
        } else {
            "free"
        }
    }

    // Local storage functions
    pub async fn save_user_session(&self, user: &User) -> Result<(), String> {
        if let Some(storage_path) = &self.storage_path {
            let user_file = storage_path.join("user_session.json");
            
            // Ensure directory exists
            if let Some(parent) = user_file.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent)
                        .map_err(|e| format!("Failed to create storage directory: {}", e))?;
                }
            }
            
            let user_json = serde_json::to_string_pretty(user)
                .map_err(|e| format!("Failed to serialize user: {}", e))?;
            
            fs::write(&user_file, user_json)
                .map_err(|e| format!("Failed to write user session: {}", e))?;
            
            println!("💾 User session saved locally");
        }
        Ok(())
    }

    pub async fn clear_user_session(&self) -> Result<(), String> {
        if let Some(storage_path) = &self.storage_path {
            let user_file = storage_path.join("user_session.json");
            if user_file.exists() {
                fs::remove_file(&user_file)
                    .map_err(|e| format!("Failed to remove user session: {}", e))?;
                println!("🗑️ User session cleared");
            }
        }
        Ok(())
    }

    pub async fn load_user_session(&self) -> Result<Option<User>, String> {
        if let Some(storage_path) = &self.storage_path {
            let user_file = storage_path.join("user_session.json");
            if user_file.exists() {
                let user_json = fs::read_to_string(&user_file)
                    .map_err(|e| format!("Failed to read user session: {}", e))?;
                
                let user: User = serde_json::from_str(&user_json)
                    .map_err(|e| format!("Failed to parse user session: {}", e))?;
                
                // TODO: Optionally verify token is still valid here
                println!("📖 User session loaded: {} ({})", user.email, user.tier);
                return Ok(Some(user));
            }
        }
        Ok(None)
    }
}

impl Default for AuthService {
    fn default() -> Self {
        Self::new()
    }
} 