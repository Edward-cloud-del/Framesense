use tauri::{WebviewWindow, WebviewWindowBuilder, WebviewUrl};
use std::time::{Duration, Instant};
use screenshots;

pub struct OverlayManager {
    overlay_window: Option<WebviewWindow>,
    is_active: bool,
    last_used: Option<Instant>,
}

impl OverlayManager {
    pub fn new() -> Self {
        Self {
            overlay_window: None,
            is_active: false,
            last_used: None,
        }
    }
    
    pub fn show_selection_overlay(&mut self, app: &tauri::AppHandle) -> Result<(), String> {
        match &self.overlay_window {
            Some(window) => {
                // ♻️ Återanvänd befintlig overlay
                window.show().map_err(|e| format!("Failed to show overlay: {}", e))?;
                
                // Reset overlay state via JavaScript
                if let Err(e) = window.eval("window.resetSelection && window.resetSelection()") {
                    println!("⚠️ Could not reset overlay state: {}", e);
                    // Fortsätt ändå - overlay kan fortfarande fungera
                }
                
                self.is_active = true;
                println!("♻️ Reusing existing overlay window");
            },
            None => {
                // 🆕 Skapa första gången
                let overlay = self.create_overlay_once(app)?;
                self.overlay_window = Some(overlay);
                self.is_active = true;
                println!("🆕 Created new overlay window");
            }
        }
        self.last_used = Some(Instant::now());
        Ok(())
    }
    
    pub fn hide_overlay(&mut self) -> Result<(), String> {
        if let Some(window) = &self.overlay_window {
            window.hide().map_err(|e| format!("Failed to hide overlay: {}", e))?;
            self.is_active = false;
            println!("👁️ Overlay hidden (not destroyed)");
        }
        Ok(())
    }
    
    pub fn cleanup_if_old(&mut self) {
        // 🗑️ Rensa overlay om den inte använts på 5 minuter
        if let Some(last_used) = self.last_used {
            if last_used.elapsed() > Duration::from_secs(300) && !self.is_active {
                if let Some(window) = &self.overlay_window {
                    if let Err(e) = window.close() {
                        println!("⚠️ Failed to close old overlay: {}", e);
                    } else {
                        println!("🗑️ Cleaned up old overlay window");
                    }
                    self.overlay_window = None;
                }
            }
        }
    }
    
    pub fn is_overlay_active(&self) -> bool {
        self.is_active
    }
    
    fn create_overlay_once(&self, app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
        println!("🚀 Creating optimized overlay with enhanced features...");
        
        // Get screen dimensions for fullscreen overlay
        let (screen_width, screen_height) = match screenshots::Screen::all() {
            Ok(screens) => {
                if let Some(screen) = screens.first() {
                    let width = screen.display_info.width as f64;
                    let height = screen.display_info.height as f64;
                    println!("📺 Overlay using screen: {}x{}", width, height);
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
        
        // Enhanced overlay HTML with reset capability
        let overlay_html = self.create_enhanced_overlay_html();
        
        // Create data URL
        let data_url = format!("data:text/html;charset=utf-8,{}", urlencoding::encode(&overlay_html));
        
        // Create optimized overlay window
        let overlay = WebviewWindowBuilder::new(
            app,
            "optimized-overlay",
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
        .map_err(|e| format!("Failed to create optimized overlay: {}", e))?;
        
        println!("✅ Optimized overlay created successfully!");
        Ok(overlay)
    }
    
    fn create_enhanced_overlay_html(&self) -> String {
        r#"
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
            transition: opacity 0.3s ease;
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
            transition: background-color 0.2s ease;
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
            transition: opacity 0.1s ease;
        }
        
        .corner {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
            white-space: nowrap;
        }
        
        .fade-out {
            opacity: 0 !important;
        }
    </style>
</head>
<body>
    <div id="instructions">🖱️ Drag to select area • ⏹️ ESC to cancel • 🔄 Optimized overlay</div>
    <button id="close-button">×</button>
    
    <div id="selection-box">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div id="size-indicator"></div>
    </div>
    
    <script>
        console.log('🚀 Enhanced reusable overlay loaded!');
        
        // Overlay state management
        let dragging = false;
        let startX = 0, startY = 0;
        const selectionBox = document.getElementById('selection-box');
        const sizeIndicator = document.getElementById('size-indicator');
        const closeButton = document.getElementById('close-button');
        const instructions = document.getElementById('instructions');
        
        // 🔄 Reset function for overlay reuse
        window.resetSelection = function() {
            dragging = false;
            startX = 0;
            startY = 0;
            selectionBox.style.display = 'none';
            sizeIndicator.style.display = 'none';
            instructions.classList.remove('fade-out');
            
            // Reset any pending timeouts
            if (window.hideTimeout) {
                clearTimeout(window.hideTimeout);
                window.hideTimeout = null;
            }
            
            console.log('🔄 Overlay state reset for reuse');
        };
        
        // ⚡ Fast selection system
        window.fastSelection = {
            isReady: true,
            lastBounds: null,
            processingTimeout: null,
            
            completedSelection: function(bounds) {
                if (!this.isReady || bounds.width <= 10 || bounds.height <= 10) {
                    console.log('⚠️ Selection too small or not ready');
                    return;
                }
                
                this.isReady = false; // Prevent double-triggers
                this.lastBounds = bounds;
                
                // Fade out instructions for better UX
                instructions.classList.add('fade-out');
                
                console.log('📸 Fast selection processing:', bounds);
                
                // Optimerad Tauri invoke med error handling
                if (window.__TAURI__?.invoke) {
                    window.__TAURI__.invoke('process_screen_selection_optimized', { bounds })
                        .then(() => {
                            console.log('✅ Fast selection processed successfully');
                            this.scheduleHide();
                        })
                        .catch(err => {
                            console.error('❌ Selection processing failed:', err);
                            // Fallback to original command if optimized fails
                            if (window.__TAURI__?.invoke) {
                                return window.__TAURI__.invoke('process_screen_selection', { bounds });
                            }
                        })
                        .catch(err => {
                            console.error('❌ Both selection methods failed:', err);
                        })
                        .finally(() => {
                            // Re-enable after delay regardless of success/failure
                            this.processingTimeout = setTimeout(() => {
                                this.isReady = true;
                            }, 200);
                        });
                } else {
                    console.error('❌ Tauri invoke not available');
                    this.isReady = true;
                }
            },
            
            scheduleHide: function() {
                // Hide overlay after short delay for smooth UX
                window.hideTimeout = setTimeout(() => {
                    if (window.__TAURI__?.invoke) {
                        window.__TAURI__.invoke('close_transparent_overlay_optimized')
                            .catch(err => console.error('Failed to hide overlay:', err));
                    }
                }, 150);
            }
        };
        
        // Close button functionality
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('❌ Close button clicked');
            if (window.__TAURI__?.invoke) {
                window.__TAURI__.invoke('close_transparent_overlay_optimized')
                    .catch(() => window.close()); // Fallback
            } else {
                window.close();
            }
        });
        
        // Enhanced mouse event handlers
        document.addEventListener('mousedown', (e) => {
            if (e.target === closeButton) return;
            
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
            
            // Hide instructions during selection
            instructions.classList.add('fade-out');
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
            
            // Update size indicator with better formatting
            sizeIndicator.textContent = `${Math.round(width)} × ${Math.round(height)}`;
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!dragging) return;
            dragging = false;
            
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            const left = Math.min(startX, e.clientX);
            const top = Math.min(startY, e.clientY);
            
            console.log('✅ Selection completed:', { left, top, width, height });
            
            // Process selection through fast selection system
            window.fastSelection.completedSelection({
                x: Math.round(left),
                y: Math.round(top),
                width: Math.round(width),
                height: Math.round(height)
            });
        });
        
        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('⏹️ Escape pressed - closing overlay');
                if (window.__TAURI__?.invoke) {
                    window.__TAURI__.invoke('close_transparent_overlay_optimized')
                        .catch(() => window.close());
                } else {
                    window.close();
                }
            }
        });
        
        // Cleanup function for proper resource management
        window.addEventListener('beforeunload', () => {
            if (window.hideTimeout) clearTimeout(window.hideTimeout);
            if (window.fastSelection.processingTimeout) {
                clearTimeout(window.fastSelection.processingTimeout);
            }
        });
        
        console.log('✅ Enhanced overlay with pooling support ready!');
    </script>
</body>
</html>"#.to_string()
    }
}

impl Default for OverlayManager {
    fn default() -> Self {
        Self::new()
    }
} 