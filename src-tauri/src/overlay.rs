//! Window modes: centered card vs. corner overlay (mini / expanded).
//!
//! The overlay is tracked by the top-left of the *mini* pill (`mini_pos`). Expanded mode grows
//! away from the nearest screen corner, so its window position is `mini_pos + expand_offset`.

use serde::Deserialize;
use std::{sync::Mutex, thread, time::Duration};
use tauri::{
    AppHandle, LogicalSize, Manager, Monitor, PhysicalPosition, PhysicalSize, State, WebviewWindow,
    Window,
};

use crate::{commands::SettingsState, store};

const CENTER_SIZE: (f64, f64) = (480.0, 640.0);
const MINI_SIZE: (f64, f64) = (236.0, 74.0);
const EXPANDED_SIZE: (f64, f64) = (320.0, 268.0);
const EDGE_MARGIN: f64 = 16.0;
const SAVE_DEBOUNCE: Duration = Duration::from_millis(500);

#[derive(Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Center,
    Mini,
    Expanded,
}

pub struct OverlayState(Mutex<Inner>);

struct Inner {
    mode: Mode,
    mini_pos: Option<PhysicalPosition<i32>>,
    expand_offset: (i32, i32),
    /// True while we move/resize the window ourselves, so `Moved` events are ignored.
    applying: bool,
    /// Bumped on every user move; a pending save only runs if it's still the latest.
    save_generation: u64,
}

impl OverlayState {
    pub fn new(saved: Option<store::Position>) -> Self {
        Self(Mutex::new(Inner {
            mode: Mode::Center,
            mini_pos: saved.map(|p| PhysicalPosition::new(p.x, p.y)),
            expand_offset: (0, 0),
            applying: false,
            save_generation: 0,
        }))
    }
}

#[tauri::command]
pub fn set_mode(
    window: WebviewWindow,
    state: State<'_, OverlayState>,
    mode: Mode,
) -> Result<(), String> {
    state.0.lock().unwrap().applying = true;
    let result = apply_mode(&window, &state, mode);
    state.0.lock().unwrap().applying = false;
    result.map_err(|e| e.to_string())
}

fn apply_mode(window: &WebviewWindow, state: &OverlayState, mode: Mode) -> tauri::Result<()> {
    if mode == Mode::Center {
        state.0.lock().unwrap().mode = Mode::Center;
        window.set_always_on_top(false)?;
        window.set_size(LogicalSize::new(CENTER_SIZE.0, CENTER_SIZE.1))?;
        window.center()?;
        return Ok(());
    }

    let saved = state.0.lock().unwrap().mini_pos;
    let monitor = monitor_for(window, saved)?;
    let scale = monitor.scale_factor();
    let mini = physical(MINI_SIZE, scale);
    let mini_pos = clamp_to_work_area(saved, mini, &monitor);

    let (size, offset) = match mode {
        Mode::Expanded => {
            let expanded = physical(EXPANDED_SIZE, scale);
            (expanded, expand_offset(mini_pos, mini, expanded, &monitor))
        }
        _ => (mini, (0, 0)),
    };

    {
        let mut s = state.0.lock().unwrap();
        s.mode = mode;
        s.mini_pos = Some(mini_pos);
        s.expand_offset = offset;
    }

    window.set_always_on_top(true)?;
    window.set_size(size)?;
    window.set_position(PhysicalPosition::new(
        mini_pos.x + offset.0,
        mini_pos.y + offset.1,
    ))?;
    Ok(())
}

/// Called for every window move. Tracks user drags of the overlay and persists the position.
pub fn on_moved(window: &Window, pos: PhysicalPosition<i32>) {
    let app = window.app_handle().clone();
    let generation = {
        let state = app.state::<OverlayState>();
        let mut s = state.0.lock().unwrap();
        if s.applying || s.mode == Mode::Center {
            return;
        }
        s.mini_pos = Some(PhysicalPosition::new(
            pos.x - s.expand_offset.0,
            pos.y - s.expand_offset.1,
        ));
        s.save_generation += 1;
        s.save_generation
    };

    thread::spawn(move || {
        thread::sleep(SAVE_DEBOUNCE);
        save_position_if_latest(&app, generation);
    });
}

fn save_position_if_latest(app: &AppHandle, generation: u64) {
    let pos = {
        let state = app.state::<OverlayState>();
        let s = state.0.lock().unwrap();
        if s.save_generation != generation {
            return;
        }
        s.mini_pos
    };
    let settings = app.state::<SettingsState>();
    let mut settings = settings.0.lock().unwrap();
    settings.overlay_position = pos.map(|p| store::Position { x: p.x, y: p.y });
    store::save_settings(app, &settings);
}

fn physical((w, h): (f64, f64), scale: f64) -> PhysicalSize<u32> {
    PhysicalSize::new((w * scale).round() as u32, (h * scale).round() as u32)
}

/// The monitor containing `pos`, falling back to the primary (or current) monitor.
fn monitor_for(
    window: &WebviewWindow,
    pos: Option<PhysicalPosition<i32>>,
) -> tauri::Result<Monitor> {
    if let Some(p) = pos {
        for m in window.available_monitors()? {
            let wa = m.work_area();
            let (x, y) = (wa.position.x, wa.position.y);
            let (w, h) = (wa.size.width as i32, wa.size.height as i32);
            if p.x >= x && p.x < x + w && p.y >= y && p.y < y + h {
                return Ok(m);
            }
        }
    }
    let monitor = match window.primary_monitor()? {
        Some(m) => Some(m),
        None => window.current_monitor()?,
    };
    monitor.ok_or_else(|| tauri::Error::WindowNotFound)
}

/// Keeps the mini pill fully on screen; defaults to the top-right corner.
fn clamp_to_work_area(
    pos: Option<PhysicalPosition<i32>>,
    size: PhysicalSize<u32>,
    monitor: &Monitor,
) -> PhysicalPosition<i32> {
    let wa = monitor.work_area();
    let margin = (EDGE_MARGIN * monitor.scale_factor()).round() as i32;
    let min_x = wa.position.x;
    let min_y = wa.position.y;
    let max_x = wa.position.x + wa.size.width as i32 - size.width as i32;
    let max_y = wa.position.y + wa.size.height as i32 - size.height as i32;

    match pos {
        Some(p) => PhysicalPosition::new(p.x.clamp(min_x, max_x), p.y.clamp(min_y, max_y)),
        None => PhysicalPosition::new(max_x - margin, min_y + margin),
    }
}

/// Offset from the mini position so the expanded window grows away from the nearest corner.
fn expand_offset(
    mini_pos: PhysicalPosition<i32>,
    mini: PhysicalSize<u32>,
    expanded: PhysicalSize<u32>,
    monitor: &Monitor,
) -> (i32, i32) {
    let wa = monitor.work_area();
    let center_x = mini_pos.x + mini.width as i32 / 2;
    let center_y = mini_pos.y + mini.height as i32 / 2;
    let on_right = center_x > wa.position.x + wa.size.width as i32 / 2;
    let on_bottom = center_y > wa.position.y + wa.size.height as i32 / 2;
    let dx = if on_right {
        mini.width as i32 - expanded.width as i32
    } else {
        0
    };
    let dy = if on_bottom {
        mini.height as i32 - expanded.height as i32
    } else {
        0
    };
    (dx, dy)
}
