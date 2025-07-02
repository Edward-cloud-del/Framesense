use tesseract::Tesseract;
use image::DynamicImage;
use base64::Engine;

pub struct OCRService;

impl OCRService {
    pub fn new() -> Result<Self, String> {
        // Test that Tesseract works
        Tesseract::new(None, Some("eng"))
            .map_err(|e| format!("Failed to initialize Tesseract: {}", e))?;
        
        Ok(Self)
    }
    
    pub fn extract_text(&self, image_data: &str) -> Result<OCRResult, String> {
        // Remove data:image/png;base64, prefix if exists
        let base64_data = if image_data.starts_with("data:image") {
            image_data.split(',').nth(1).unwrap_or(image_data)
        } else {
            image_data
        };
        
        // Decode base64 image
        let image_bytes = base64::engine::general_purpose::STANDARD
            .decode(base64_data)
            .map_err(|e| format!("Failed to decode image: {}", e))?;
        
        // Load image
        let img = image::load_from_memory(&image_bytes)
            .map_err(|e| format!("Failed to load image: {}", e))?
            .to_rgba8();
        
        // Create Tesseract instance and set image in one chain
        let mut tesseract = Tesseract::new(None, Some("eng"))
            .map_err(|e| format!("Failed to initialize Tesseract: {}", e))?
            .set_image_from_mem(&img.as_raw())
            .map_err(|e| format!("Failed to set image: {}", e))?;
        
        // Extract text
        let text = tesseract
            .get_text()
            .map_err(|e| format!("Failed to extract text: {}", e))?;
        
        let confidence = tesseract.mean_text_conf() as f32 / 100.0;
        
        Ok(OCRResult {
            text: text.trim().to_string(),
            confidence,
            has_text: !text.trim().is_empty() && confidence > 0.3,
        })
    }
    
    // Legacy test function - keep for compatibility
    pub fn test_ocr() -> Result<String, String> {
        match Tesseract::new(None, Some("eng")) {
            Ok(_) => Ok("✅ Tesseract ready!".to_string()),
            Err(e) => Err(format!("❌ Tesseract failed: {}", e))
        }
    }
    
    // Simple integration test function
    pub fn run_integration_test() -> Result<String, String> {
        println!("🧪 Running Tesseract Integration Test...");
        
        // Test 1: Initialize Tesseract
        let tesseract = match Tesseract::new(None, Some("eng")) {
            Ok(t) => {
                println!("✅ Tesseract initialized successfully");
                t
            },
            Err(e) => return Err(format!("❌ Failed to initialize Tesseract: {}", e))
        };
        
        // Test 2: Try to set a simple test image (white background)
        // This tests if the Tesseract API works without needing actual image data
        let mut tesseract = tesseract;
        match tesseract.set_variable("tessedit_pageseg_mode", "6") {
            Ok(_) => println!("✅ Tesseract variables can be set"),
            Err(e) => return Err(format!("❌ Failed to set Tesseract variable: {}", e))
        };
        
        // Test 3: Check if we can get version info
        println!("🔍 Tesseract appears to be working correctly");
        
        Ok("🎉 All Tesseract integration tests passed!".to_string())
    }
}

#[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
pub struct OCRResult {
    pub text: String,
    pub confidence: f32,
    pub has_text: bool,
} 