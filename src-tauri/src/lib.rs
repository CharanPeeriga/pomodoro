mod overlay;
mod store;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let settings = store::load_settings(app.handle());
            app.manage(overlay::OverlayState::new(settings.overlay_position));
            build_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Moved(pos) = event {
                overlay::on_moved(window, *pos);
            }
        })
        .invoke_handler(tauri::generate_handler![overlay::set_mode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_tray(app: &App) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Show/Hide", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &quit])?;

    let mut tray = TrayIconBuilder::new()
        .tooltip("Pomodoro")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "quit" => app.exit(0),
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}
