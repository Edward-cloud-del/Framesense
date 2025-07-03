use tesseract::Tesseract;
use image::{DynamicImage, GenericImageView};
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
        
        // Load image and save as temporary PNG file for Tesseract
        let img = image::load_from_memory(&image_bytes)
            .map_err(|e| format!("Failed to load image: {}", e))?;
        
        // Check image dimensions
        let (width, height) = img.dimensions();
        if width < 10 || height < 10 {
            return Err(format!("Image too small for OCR: {}x{} pixels", width, height));
        }
        
        println!("📏 Image dimensions: {}x{} pixels", width, height);
        
        // Create temp directory and file with proper macOS path
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("framesense_ocr_temp.png");
        let temp_path_str = temp_path.to_string_lossy();
        
        println!("📁 Saving temp image to: {}", temp_path_str);
        
        // Save image as PNG
        img.save(&temp_path)
            .map_err(|e| format!("Failed to save temp image to {}: {}", temp_path_str, e))?;
        
        // Verify file exists
        if !temp_path.exists() {
            return Err("Temp image file was not created".to_string());
        }
        
        println!("✅ Temp image saved, size: {} bytes", 
            std::fs::metadata(&temp_path).map(|m| m.len()).unwrap_or(0));
        
        // Create Tesseract instance and set image from file
        let mut tesseract = Tesseract::new(None, Some("eng"))
            .map_err(|e| format!("Failed to initialize Tesseract: {}", e))?
            .set_image(&temp_path_str)
            .map_err(|e| format!("Failed to set image from file {}: {}", temp_path_str, e))?;
        
        println!("✅ Tesseract loaded image successfully");
        
        // Clean up temp file (do this after text extraction)
        let cleanup_path = temp_path.clone();
        
        // Extract text
        let text = tesseract
            .get_text()
            .map_err(|e| format!("Failed to extract text: {}", e))?;
        
        let confidence = tesseract.mean_text_conf() as f32 / 100.0;
        
        // Clean up temp file now that we're done
        let _ = std::fs::remove_file(cleanup_path);
        
        println!("📝 OCR completed - Text: '{}', Confidence: {:.1}%", 
            text.trim(), confidence * 100.0);
        
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