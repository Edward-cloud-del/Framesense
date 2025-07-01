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


// macOS-specific imports for fullscreen compatibility
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

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

// Configure macOS window for fullscreen compatibility
#[cfg(target_os = "macos")]
fn configure_macos_fullscreen_window(window: &tauri::WebviewWindow) {
    window.with_webview(|webview| {
        #[cfg(target_os = "macos")]
        unsafe {
            let ns_window = webview.ns_window() as id;
            if ns_window != nil {
                // Set window level to appear over fullscreen apps
                // NSScreenSaverWindowLevel = 1000, NSPopUpMenuWindowLevel = 101
                // NSMainMenuWindowLevel = 24, NSNormalWindowLevel = 0
                let window_level: i32 = 1000; // NSScreenSaverWindowLevel for maximum priority
                let _: () = msg_send![ns_window, setLevel: window_level];
                
                // Set collection behavior to allow appearing on all spaces/desktops
                // NSWindowCollectionBehaviorCanJoinAllSpaces = 1 << 0 = 1
                // NSWindowCollectionBehaviorStationary = 1 << 4 = 16  
                // NSWindowCollectionBehaviorIgnoresCycle = 1 << 6 = 64
                let behavior: u32 = 1 | 16 | 64; // Combined behavior flags
                let _: () = msg_send![ns_window, setCollectionBehavior: behavior];
                
                println!("✅ macOS fullscreen compatibility configured (Level: {}, Behavior: {})!", window_level, behavior);
            }
        }
    }).map_err(|e| println!("❌ Failed to configure macOS window: {}", e)).ok();
}

#[cfg(not(target_os = "macos"))]
fn configure_macos_fullscreen_window(_window: &tauri::WebviewWindow) {
    // No-op on other platforms
    println!("⚪ macOS fullscreen config skipped (not macOS)");
}

// Create Cluely-style overlay window
fn create_overlay_window(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    // Force close existing overlay first - with retry logic
    if let Some(existing) = app.get_webview_window("overlay") {
        println!("🔄 Destroying existing overlay window to clear cache");
        let _ = existing.close();
        
        // Wait and verify it's actually gone
        for i in 0..10 {
            std::thread::sleep(std::time::Duration::from_millis(50));
            if app.get_webview_window("overlay").is_none() {
                println!("✅ Overlay window successfully destroyed after {}ms", (i + 1) * 50);
                break;
            }
            if i == 9 {
                println!("⚠️ Overlay window still exists after 500ms, continuing anyway");
            }
        }
    }
    
    // Generate aggressive cache busting parameters
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos(); // Use nanoseconds for more uniqueness
    
    // Determine window label - use fallback if overlay still exists
    let window_label = if app.get_webview_window("overlay").is_some() {
        let fallback_label = format!("overlay-{}", timestamp % 1000);
        println!("⚠️ Using fallback window label: {}", fallback_label);
        fallback_label
    } else {
        "overlay".to_string()
    };
    
    println!("🆕 Creating fresh overlay '{}' with cache-buster: {}", window_label, timestamp);
    
    let overlay = WebviewWindowBuilder::new(
        app,
        &window_label,
        WebviewUrl::App(format!("overlay.html?v={}&t={}&nocache={}", timestamp, timestamp, timestamp).into())
    )
    .title("") // No title
    .inner_size(600.0, 80.0) // Small Cluely box
    .center() // Center on current screen
    .decorations(false) // No window decorations
    .resizable(false)
    .always_on_top(true)
    .visible(false) // Start hidden - show without focus later
    .accept_first_mouse(false) // Don't accept first mouse click
    .skip_taskbar(true) // Don't show in dock
    .shadow(false) // No shadow for cleaner look
    .build()?;
    
    // Configure macOS-specific settings for fullscreen compatibility
    configure_macos_fullscreen_window(&overlay);
    
    // Show WITHOUT taking focus (Cluely behavior)
    overlay.show()?;
    
    println!("✅ New Cluely-style overlay created with fullscreen support!");
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                println!("🔥 GLOBAL SHORTCUT: {:?} - State: {:?}", shortcut, event.state());
                
                // Only react to key PRESS, not release!
                if event.state() == ShortcutState::Pressed {
                    if let Err(e) = create_overlay_window(app) {
                        println!("❌ Failed to create overlay: {}", e);
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
                            println!("📸 Capture triggered from menu - creating overlay!");
                            if let Err(e) = create_overlay_window(app) {
                                println!("❌ Failed to create overlay: {}", e);
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
