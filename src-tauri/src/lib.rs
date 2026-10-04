mod commands;
mod hotkey;
mod overlay;
mod session;
mod store;

use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    App, AppHandle, Emitter, Manager, WindowEvent,
};

use commands::{Engine, SettingsState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle();
            let settings = store::load_settings(handle);
            if let Err(e) = hotkey::register(handle, &settings.hotkey) {
                eprintln!("couldn't register hotkey {:?}: {e}", settings.hotkey);
            }
            app.manage(overlay::OverlayState::new(settings.overlay_position));
            app.manage(SettingsState(Mutex::new(settings)));
            app.manage(Engine(Mutex::new(store::load_state(handle))));
            commands::spawn_timer(handle.clone());
            build_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Moved(pos) = event {
                overlay::on_moved(window, *pos);
            }
        })
        .invoke_handler(tauri::generate_handler![
            overlay::set_mode,
            commands::get_state,
            commands::start_session,
            commands::pick_task,
            commands::set_next_task,
            commands::set_task_done,
            commands::add_task,
            commands::remove_task,
            commands::pause,
            commands::resume,
            commands::extend_phase,
            commands::skip_phase,
            commands::end_session,
            commands::new_session,
            commands::get_history,
            commands::get_settings,
            commands::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

/// Shows the window and asks the frontend to open a view ("setup", "history", "settings").
fn navigate(app: &AppHandle, view: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    let _ = app.emit("navigate", view);
}

fn build_tray(app: &App) -> tauri::Result<()> {
    let new_session = MenuItem::with_id(app, "new", "New session", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", "Show/Hide", true, None::<&str>)?;
    let history = MenuItem::with_id(app, "history", "History", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(
        app,
        &[&new_session, &toggle, &history, &settings, &separator, &quit],
    )?;

    let mut tray = TrayIconBuilder::new()
        .tooltip("Pomodoro")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "new" => navigate(app, "setup"),
            "toggle" => toggle_window(app),
            "history" => navigate(app, "history"),
            "settings" => navigate(app, "settings"),
            "quit" => app.exit(0),
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}
