use eframe::egui;

pub struct OverlayApp {
    pub selection_mode: bool,
    pub selection_start: Option<egui::Pos2>,
    pub selection_current: Option<egui::Pos2>,
    pub show_selection_box: bool,
}

impl Default for OverlayApp {
    fn default() -> Self {
        Self {
            selection_mode: false,
            selection_start: None,
            selection_current: None,
            show_selection_box: false,
        }
    }
}

impl eframe::App for OverlayApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Check if we're in selection mode
        if self.selection_mode {
            // In selection mode, make window fullscreen and transparent
            self.draw_selection_overlay(ctx);
        } else {
            // Normal overlay UI
            self.draw_normal_overlay(ctx);
        }
    }
}

impl OverlayApp {
    fn draw_normal_overlay(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default()
            .frame(egui::Frame::none().fill(egui::Color32::TRANSPARENT))
            .show(ctx, |ui| {
                // Create the main overlay container
                let available = ui.available_rect_before_wrap();
                let container_rect = egui::Rect::from_center_size(
                    available.center(),
                    egui::vec2(500.0, 60.0),
                );
                
                // Draw semi-transparent background
                ui.painter().rect_filled(
                    container_rect,
                    10.0, // rounding
                    egui::Color32::from_rgba_unmultiplied(30, 30, 30, 240),
                );
                
                // Draw border
                ui.painter().rect_stroke(
                    container_rect,
                    10.0,
                    egui::Stroke::new(1.0, egui::Color32::from_rgba_unmultiplied(255, 255, 255, 25)),
                );
                
                // Content area
                ui.allocate_ui_at_rect(container_rect, |ui| {
                    ui.horizontal_centered(|ui| {
                        ui.add_space(16.0);
                        
                        // Status indicator (green dot)
                        let dot_size = 12.0;
                        let dot_center = ui.cursor().min + egui::vec2(dot_size / 2.0, ui.available_height() / 2.0);
                        ui.painter().circle_filled(
                            dot_center,
                            dot_size / 2.0,
                            egui::Color32::from_rgb(0, 255, 136),
                        );
                        ui.add_space(dot_size + 8.0);
                        
                        // Text
                        ui.label(
                            egui::RichText::new("Ready to capture")
                                .color(egui::Color32::WHITE)
                                .size(16.0),
                        );
                        
                        ui.add_space(16.0);
                        
                        // Capture button
                        if ui.button(
                            egui::RichText::new("📸 Start Capture")
                                .color(egui::Color32::WHITE)
                                .size(14.0),
                        ).clicked() {
                            println!("🎯 Native overlay: Starting transparent capture mode!");
                            self.start_selection_mode();
                        }
                        
                        ui.add_space(16.0);
                    });
                });
            });
    }
    
    fn draw_selection_overlay(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default()
            .frame(egui::Frame::none().fill(egui::Color32::TRANSPARENT))
            .show(ctx, |ui| {
                let full_rect = ui.available_rect_before_wrap();
                
                // Very light transparent overlay
                ui.painter().rect_filled(
                    full_rect,
                    0.0,
                    egui::Color32::from_rgba_unmultiplied(255, 0, 0, 8),
                );
                
                // Handle mouse input for selection
                let response = ui.allocate_rect(full_rect, egui::Sense::click_and_drag());
                
                if response.drag_started() {
                    self.selection_start = response.interact_pointer_pos();
                    self.show_selection_box = true;
                    println!("🎯 Selection started at: {:?}", self.selection_start);
                }
                
                if response.dragged() {
                    self.selection_current = response.interact_pointer_pos();
                }
                
                if response.drag_stopped() {
                    if let (Some(start), Some(end)) = (self.selection_start, self.selection_current) {
                        let bounds = self.calculate_selection_bounds(start, end);
                        println!("✅ Selection completed: {:?}", bounds);
                        
                        // Show result (in a real app, this would trigger screen capture)
                        println!("📸 Would capture area: x={}, y={}, w={}, h={}", 
                                bounds.0, bounds.1, bounds.2, bounds.3);
                    }
                    
                    // Reset to normal mode
                    self.end_selection_mode();
                }
                
                // Draw selection box if active
                if self.show_selection_box {
                    if let (Some(start), Some(current)) = (self.selection_start, self.selection_current.or(self.selection_start)) {
                        self.draw_selection_box(ui, start, current);
                    }
                }
                
                // ESC to cancel
                if ctx.input(|i| i.key_pressed(egui::Key::Escape)) {
                    println!("❌ Selection cancelled with ESC");
                    self.end_selection_mode();
                }
            });
    }
    
    fn draw_selection_box(&self, ui: &mut egui::Ui, start: egui::Pos2, current: egui::Pos2) {
        let min_x = start.x.min(current.x);
        let max_x = start.x.max(current.x);
        let min_y = start.y.min(current.y);
        let max_y = start.y.max(current.y);
        
        let selection_rect = egui::Rect::from_min_max(
            egui::pos2(min_x, min_y),
            egui::pos2(max_x, max_y),
        );
        
        // Fill
        ui.painter().rect_filled(
            selection_rect,
            0.0,
            egui::Color32::from_rgba_unmultiplied(0, 255, 136, 25),
        );
        
        // Dashed border (approximated with multiple strokes)
        let stroke = egui::Stroke::new(2.0, egui::Color32::from_rgb(0, 255, 136));
        ui.painter().rect_stroke(selection_rect, 0.0, stroke);
    }
    
    fn calculate_selection_bounds(&self, start: egui::Pos2, end: egui::Pos2) -> (i32, i32, u32, u32) {
        let min_x = start.x.min(end.x) as i32;
        let min_y = start.y.min(end.y) as i32;
        let width = (start.x - end.x).abs() as u32;
        let height = (start.y - end.y).abs() as u32;
        
        (min_x, min_y, width, height)
    }
    
    fn start_selection_mode(&mut self) {
        self.selection_mode = true;
        self.selection_start = None;
        self.selection_current = None;
        self.show_selection_box = false;
    }
    
    fn end_selection_mode(&mut self) {
        self.selection_mode = false;
        self.selection_start = None;
        self.selection_current = None;
        self.show_selection_box = false;
    }
}

pub fn create_native_overlay() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Creating native egui overlay (no webview, no cache!)");
    
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([600.0, 80.0])
            .with_decorations(false)
            .with_transparent(true)
            .with_always_on_top()
            .with_resizable(false),
        ..Default::default()
    };
    
    eframe::run_native(
        "FrameSense Overlay",
        options,
        Box::new(|_cc| Ok(Box::new(OverlayApp::default()))),
    )?;
    
    Ok(())
} 