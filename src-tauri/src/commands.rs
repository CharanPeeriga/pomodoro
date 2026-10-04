//! Tauri commands, the timer thread, and side effects of phase transitions.

use std::{
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, State, UserAttentionType};

use crate::{
    hotkey,
    session::{AppState, Session, SessionConfig, Transition},
    store::{self, Settings},
};

const TICK: Duration = Duration::from_millis(250);

pub struct Engine(pub Mutex<AppState>);
pub struct SettingsState(pub Mutex<Settings>);

type CmdResult<T = ()> = Result<T, String>;

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Runs a state change, then persists and broadcasts the new state.
fn mutate<T>(
    app: &AppHandle,
    change: impl FnOnce(&mut AppState, u64) -> CmdResult<T>,
) -> CmdResult<T> {
    let engine = app.state::<Engine>();
    let (out, snapshot) = {
        let mut state = engine.0.lock().unwrap();
        let out = change(&mut state, now_ms())?;
        (out, state.clone())
    };
    store::save_state(app, &snapshot);
    let _ = app.emit("state-changed", &snapshot);
    Ok(out)
}

/// Alerts the user that a phase ended: frontend chime + taskbar flash.
fn on_transition(app: &AppHandle, transition: Transition) {
    let _ = app.emit("phase-ended", transition);
    if let Some(window) = app.get_webview_window("main") {
        if matches!(transition, Transition::WorkEnded { .. }) {
            let _ = window.show();
        }
        let _ = window.request_user_attention(Some(UserAttentionType::Informational));
    }
}

/// Background loop that advances the phase when the timer runs out.
pub fn spawn_timer(app: AppHandle) {
    thread::spawn(move || loop {
        thread::sleep(TICK);
        let engine = app.state::<Engine>();
        let tick = {
            let mut state = engine.0.lock().unwrap();
            state.tick(now_ms()).map(|t| (t, state.clone()))
        };
        if let Some((transition, snapshot)) = tick {
            store::save_state(&app, &snapshot);
            let _ = app.emit("state-changed", &snapshot);
            on_transition(&app, transition);
        }
    });
}

#[tauri::command]
pub fn get_state(engine: State<'_, Engine>) -> AppState {
    engine.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn start_session(
    app: AppHandle,
    settings: State<'_, SettingsState>,
    tasks: Vec<String>,
    config: SessionConfig,
) -> CmdResult {
    mutate(&app, |s, now| s.start_session(now, &tasks, config))?;
    let mut settings = settings.0.lock().unwrap();
    settings.last_work_minutes = config.work_minutes;
    settings.last_break_minutes = config.break_minutes;
    settings.long_break_every = config.long_break_every;
    settings.long_break_minutes = config.long_break_minutes;
    store::save_settings(&app, &settings);
    Ok(())
}

#[tauri::command]
pub fn pick_task(app: AppHandle, task_id: String) -> CmdResult {
    mutate(&app, |s, now| s.pick_task(now, &task_id))
}

#[tauri::command]
pub fn set_next_task(app: AppHandle, task_id: Option<String>) -> CmdResult {
    mutate(&app, |s, _| s.set_next_task(task_id.as_deref()))
}

#[tauri::command]
pub fn set_task_done(app: AppHandle, task_id: String, done: bool) -> CmdResult {
    mutate(&app, |s, _| s.set_task_done(&task_id, done))
}

#[tauri::command]
pub fn add_task(app: AppHandle, title: String) -> CmdResult<String> {
    mutate(&app, |s, _| s.add_task(&title))
}

#[tauri::command]
pub fn remove_task(app: AppHandle, task_id: String) -> CmdResult {
    mutate(&app, |s, _| s.remove_task(&task_id))
}

#[tauri::command]
pub fn pause(app: AppHandle) -> CmdResult {
    mutate(&app, |s, now| s.pause(now))
}

#[tauri::command]
pub fn resume(app: AppHandle) -> CmdResult {
    mutate(&app, |s, now| s.resume(now))
}

#[tauri::command]
pub fn extend_phase(app: AppHandle, minutes: u32) -> CmdResult {
    mutate(&app, |s, _| s.extend(minutes))
}

#[tauri::command]
pub fn skip_phase(app: AppHandle) -> CmdResult {
    let transition = mutate(&app, |s, now| s.skip(now))?;
    let _ = app.emit("phase-ended", transition);
    Ok(())
}

#[tauri::command]
pub fn end_session(app: AppHandle) -> CmdResult {
    let finished = mutate(&app, |s, now| s.end_session(now))?;
    store::append_history(&app, finished);
    Ok(())
}

#[tauri::command]
pub fn new_session(app: AppHandle) -> CmdResult {
    mutate(&app, |s, _| s.new_session())
}

#[tauri::command]
pub fn get_history(app: AppHandle) -> Vec<Session> {
    store::load_history(&app)
}

#[tauri::command]
pub fn get_settings(settings: State<'_, SettingsState>) -> Settings {
    settings.0.lock().unwrap().clone()
}

/// Replaces user-editable settings (the overlay position is owned by the window code).
#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    state: State<'_, SettingsState>,
    settings: Settings,
) -> CmdResult<Settings> {
    let mut current = state.0.lock().unwrap();
    if settings.hotkey != current.hotkey {
        if let Err(e) = hotkey::register(&app, &settings.hotkey) {
            let _ = hotkey::register(&app, &current.hotkey);
            return Err(format!("couldn't use that shortcut: {e}"));
        }
    }
    let position = current.overlay_position;
    *current = Settings {
        overlay_position: position,
        overlay_opacity: settings.overlay_opacity.clamp(0.4, 1.0),
        ..settings
    };
    store::save_settings(&app, &current);
    Ok(current.clone())
}
