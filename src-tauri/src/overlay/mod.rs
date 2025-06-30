pub mod screen_capture;
pub mod selection_overlay;

pub use screen_capture::{ScreenCapture, CaptureBounds, CaptureResult, ScreenInfo};
pub use selection_overlay::{SelectionOverlay, SelectionResult, MousePosition, SelectionState, get_overlay}; 