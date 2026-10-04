//! JSON persistence in the app config dir: settings, the running session (crash recovery),
//! and the history of finished sessions.

use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

use crate::session::{AppState, Session};

const SETTINGS_FILE: &str = "settings.json";
const STATE_FILE: &str = "current_session.json";
const HISTORY_FILE: &str = "history.json";

/// ⌘⌥P on macOS, Ctrl+Alt+P elsewhere.
#[cfg(target_os = "macos")]
const DEFAULT_HOTKEY: &str = "Super+Alt+P";
#[cfg(not(target_os = "macos"))]
const DEFAULT_HOTKEY: &str = "Ctrl+Alt+P";

/// Overlay position in physical pixels (top-left of the mini pill).
#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub overlay_position: Option<Position>,
    pub sound_enabled: bool,
    /// Overlay background opacity, 0.4–1.0.
    pub overlay_opacity: f64,
    /// Global show/hide shortcut; empty disables it.
    pub hotkey: String,
    pub last_work_minutes: u32,
    pub last_break_minutes: u32,
    pub long_break_every: u32,
    pub long_break_minutes: u32,
    /// Color theme id (see src/theme/scheme.ts).
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            overlay_position: None,
            sound_enabled: true,
            overlay_opacity: 0.84,
            hotkey: DEFAULT_HOTKEY.into(),
            last_work_minutes: 25,
            last_break_minutes: 5,
            long_break_every: 4,
            long_break_minutes: 15,
            theme: "forest".into(),
        }
    }
}

fn path(app: &AppHandle, file: &str) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|dir| dir.join(file))
}

fn load<T: DeserializeOwned + Default>(app: &AppHandle, file: &str) -> T {
    let Some(path) = path(app, file) else {
        return T::default();
    };
    let Ok(json) = fs::read_to_string(&path) else {
        return T::default();
    };
    serde_json::from_str(&json).unwrap_or_else(|e| {
        // Set the unreadable file aside so the next save can't destroy what's left in it.
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let backup = path.with_extension(format!("json.corrupt-{stamp}"));
        eprintln!("{file} is unreadable ({e}); moved to {}", backup.display());
        let _ = fs::rename(&path, backup);
        T::default()
    })
}

fn save<T: Serialize>(app: &AppHandle, file: &str, value: &T) {
    let Some(path) = path(app, file) else {
        return;
    };
    if let Some(dir) = path.parent() {
        let _ = fs::create_dir_all(dir);
    }
    if let Ok(json) = serde_json::to_string_pretty(value) {
        // Write-then-rename so a crash mid-write can't corrupt the file.
        let tmp = path.with_extension("json.tmp");
        if fs::write(&tmp, json).is_ok() {
            let _ = fs::rename(tmp, path);
        }
    }
}

pub fn load_settings(app: &AppHandle) -> Settings {
    load(app, SETTINGS_FILE)
}

pub fn save_settings(app: &AppHandle, settings: &Settings) {
    save(app, SETTINGS_FILE, settings);
}

pub fn load_state(app: &AppHandle) -> AppState {
    load(app, STATE_FILE)
}

pub fn save_state(app: &AppHandle, state: &AppState) {
    save(app, STATE_FILE, state);
}

pub fn load_history(app: &AppHandle) -> Vec<Session> {
    load(app, HISTORY_FILE)
}

pub fn append_history(app: &AppHandle, session: Session) {
    let mut history = load_history(app);
    history.push(session);
    save(app, HISTORY_FILE, &history);
}
