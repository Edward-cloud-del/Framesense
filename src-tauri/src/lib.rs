#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use screenshots::Screen;
use image::{ImageFormat, RgbaImage, DynamicImage};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

// Import overlay modules
pub mod overlay;
use overlay::{ScreenCapture, SelectionOverlay, CaptureBounds, SelectionResult, MousePosition, get_overlay, NativeOverlay, ScreenQuadrant};

// App state
#[derive(Debug, Default)]
pub struct AppState {
    pub permissions_granted: Mutex<bool>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct PermissionStatus {
    pub screen_recording: bool,
    pub accessibility: bool,
}

// CaptureBounds and CaptureResult are now defined in overlay module

// Tauri commands
#[tauri::command]
async fn check_permissions() -> Result<PermissionStatus, String> {
    // TODO: Implement actual permission checking for macOS
    Ok(PermissionStatus {
        screen_recording: false, // Will be implemented with native code
        accessibility: false,
    })
}

#[tauri::command]
async fn request_permissions() -> Result<bool, String> {
    // TODO: Implement permission request
    // For now, return false to trigger manual steps
    Ok(false)
}

#[tauri::command]
async fn open_system_preferences() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .spawn()
            .map_err(|e| format!("Failed to open System Preferences: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
async fn take_fullscreen_screenshot() -> Result<String, String> {
    println!("🔥 Taking fullscreen screenshot...");
    
    // Get all screens
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    
    if screens.is_empty() {
        return Err("No screens found".to_string());
    }
    
    // Take screenshot of first screen
    let screen = &screens[0];
    println!("📸 Capturing screen: {}x{}", screen.display_info.width, screen.display_info.height);
    
    let screenshot = screen.capture().map_err(|e| format!("Failed to capture screen: {}", e))?;
    
    // Convert screenshots::Image to image::RgbaImage
    let rgba_image = RgbaImage::from_raw(
        screenshot.width(),
        screenshot.height(),
        screenshot.rgba().to_vec(),
    ).ok_or("Failed to create RGBA image from screenshot")?;
    
    // Convert to DynamicImage for easier encoding
    let dynamic_image = DynamicImage::ImageRgba8(rgba_image);
    
    // Convert to PNG bytes
    let mut png_buffer = Vec::new();
    {
        let mut cursor = Cursor::new(&mut png_buffer);
        dynamic_image.write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }
    
    let base64_data = general_purpose::STANDARD.encode(&png_buffer);
    println!("✅ Screenshot captured! Size: {} bytes", base64_data.len());
    
    Ok(format!("data:image/png;base64,{}", base64_data))
}

#[tauri::command]
async fn start_screen_selection() -> Result<SelectionResult, String> {
    println!("🎯 Frontend requested screen selection");
    SelectionOverlay::start_selection().await
}

#[tauri::command]
async fn capture_screen_region(bounds: CaptureBounds) -> Result<String, String> {
    println!("📸 Capturing screen region: {:?}", bounds);
    match ScreenCapture::capture_region(bounds).await {
        Ok(result) => Ok(result.image_data),
        Err(e) => Err(e),
    }
}

#[tauri::command]
async fn get_screen_info() -> Result<Vec<overlay::ScreenInfo>, String> {
    ScreenCapture::get_screen_info()
}

#[tauri::command]
async fn start_drag_selection(pos: MousePosition) -> Result<(), String> {
    let overlay = get_overlay();
    overlay.start_drag(pos)
}

#[tauri::command]
async fn update_selection_mouse(pos: MousePosition) -> Result<(), String> {
    let overlay = get_overlay();
    overlay.update_mouse_position(pos)
}

#[tauri::command]
async fn end_drag_selection() -> Result<Option<SelectionResult>, String> {
    let overlay = get_overlay();
    overlay.end_drag().await
}

#[tauri::command]
async fn cancel_selection() -> Result<(), String> {
    let overlay = get_overlay();
    overlay.cancel_selection()
}

#[tauri::command]
async fn select_screen_quadrant(quadrant: String) -> Result<SelectionResult, String> {
    println!("🎯 Selecting screen quadrant: {}", quadrant);
    
    let screen_quadrant = match quadrant.as_str() {
        "top-left" => ScreenQuadrant::TopLeft,
        "top-right" => ScreenQuadrant::TopRight,
        "bottom-left" => ScreenQuadrant::BottomLeft,
        "bottom-right" => ScreenQuadrant::BottomRight,
        "center" => ScreenQuadrant::Center,
        _ => return Err(format!("Invalid quadrant: {}", quadrant)),
    };
    
    NativeOverlay::select_screen_quadrant(screen_quadrant).await
}

#[tauri::command]
async fn manual_selection(x: i32, y: i32, width: u32, height: u32) -> Result<SelectionResult, String> {
    let bounds = CaptureBounds { x, y, width, height };
    println!("🎯 Manual selection: {:?}", bounds);
    NativeOverlay::manual_selection(bounds).await
}

#[tauri::command]
async fn copy_to_clipboard(text: String) -> Result<(), String> {
    // TODO: Implement clipboard functionality
    println!("Copying to clipboard: {}", text);
    Ok(())
}

#[tauri::command]
async fn register_global_hotkey() -> Result<(), String> {
    // TODO: Implement global hotkey registration
    println!("Registering global hotkey: Option+Space");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize app state
            app.manage(AppState::default());
            
            // Register global hotkey
            // TODO: Implement this properly
            
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            check_permissions,
            request_permissions,
            open_system_preferences,
            take_fullscreen_screenshot,
            start_screen_selection,
            capture_screen_region,
            get_screen_info,
            start_drag_selection,
            update_selection_mouse,
            end_drag_selection,
            cancel_selection,
            select_screen_quadrant,
            manual_selection,
            copy_to_clipboard,
            register_global_hotkey,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FrameSense application");
}
