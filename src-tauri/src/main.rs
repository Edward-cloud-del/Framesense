#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    RunEvent, WindowEvent,
    tray::TrayIconBuilder,
    menu::{Menu, MenuItem},
    Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use serde::{Deserialize, Serialize};
use base64::Engine;

// Note: macOS-specific imports removed since we're using native egui overlay

#[derive(Clone, Serialize, Deserialize)]
pub struct AppResult {
    pub success: bool,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CaptureBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CaptureResult {
    pub success: bool,
    pub message: String,
    pub bounds: Option<CaptureBounds>,
    pub image_data: Option<String>, // Base64 encoded image
}

// Test screen capture capability
#[tauri::command]
async fn test_screen_capture() -> Result<AppResult, String> {
    println!("🧪 Testing screen capture capability...");
    
    // Test if we can access screenshots library
    match screenshots::Screen::all() {
        Ok(screens) => {
            println!("✅ Found {} screen(s)", screens.len());
            if let Some(screen) = screens.first() {
                println!("📺 Primary screen: {}x{}", screen.display_info.width, screen.display_info.height);
                
                // Try to capture a small test area
                match screen.capture_area(0, 0, 100, 100) {
                    Ok(_image) => {
                        println!("✅ Screen capture test successful!");
                        Ok(AppResult {
                            success: true,
                            message: format!("Screen capture ready! {} screens available", screens.len()),
                        })
                    },
                    Err(e) => {
                        println!("❌ Screen capture test failed: {}", e);
                        Ok(AppResult {
                            success: false,
                            message: format!("Screen capture failed: {}", e),
                        })
                    }
                }
            } else {
                Ok(AppResult {
                    success: false,
                    message: "No screens found".to_string(),
                })
            }
        },
        Err(e) => {
            println!("❌ Failed to get screens: {}", e);
            Ok(AppResult {
                success: false,
                message: format!("Failed to access screens: {}", e),
            })
        }
    }
}

// Capture screen area
#[tauri::command]
async fn capture_screen_area(bounds: CaptureBounds) -> Result<CaptureResult, String> {
    println!("📸 Capturing screen area: {}x{} at ({}, {})", 
             bounds.width, bounds.height, bounds.x, bounds.y);
    
    match screenshots::Screen::all() {
        Ok(screens) => {
            if let Some(screen) = screens.first() {
                // Make sure bounds are within screen limits
                let max_width = screen.display_info.width as i32;
                let max_height = screen.display_info.height as i32;
                
                let safe_x = bounds.x.max(0).min(max_width - bounds.width as i32);
                let safe_y = bounds.y.max(0).min(max_height - bounds.height as i32);
                let safe_width = bounds.width.min((max_width - safe_x) as u32);
                let safe_height = bounds.height.min((max_height - safe_y) as u32);
                
                println!("📐 Adjusted bounds: {}x{} at ({}, {})", 
                         safe_width, safe_height, safe_x, safe_y);
                
                match screen.capture_area(safe_x, safe_y, safe_width, safe_height) {
                    Ok(image) => {
                        // Convert screenshots::Image to PNG bytes
                        match image.to_png(None) {
                            Ok(png_bytes) => {
                                let base64_data = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
                                println!("✅ Screen capture successful! Image size: {} bytes", png_bytes.len());
                                
                                Ok(CaptureResult {
                                    success: true,
                                    message: "Screen area captured successfully!".to_string(),
                                    bounds: Some(CaptureBounds {
                                        x: safe_x,
                                        y: safe_y,
                                        width: safe_width,
                                        height: safe_height,
                                    }),
                                    image_data: Some(format!("data:image/png;base64,{}", base64_data)),
                                })
                            },
                            Err(e) => {
                                println!("❌ Failed to encode image as PNG: {}", e);
                                Ok(CaptureResult {
                                    success: false,
                                    message: format!("Failed to encode image as PNG: {}", e),
                                    bounds: None,
                                    image_data: None,
                                })
                            }
                        }
                    },
                    Err(e) => {
                        println!("❌ Screen capture failed: {}", e);
                        Ok(CaptureResult {
                            success: false,
                            message: format!("Screen capture failed: {}", e),
                            bounds: None,
                            image_data: None,
                        })
                    }
                }
            } else {
                Ok(CaptureResult {
                    success: false,
                    message: "No screens available".to_string(),
                    bounds: None,
                    image_data: None,
                })
            }
        },
        Err(e) => {
            println!("❌ Failed to access screens: {}", e);
            Ok(CaptureResult {
                success: false,
                message: format!("Failed to access screens: {}", e),
                bounds: None,
                image_data: None,
            })
        }
    }
}

// Single test command
#[tauri::command]
async fn test_command() -> Result<AppResult, String> {
    Ok(AppResult {
        success: true,
        message: "FrameSense systemtray test".to_string(),
    })
}

// Open selection overlay window
#[tauri::command]
async fn open_selection_overlay(app: tauri::AppHandle) -> Result<AppResult, String> {
    println!("🎯 Opening selection overlay window...");
    
    // Generate unique timestamp for window ID
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    
    match WebviewWindowBuilder::new(
        &app,
        &format!("selection-overlay-{}", timestamp),
        WebviewUrl::App("selection-overlay.html".into())
    )
    .title("FrameSense Selection")
    .inner_size(800.0, 600.0)  // Start with reasonable size, will be fullscreen
    .center()
    .decorations(false)        // No window decorations for overlay
    .resizable(false)
    .always_on_top(true)
    .focused(true)
    .visible(true)
    .transparent(true)         // Make window background transparent
    .build() {
        Ok(window) => {
            println!("✅ Selection overlay window created successfully!");
            Ok(AppResult {
                success: true,
                message: "Selection overlay opened".to_string(),
            })
        },
        Err(e) => {
            println!("❌ Failed to create selection overlay: {}", e);
            Err(format!("Failed to create selection overlay: {}", e))
        }
    }
}

// Handle selection completion
#[tauri::command]
async fn overlay_selection_completed(selection_data: serde_json::Value, app: tauri::AppHandle) -> Result<AppResult, String> {
    println!("✅ Selection completed: {:?}", selection_data);
    
    // Close all selection overlay windows
    for window in app.webview_windows().values() {
        if window.label().contains("selection-overlay") {
            let _ = window.close();
        }
    }
    
    // TODO: Here you would process the selection data and perform OCR
    // For now, just log the selection
    println!("📐 Selected area: x={}, y={}, width={}, height={}", 
             selection_data["x"], selection_data["y"], 
             selection_data["width"], selection_data["height"]);
    
    Ok(AppResult {
        success: true,
        message: "Selection processed successfully".to_string(),
    })
}

// Handle selection cancellation
#[tauri::command]
async fn overlay_selection_cancelled(app: tauri::AppHandle) -> Result<AppResult, String> {
    println!("❌ Selection cancelled by user");
    
    // Close all selection overlay windows
    for window in app.webview_windows().values() {
        if window.label().contains("selection-overlay") {
            let _ = window.close();
        }
    }
    
    Ok(AppResult {
        success: true,
        message: "Selection cancelled".to_string(),
    })
}

// Note: macOS fullscreen configuration removed since egui handles this natively

// Create overlay with inline HTML (no cache issues!)
fn create_overlay_with_inline_html(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    println!("🚀 Creating overlay with inline HTML - ZERO cache issues!");
    
    // Generate unique timestamp
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    
        // FIXAD HTML UTAN SYNTAX-FEL
    let html_content = r#"<!DOCTYPE html>
<html>
<head><title>FrameSense</title></head>
<body style="background: red; padding: 50px; font-size: 30px;">
<h1 style="color: white;">FRAMESENSE FUNGERAR!</h1>
<button id="captureBtn" style="background: blue; color: white; padding: 30px; font-size: 25px; border: none; cursor: pointer;">📸 START CAPTURE</button>
<p style="color: white;">Klicka knappen för transparent capture!</p>
<div id="dragbox" style="position: absolute; border: 3px solid #ff0000; background: rgba(255,0,0,0.1); display: none; z-index: 1000;"></div>

<script>
var capturing = false;
var startX = 0;
var startY = 0;

document.getElementById('captureBtn').onclick = function() {
    console.log('START CAPTURE!');
    capturing = true;
    
    document.body.style.background = 'transparent';
    document.body.style.cursor = 'crosshair';
    document.body.innerHTML = '<div id="dragbox" style="position: absolute; border: 3px solid #ff0000; background: rgba(255,0,0,0.1); display: none; z-index: 1000;"></div>';
    
    document.addEventListener('mousedown', function(e) {
        if (!capturing) return;
        startX = e.clientX;
        startY = e.clientY;
        var box = document.getElementById('dragbox');
        box.style.left = startX + 'px';
        box.style.top = startY + 'px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!capturing) return;
        var box = document.getElementById('dragbox');
        if (box.style.display === 'none') return;
        var width = Math.abs(e.clientX - startX);
        var height = Math.abs(e.clientY - startY);
        var left = Math.min(startX, e.clientX);
        var top = Math.min(startY, e.clientY);
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';
    });
    
    document.addEventListener('mouseup', function(e) {
        if (!capturing) return;
        var width = Math.abs(e.clientX - startX);
        var height = Math.abs(e.clientY - startY);
        var left = Math.min(startX, e.clientX);
        var top = Math.min(startY, e.clientY);
        
        alert('SKÄRMOMRÅDE VALT: ' + width + 'x' + height + 'px');
        window.close();
    });
};

console.log('FrameSense ready!');
</script>
</body></html>"#.to_string();
    
    // Create data URL - completely bypasses file system cache!
    let data_url = format!("data:text/html;charset=utf-8,{}", urlencoding::encode(&html_content));
    
    let overlay = WebviewWindowBuilder::new(
        app,
        &format!("overlay-{}", timestamp),
        WebviewUrl::External(data_url.parse().unwrap())
    )
    .title("FrameSense Overlay")
    .inner_size(800.0, 600.0)  // MYCKET större så du ser den!
    .center()
    .decorations(true)   // Visa fönster-kanter så du ser var den är
    .resizable(true)
    .always_on_top(true)
    .visible(true)       // Visa direkt
    .build()?;
    
    // overlay.show()? - redan synlig
    println!("✅ Transparent capture overlay created!");
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                println!("🔥 GLOBAL SHORTCUT: {:?} - State: {:?}", shortcut, event.state());
                
                // Only react to key PRESS, not release!
                if event.state() == ShortcutState::Pressed {
                    if let Err(e) = create_overlay_with_inline_html(app) {
                        println!("❌ Failed to create inline overlay: {}", e);
                    }
                } else {
                    println!("⚪ Ignoring key release");
                }
            })
            .build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Create tray menu items inside setup where we have access to app
            let quit_item = MenuItem::with_id(app, "quit", "Quit FrameSense", true, None::<&str>)?;
            let capture_item = MenuItem::with_id(app, "capture", "Start Capture", true, None::<&str>)?;
            let test_item = MenuItem::with_id(app, "test", "Test Command", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&capture_item, &test_item, &quit_item])?;
            
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => {
                            println!("💀 Quit selected");
                            std::process::exit(0);
                        },
                        "capture" => {
                            println!("📸 Capture triggered from menu - creating inline overlay!");
                            if let Err(e) = create_overlay_with_inline_html(&app.app_handle()) {
                                println!("❌ Failed to create inline overlay: {}", e);
                            }
                        },
                        "test" => {
                            println!("🧪 Test command triggered");
                        },
                        _ => {}
                    }
                })
                .on_tray_icon_event(|_tray, event| {
                    println!("🎯 Tray icon event: {:?}", event);
                })
                .build(app)?;

            // Register global hotkey like Cluely (Cmd+Shift+Space for macOS compatibility)
            println!("🚀 Setting up FrameSense background app...");
            
            // Setup global shortcut (simplified approach)
            let shortcut = "Cmd+Shift+Space".parse::<Shortcut>().unwrap();
            
            match app.global_shortcut().register(shortcut) {
                Ok(_) => {
                    println!("✅ Global shortcut Cmd+Shift+Space registered successfully!");
                    println!("⚠️  Note: Shortcut handling will be implemented via events");
                },
                Err(e) => println!("❌ Failed to register global shortcut: {} - Use tray menu instead", e),
            }
            
            println!("✅ FrameSense is ready! Press Cmd+Shift+Space or use tray menu");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            test_command,
            test_screen_capture,
            capture_screen_area,
            open_selection_overlay,
            overlay_selection_completed,
            overlay_selection_cancelled,
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                // Hide window instead of closing for systemtray apps
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app_handle, event| {
            match event {
                RunEvent::Ready => {
                    println!("🎯 App ready!");
                },
                RunEvent::ExitRequested { api, .. } => {
                    // Prevent app from closing when last window closes
                    api.prevent_exit();
                }
                _ => {}
            }
        });
}
