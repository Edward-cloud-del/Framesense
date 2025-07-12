use deadpool_postgres::{Config, Pool, Runtime};
use tokio_postgres::NoTls;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    pub tier: String,
    pub subscription_status: String,
    pub stripe_customer_id: Option<String>,
    pub usage_daily: i32,
    pub usage_total: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
pub struct Database {
    pool: Pool,
}

impl Database {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mut cfg = Config::new();
        cfg.host = Some("localhost".to_string());
        cfg.port = Some(5432);
        cfg.dbname = Some("framesense".to_string());
        cfg.user = Some("postgres".to_string());
        cfg.password = Some("password".to_string());
        
        let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls)?;
        
        Ok(Database { pool })
    }
    
    pub async fn verify_user(&self, email: &str, password: &str) -> Result<Option<User>, Box<dyn std::error::Error + Send + Sync>> {
        let client = self.pool.get().await?;
        
        let row = client
            .query_opt(
                "SELECT id, email, name, password_hash, tier, subscription_status, 
                        stripe_customer_id, usage_daily, usage_total, 
                        created_at, updated_at 
                 FROM users WHERE email = $1",
                &[&email],
            )
            .await?;
        
        if let Some(row) = row {
            let password_hash: String = row.get("password_hash");
            
            // Verify password
            if bcrypt::verify(password, &password_hash).unwrap_or(false) {
                let user = User {
                    id: row.get("id"),
                    email: row.get("email"),
                    name: row.get("name"),
                    tier: row.get("tier"),
                    subscription_status: row.get("subscription_status"),
                    stripe_customer_id: row.get("stripe_customer_id"),
                    usage_daily: row.get("usage_daily"),
                    usage_total: row.get("usage_total"),
                    created_at: row.get::<_, String>("created_at"),
                    updated_at: row.get::<_, String>("updated_at"),
                };
                
                return Ok(Some(user));
            }
        }
        
        Ok(None)
    }
    
    pub async fn get_user_by_id(&self, user_id: &str) -> Result<Option<User>, Box<dyn std::error::Error + Send + Sync>> {
        let client = self.pool.get().await?;
        
        let row = client
            .query_opt(
                "SELECT id, email, name, tier, subscription_status, 
                        stripe_customer_id, usage_daily, usage_total, 
                        created_at, updated_at 
                 FROM users WHERE id = $1",
                &[&user_id],
            )
            .await?;
        
        if let Some(row) = row {
            let user = User {
                id: row.get("id"),
                email: row.get("email"),
                name: row.get("name"),
                tier: row.get("tier"),
                subscription_status: row.get("subscription_status"),
                stripe_customer_id: row.get("stripe_customer_id"),
                usage_daily: row.get("usage_daily"),
                usage_total: row.get("usage_total"),
                created_at: row.get::<_, String>("created_at"),
                updated_at: row.get::<_, String>("updated_at"),
            };
            
            return Ok(Some(user));
        }
        
        Ok(None)
    }
} 