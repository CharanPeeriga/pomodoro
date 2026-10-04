# Architecture

## Environment facts (verified 2026-10-04)
- Repo: `C:\Users\chara\Projects\pomodoro` (WSL path `/mnt/c/Users/chara/Projects/pomodoro`).
- Windows 11 (build 26200). Node v22.14.0 + npm on Windows. winget available.
- WebView2 runtime: installed.
- Rust: 1.99 stable-x86_64-pc-windows-msvc (installed 2026-10-04 via winget rustup; binaries in `%USERPROFILE%\.cargo\bin`).
- MSVC C++ Build Tools: VS 2022 Build Tools, MSVC 14.44, Win SDK 10.0.26100 (installed 2026-10-04) with the
  "Desktop development with C++" workload (VCTools + Windows SDK).
- **Build and run from the Windows side** (PowerShell, or `cmd.exe /c ...` / `powershell.exe` from WSL).
  Linux toolchains in WSL would produce a Linux app rendered via WSLg — not a real Windows overlay.
  `node_modules` and `src-tauri/target` must be created by Windows tools.

## Stack (CONFIRMED)
- **Tauri v2** (Rust backend, WebView2 frontend)
- **React + TypeScript + Vite** frontend
- Tauri plugins (expected): `global-shortcut` (hotkey), `store` or hand-rolled serde JSON (persistence).
  Tray via Tauri's built-in `tray-icon` feature. Taskbar flash via
  `Window::request_user_attention(Some(UserAttentionType::Informational))`.
- Sound: an audio file played by the frontend (`HTMLAudioElement`), gated by settings.
- Tests: Rust unit tests for the session engine (`cargo test`); Vitest for any pure TS logic.

## Window model
One main window, re-shaped per mode by the backend (`set_size`, `set_position`, `set_always_on_top`).
Config: `transparent: true`, `decorations: false`, `shadow: false`, `skipTaskbar: false` (taskbar
icon is wanted). CSS draws the pill; html/body background transparent.

| Mode | Size (approx, logical px) | Position | Always on top |
|---|---|---|---|
| Setup / Pick / Break / Summary / History / Settings | ~480×600 | centered on current monitor | no (normal window, opaque card) |
| Mini | ~220×56 | saved position (default top-right, 16px margin) | yes |
| Expanded | ~300×200 | grows from the nearest screen corner of the Mini so it doesn't jump | yes |

- Drag: `data-tauri-drag-region` on the pill body, interactive elements excluded; or call
  `getCurrentWindow().startDragging()` on mousedown so hover/click logic stays in our control.
- Hover: renderer `mouseenter` → 400ms timer → `set_mode("expanded")`; `mouseleave` (debounced
  ~300ms) → back to mini unless pinned. Click toggles pin.
- Position saved on window move-end; clamped to the current monitor's work area on restore
  (multi-monitor / DPI changes).
- Note: on Windows, "above fullscreen apps" works for borderless-fullscreen apps; exclusive
  fullscreen games can still cover it. Acceptable for v1.

## Responsibilities
- **Rust backend (source of truth):** session state machine, timer, phase transitions, auto-start
  rule, long-break scheduling, persistence, window mode changes, tray, hotkey, taskbar flash.
  Emits `state://update` events (snapshot) ~every 250ms while running and on every change.
- **Frontend:** pure view. Renders the snapshot for the current mode, sends commands via `invoke`:
  `start_session`, `pick_task`, `set_next_task`, `mark_completed`, `add_task`, `remove_task`,
  `pause`, `resume`, `skip_phase`, `extend_phase(minutes)`, `end_session`, `set_mode`,
  `get_history`, `get_settings`, `update_settings`. Plays the chime when a phase-end event arrives.

## Timer approach
- Store `phase_ends_at` (epoch ms). Remaining = `phase_ends_at - now`.
- Pause stores `remaining_ms`; resume sets `phase_ends_at = now + remaining_ms`. +5 min adds to whichever applies.
- Background tokio task ticks every 250ms; on phase end it transitions and emits an alert event.
- After sleep/resume the next tick detects an overdue phase and transitions correctly.

## Session state machine
```
 SETUP ──start──▶ PICKING ──pick──▶ WORK ──time up / skip──▶ BREAK (short or long, centered)
   ▲                 ▲                                           │
   │                 └──── break ends, no next task picked ──────┤
   │                                                             │
   │                       break ends, next task picked ─────────┴──▶ WORK (auto-start)
   │
   └── new session ◀── SUMMARY ◀── end session (any running phase; also prompted when all tasks done)
```
- Long break: break after pomodoro k is long iff `k % long_break_every == 0`.
- Break end: if `completed` unanswered → treated as false; task stays in pool.

## Data model (sketch — mirrored in Rust structs + TS types)
```ts
interface Task { id: string; title: string; done: boolean; createdAt: number }

interface Pomodoro {
  id: string; taskId: string;
  workStartedAt: number; workEndedAt?: number;
  breakKind?: 'short' | 'long'; breakEndedAt?: number;
  completed?: boolean;
}

interface Session {
  id: string; startedAt: number; endedAt?: number;
  workMinutes: number; breakMinutes: number;
  longBreakEvery: number; longBreakMinutes: number;
  tasks: Task[]; pomodoros: Pomodoro[];
  currentTaskId?: string; nextTaskId?: string;
}

type Phase = 'setup' | 'picking' | 'work' | 'break' | 'summary';
type UiMode = 'center' | 'mini' | 'expanded';

interface TimerState { phase: Phase; paused: boolean; phaseEndsAt?: number; remainingMs?: number }

interface Settings {
  soundEnabled: boolean;
  overlayOpacity: number;          // 0.4–1.0
  hotkey: string;                  // default "Ctrl+Alt+P"
  lastWorkMinutes: number;         // default 25
  lastBreakMinutes: number;        // default 5
  longBreakEvery: number;          // default 4
  longBreakMinutes: number;        // default 15
  overlayPosition?: { x: number; y: number; monitor?: string };
}
```

## Persistence (app data dir, e.g. `%APPDATA%\<bundle id>\`)
- `settings.json`, `current_session.json` (written on every state change, for crash recovery),
  `history.json` (array of finished sessions; split into per-session files if it grows).

## Folder layout
```
pomodoro/
  agents/                  # project context
  src/                     # React frontend
    views/                 # Setup, Pick, Mini, Expanded, Break, Summary, History, Settings
    components/
    lib/                   # invoke/event wrappers, types
    assets/                # chime sound
  src-tauri/
    src/
      main.rs / lib.rs     # app setup, tray, hotkey, commands
      session.rs           # state machine + timer (unit-tested)
      window.rs            # mode → size/position/flags
      store.rs             # JSON persistence
    tauri.conf.json
    capabilities/
  package.json
```
