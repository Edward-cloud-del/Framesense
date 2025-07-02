#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    RunEvent, WindowEvent,
    tray::TrayIconBuilder,
    menu::{Menu, MenuItem},
    Manager, Emitter, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use base64::Engine;
use std::time::{SystemTime, UNIX_EPOCH};

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

// App state that persists between window creations (like Raycast)
#[derive(Clone, Default)]
pub struct AppState {
    pub screenshot_data: Option<String>,
    pub last_bounds: Option<CaptureBounds>,
    pub last_window_closed_time: Option<u64>, // Timestamp when window was last closed
}

type SharedState = Arc<Mutex<AppState>>;

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

// Check permissions (simplified for now)
#[tauri::command]
async fn check_permissions() -> Result<bool, String> {
    // For now, just return true since we handle permissions via macOS system prompts
    // In a real app, you might want to check specific permissions here
    println!("🔐 Checking permissions...");
    Ok(true)
}

// Create transparent fullscreen overlay for drag selection
#[tauri::command]
async fn start_fullscreen_selection(app: tauri::AppHandle) -> Result<(), String> {
    println!("🎯 Creating transparent fullscreen overlay...");
    
    // Get actual screen dimensions  
    let (screen_width, screen_height) = match screenshots::Screen::all() {
        Ok(screens) => {
            if let Some(screen) = screens.first() {
                let width = screen.display_info.width as f64;
                let height = screen.display_info.height as f64;
                println!("📺 Fullscreen overlay using screen: {}x{}", width, height);
                (width, height)
            } else {
                println!("⚠️ No screens found, using fallback 1920x1080");
                (1920.0, 1080.0)
            }
        },
        Err(e) => {
            println!("❌ Failed to get screen info: {}, using fallback", e);
            (1920.0, 1080.0)
        }
    };
    
    // Create enhanced transparent overlay HTML (matches React DragOverlay styling)
    let overlay_html = r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FrameSense Selection</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: rgba(0, 0, 0, 0.2);
            width: 100vw;
            height: 100vh;
            cursor: crosshair;
            user-select: none;
            overflow: hidden;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        #instructions {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
        }
        
        #close-button {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 32px;
            height: 32px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        #close-button:hover {
             background: #dc2626;
        }
        
        #selection-box {
            position: absolute;
            border: 2px solid #3b82f6;
            background: rgba(59, 130, 246, 0.2);
            display: none;
            pointer-events: none;
        }
        
        .corner {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border-radius: 50%;
        }
        
        .corner.top-left { top: -6px; left: -6px; }
        .corner.top-right { top: -6px; right: -6px; }
        .corner.bottom-left { bottom: -6px; left: -6px; }
        .corner.bottom-right { bottom: -6px; right: -6px; }
        
        #size-indicator {
            position: absolute;
            bottom: -32px;
            left: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            display: none;
        }
    </style>
</head>
<body>
    <div id="instructions">🖱️ Drag to select area • ⏹️ ESC to cancel</div>
    <button id="close-button">×</button>
    
    <div id="selection-box">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div id="size-indicator"></div>
    </div>
    
    <script>
        console.log('🚀 Enhanced transparent overlay loaded!');
        
        let dragging = false;
        let startX = 0, startY = 0;
        const selectionBox = document.getElementById('selection-box');
        const sizeIndicator = document.getElementById('size-indicator');
        const closeButton = document.getElementById('close-button');
        
        // Close button functionality
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('❌ Close button clicked');
            window.close();
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.target === closeButton) return; // Don't start drag on close button
            
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            console.log('🖱️ Mouse down - starting drag at:', startX, startY);
            
            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.display = 'block';
            sizeIndicator.style.display = 'block';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            const left = Math.min(startX, e.clientX);
            const top = Math.min(startY, e.clientY);
            
            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';
            
            // Update size indicator
            sizeIndicator.textContent = Math.round(width) + ' × ' + Math.round(height);
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!dragging) return;
            dragging = false;
            
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            const left = Math.min(startX, e.clientX);
            const top = Math.min(startY, e.clientY);
            
            console.log('✅ Selection completed:', { left, top, width, height });
            
            if (width > 10 && height > 10) {
                console.log('📸 Sending coordinates to main window...');
                
                // Send message to main window using postMessage
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'SCREEN_SELECTION',
                        bounds: { x: left, y: top, width: width, height: height }
                    }, '*');
                    console.log('📤 Coordinates sent via postMessage');
                } else {
                    console.log('📤 Attempting direct Tauri invoke...');
                    // Fallback: try direct invoke
                    if (window.__TAURI__ && window.__TAURI__.invoke) {
                        window.__TAURI__.invoke('process_screen_selection', {
                            bounds: { x: left, y: top, width: width, height: height }
                        }).then(() => {
                            console.log('📸 Screen capture sent to Rust');
                        }).catch(err => {
                            console.error('❌ Failed to process selection:', err);
                        });
                    }
                }
                
                // Close overlay after short delay
                setTimeout(() => window.close(), 100);
            } else {
                console.log('⚠️ Selection too small, closing overlay');
                window.close();
            }
        });
        
        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('⏹️ Escape pressed - closing overlay');
                window.close();
            }
        });
        
        // Hide size indicator when not dragging
        document.addEventListener('mouseup', () => {
            setTimeout(() => {
                if (sizeIndicator) {
                    sizeIndicator.style.display = 'none';
                }
            }, 2000);
        });
    </script>
</body>
</html>"#;
    
    // Create data URL
    let data_url = format!("data:text/html;charset=utf-8,{}", urlencoding::encode(overlay_html));
    
    // Create transparent fullscreen overlay window
    let _overlay = WebviewWindowBuilder::new(
        &app,
        "transparent-overlay",
        WebviewUrl::External(data_url.parse().unwrap())
    )
    .title("FrameSense Selection")
    .inner_size(screen_width, screen_height)
    .position(0.0, 0.0)
    .decorations(false)      // No window borders
    .transparent(true)       // Make window transparent!
    .always_on_top(true)     // Above all other windows
    .skip_taskbar(true)      // Don't show in taskbar
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .build()
    .map_err(|e| format!("Failed to create overlay: {}", e))?;
    
    println!("✅ Transparent overlay created!");
    Ok(())
}

// Process screen selection - capture and analyze
#[tauri::command]
async fn process_screen_selection(app: tauri::AppHandle, bounds: CaptureBounds) -> Result<(), String> {
    println!("🎯 Processing screen selection: {}x{} at ({}, {})", 
             bounds.width, bounds.height, bounds.x, bounds.y);
    
    // Capture the selected screen area
    match capture_screen_area(bounds.clone()).await {
        Ok(capture_result) => {
            if capture_result.success && capture_result.image_data.is_some() {
                let image_data = capture_result.image_data.unwrap();
                println!("✅ Screen capture successful, analyzing content...");
                
                // For now, we'll just send the image data to React
                // Later we can add text extraction and OCR here
                if let Some(window) = app.get_webview_window("main") {
                    let analysis_result = serde_json::json!({
                        "type": "image",
                        "bounds": bounds,
                        "imageData": image_data,
                        "text": null,
                        "success": true,
                        "message": "Screen area captured successfully!"
                    });
                    
                    window.emit("selection-result", analysis_result).unwrap();
                    println!("📤 Sent image data to React app");
                } else {
                    println!("❌ Main window not found");
                }
            } else {
                println!("❌ Screen capture failed: {}", capture_result.message);
                if let Some(window) = app.get_webview_window("main") {
                    let error_result = serde_json::json!({
                        "type": "error",
                        "success": false,
                        "message": capture_result.message
                    });
                    window.emit("selection-result", error_result).unwrap();
                }
            }
        },
        Err(e) => {
            println!("❌ Failed to capture screen: {}", e);
            if let Some(window) = app.get_webview_window("main") {
                let error_result = serde_json::json!({
                    "type": "error", 
                    "success": false,
                    "message": format!("Screen capture failed: {}", e)
                });
                window.emit("selection-result", error_result).unwrap();
            }
        }
    }
    
    Ok(())
}

// Get window position for coordinate conversion
#[tauri::command]
async fn get_window_position(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    if let Some(window) = app.get_webview_window("main") {
        match window.outer_position() {
            Ok(position) => {
                let pos = serde_json::json!({
                    "x": position.x,
                    "y": position.y
                });
                println!("📍 Window position: {}x{}", position.x, position.y);
                Ok(pos)
            },
            Err(e) => {
                println!("❌ Failed to get window position: {}", e);
                Err(format!("Failed to get window position: {}", e))
            }
        }
    } else {
        Err("Main window not found".to_string())
    }
}

// Create transparent overlay window for selection
#[tauri::command]
async fn create_transparent_overlay(app: tauri::AppHandle) -> Result<(), String> {
    // Close existing overlay if it exists
    if let Some(existing) = app.get_webview_window("overlay") {
        println!("🗑️ Closing existing overlay window...");
        match existing.close() {
            Ok(_) => {
                println!("✅ Existing overlay close requested");
                // Short delay to let window close
                tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
            },
            Err(e) => println!("⚠️ Failed to close existing overlay: {}", e),
        }
    }
    
    // Get actual screen dimensions
    let (screen_width, screen_height) = match screenshots::Screen::all() {
        Ok(screens) => {
            if let Some(screen) = screens.first() {
                let width = screen.display_info.width as f64;
                let height = screen.display_info.height as f64;
                println!("📺 Detected screen: {}x{}", width, height);
                (width, height)
            } else {
                println!("⚠️ No screens found, using fallback 1920x1080");
                (1920.0, 1080.0)
            }
        },
        Err(e) => {
            println!("❌ Failed to get screen info: {}, using fallback", e);
            (1920.0, 1080.0)
        }
    };
    
    println!("🎯 Creating transparent overlay window...");
    
    // Create transparent fullscreen overlay window with React
    let _overlay = WebviewWindowBuilder::new(
        &app,
        "overlay",
        WebviewUrl::App("overlay".into())  // Will load a separate React route
    )
    .title("FrameSense Overlay")
    .inner_size(screen_width, screen_height)
    .position(0.0, 0.0)
    .decorations(false)
    .transparent(true)        // Transparent window
    .shadow(false)            // No shadow
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .build()
    .map_err(|e| format!("Failed to create overlay: {}", e))?;
    
    println!("✅ Transparent overlay window created!");
    Ok(())
}

// Close transparent overlay window
#[tauri::command]
async fn close_transparent_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        match overlay.close() {
            Ok(_) => {
                println!("✅ Closed transparent overlay");
                Ok(())
            },
            Err(e) => {
                println!("❌ Failed to close overlay: {}", e);
                Err(format!("Failed to close overlay: {}", e))
            }
        }
    } else {
        println!("❌ Overlay window not found");
        Err("Overlay window not found".to_string())
    }
}

// 🆕 FAS 2: WINDOW RESIZE FUNCTIONS

// Resize main window for chat expansion/contraction
#[tauri::command]
async fn resize_window(app: tauri::AppHandle, width: f64, height: f64) -> Result<(), String> {
    println!("📏 Resizing main window to {}x{}", width, height);
    
    if let Some(window) = app.get_webview_window("main") {
        match window.set_size(tauri::LogicalSize::new(width, height)) {
            Ok(_) => {
                println!("✅ Window resized successfully to {}x{}", width, height);
                Ok(())
            },
            Err(e) => {
                println!("❌ Failed to resize window: {}", e);
                Err(format!("Failed to resize window: {}", e))
            }
        }
    } else {
        println!("❌ Main window not found for resize");
        Err("Main window not found".to_string())
    }
}

// Note: Main window created with .transparent(true) - React CSS controls background visibility
// When chatBoxOpen=true: transparent, when false: white background

// 🔧 DEBUG COMMAND - Get detailed coordinate info
#[tauri::command]
async fn debug_coordinates(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let mut debug_info = serde_json::Map::new();
    
    // Main window info
    if let Some(main_window) = app.get_webview_window("main") {
        if let Ok(pos) = main_window.outer_position() {
            debug_info.insert("main_outer_position".to_string(), 
                serde_json::json!({"x": pos.x, "y": pos.y}));
        }
        if let Ok(size) = main_window.outer_size() {
            debug_info.insert("main_outer_size".to_string(), 
                serde_json::json!({"width": size.width, "height": size.height}));
        }
        if let Ok(inner_pos) = main_window.inner_position() {
            debug_info.insert("main_inner_position".to_string(), 
                serde_json::json!({"x": inner_pos.x, "y": inner_pos.y}));
        }
        if let Ok(inner_size) = main_window.inner_size() {
            debug_info.insert("main_inner_size".to_string(), 
                serde_json::json!({"width": inner_size.width, "height": inner_size.height}));
        }
        if let Ok(scale) = main_window.scale_factor() {
            debug_info.insert("scale_factor".to_string(), serde_json::json!(scale));
        }
    }
    
    // Screen info
    if let Ok(screens) = screenshots::Screen::all() {
        if let Some(screen) = screens.first() {
            debug_info.insert("screen_size".to_string(), 
                serde_json::json!({
                    "width": screen.display_info.width,
                    "height": screen.display_info.height
                }));
        }
    }
    
    println!("🔍 DEBUG INFO: {}", serde_json::to_string_pretty(&debug_info).unwrap());
    Ok(serde_json::Value::Object(debug_info))
}

// 🔧 TEST COMMAND - Position ChatBox at specific coordinates
#[tauri::command]
async fn test_chatbox_position(app: tauri::AppHandle, x: f64, y: f64) -> Result<(), String> {
    println!("🧪 Testing ChatBox position at ({}, {})", x, y);
    
    // Close existing chatbox if it exists
    if let Some(chatbox) = app.get_webview_window("chatbox") {
        let _ = chatbox.close();
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }
    
    // Create ChatBox at specific position for testing
    let chatbox_html = r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ChatBox Position Test</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: rgba(255, 0, 0, 0.8);
            border: 3px solid red;
            border-radius: 12px;
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }
    </style>
</head>
<body>
    TEST POSITION<br/>
    x: {}, y: {}
    <script>
        setTimeout(() => window.close(), 3000); // Auto-close after 3 seconds
    </script>
</body>
</html>"#;
    
    let test_html = chatbox_html.replace("x: {}, y: {}", &format!("x: {}, y: {}", x, y));
    let data_url = format!("data:text/html;charset=utf-8,{}", urlencoding::encode(&test_html));
    
    let _test_window = WebviewWindowBuilder::new(
        &app,
        "test-chatbox",  // Use different ID for test
        WebviewUrl::External(data_url.parse().unwrap())
    )
    .title("Position Test")
    .inner_size(200.0, 100.0)
    .position(x, y)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .build()
    .map_err(|e| format!("Failed to create test window: {}", e))?;
    
    println!("🎯 Test ChatBox created at ({}, {}) - will auto-close in 3 seconds", x, y);
    Ok(())
}



// Save current app state before closing window (like Raycast)
#[tauri::command]
async fn save_app_state(app: tauri::AppHandle, screenshot_data: Option<String>) -> Result<(), String> {
    if let Some(state) = app.try_state::<SharedState>() {
        let mut app_state = state.lock().unwrap();
        app_state.screenshot_data = screenshot_data;
        println!("💾 App state saved with screenshot: {}", app_state.screenshot_data.is_some());
    }
    Ok(())
}

// Get saved app state when creating new window (like Raycast)
#[tauri::command]
async fn get_app_state(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    if let Some(state) = app.try_state::<SharedState>() {
        let app_state = state.lock().unwrap();
        let result = serde_json::json!({
            "screenshot_data": app_state.screenshot_data,
            "last_bounds": app_state.last_bounds
        });
        println!("📂 App state retrieved with screenshot: {}", app_state.screenshot_data.is_some());
        Ok(result)
    } else {
        Ok(serde_json::json!({"screenshot_data": null, "last_bounds": null}))
    }
}

// Create new main window on current Space (like Raycast/Spotlight)
#[tauri::command]
async fn create_main_window(app: tauri::AppHandle) -> Result<(), String> {
    // Close existing window if it exists
    if let Some(existing) = app.get_webview_window("main") {
        let _ = existing.close();
    }
    
    println!("🎯 Creating new main window on current Space...");
    
    // Create fresh window that will appear on current Space
    let _window = WebviewWindowBuilder::new(
        &app,
        "main",
        WebviewUrl::App("/".into())
    )
    .title("FrameSense")
    .inner_size(600.0, 140.0)
    .position(0.0, 100.0) // Will auto-center
    .center()
    .resizable(false)
    .decorations(false)
    .transparent(true)    // 🔧 FIX: Enable window transparency!
    .always_on_top(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| format!("Failed to create main window: {}", e))?;
    
    println!("✅ New main window created on current Space!");
    Ok(())
}

fn main() {
    // Initialize shared state for Raycast-style persistence
    let shared_state: SharedState = Arc::new(Mutex::new(AppState::default()));
    
    tauri::Builder::default()
        .manage(shared_state)
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                println!("🔥 GLOBAL SHORTCUT: {:?} - State: {:?}", shortcut, event.state());
                
                // Only react to key PRESS, not release!
                if event.state() == ShortcutState::Pressed {
                    let app_clone = app.clone();
                    std::thread::spawn(move || {
                        // Small delay to avoid rapid toggle
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        
                        // Raycast-style: Create/Destroy window to appear on current Space
                        if let Some(window) = app_clone.get_webview_window("main") {
                            // Window exists - save state and close it
                            println!("🔄 Window exists, closing and saving state...");
                            
                            // Emit event to React to save its state before closing
                            let _ = window.emit("save-state-and-close", ());
                            
                            // Close after allowing React to save state
                            std::thread::sleep(std::time::Duration::from_millis(100));
                            let _ = window.close();
                            
                            // Record the time when window was closed for quit logic
                            if let Some(state) = app_clone.try_state::<SharedState>() {
                                let mut app_state = state.lock().unwrap();
                                app_state.last_window_closed_time = Some(
                                    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
                                );
                            }
                            
                            println!("🗑️ Window closed (Raycast-style)");
                        } else {
                            // No window exists - check if we should quit or create window
                            println!("✨ No window exists...");
                            
                            // Check if we recently closed a window (within 3 seconds)
                            let should_quit = if let Some(state) = app_clone.try_state::<SharedState>() {
                                let app_state = state.lock().unwrap();
                                if let Some(last_closed) = app_state.last_window_closed_time {
                                    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                                    let time_since_closed = now - last_closed;
                                    println!("⏱️ {} seconds since last window closed", time_since_closed);
                                    time_since_closed < 3 // Quit if less than 3 seconds
                                } else {
                                    false // No previous close time, don't quit
                                }
                            } else {
                                false
                            };
                            
                            if should_quit {
                                println!("🚪 Alt+Space pressed twice quickly - quitting application...");
                                std::process::exit(0);
                            } else {
                                // Create new window on current Space
                                println!("🆕 Creating new window on current Space...");
                                let rt = tokio::runtime::Runtime::new().unwrap();
                                rt.block_on(async {
                                    if let Err(e) = create_main_window(app_clone).await {
                                        println!("❌ Failed to create window: {}", e);
                                    } else {
                                        println!("✅ New window created successfully!");
                                    }
                                });
                            }
                        }
                    });
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
                            println!("📸 Capture triggered from menu!");
                            if let Some(window) = app.get_webview_window("main") {
                                window.emit("show-capture-overlay", ()).unwrap();
                                println!("✅ Sent show-capture-overlay event to React");
                            } else {
                                println!("❌ Main window not found");
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
            
            // Setup global shortcut for window toggle (like Cluely)
            let shortcut = "Alt+Space".parse::<Shortcut>().unwrap();
            
            match app.global_shortcut().register(shortcut) {
                Ok(_) => {
                    println!("✅ Global shortcut Alt+Space registered successfully!");
                    println!("⚠️  Note: Use Alt+Space to toggle window visibility");
                },
                Err(e) => println!("❌ Failed to register global shortcut: {} - Use tray menu instead", e),
            }
            
            println!("✅ FrameSense is ready! Press Alt+Space to create window or use tray menu");
            
            // Close initial window - we'll create fresh ones on Alt+Space (Raycast-style)
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.close();
                println!("🗑️ Closed initial window - will create fresh ones on current Space");
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            test_command,
            check_permissions,
            test_screen_capture,
            capture_screen_area,
            start_fullscreen_selection,
            process_screen_selection,
            get_window_position,
            create_transparent_overlay,
            close_transparent_overlay,
            resize_window,
            debug_coordinates,
            test_chatbox_position,
            save_app_state,
            get_app_state,
            create_main_window,
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                // Only prevent close for overlay windows, let main window close normally
                if window.label() == "main" {
                    // Let main window close normally for Raycast-style behavior
                    println!("🚪 Main window close requested");
                } else {
                    // Hide other windows (like overlays) instead of closing
                    window.hide().unwrap();
                    api.prevent_close();
                }
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
