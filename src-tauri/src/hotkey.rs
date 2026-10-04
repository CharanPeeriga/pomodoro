//! Global show/hide shortcut.

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// Replaces any registered shortcut with `accelerator` (e.g. "Ctrl+Alt+P"). Empty disables it.
pub fn register(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    let shortcuts = app.global_shortcut();
    shortcuts.unregister_all().map_err(|e| e.to_string())?;
    if accelerator.trim().is_empty() {
        return Ok(());
    }
    shortcuts
        .on_shortcut(accelerator, |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                crate::toggle_window(app);
            }
        })
        .map_err(|e| e.to_string())
}
