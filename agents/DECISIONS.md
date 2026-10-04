# Decisions Log

Status: `CONFIRMED` (user agreed) · `PROPOSED` (agent recommendation, not yet agreed) · `REVERSED`

## Process
| # | Date | Decision | Status |
|---|---|---|---|
| 1 | 2026-10-04 | App lives in this repo; local git only, no remote yet | CONFIRMED |
| 2 | 2026-10-04 | No implementation until scope is agreed | CONFIRMED |
| 3 | 2026-10-04 | Context tracked in `agents/` folder | CONFIRMED |

## Product
| # | Date | Decision | Status |
|---|---|---|---|
| 4 | 2026-10-04 | Session ⊃ pomodoros; 1 pomodoro = work + break; exactly 1 task per pomodoro | CONFIRMED |
| 5 | 2026-10-04 | Mini mode shows ONLY timer + current task | CONFIRMED |
| 6 | 2026-10-04 | Expanded shows timer, task, work interval, break interval, next task, + controls | CONFIRMED |
| 7 | 2026-10-04 | Break screen appears in the **center** with completion checkbox | CONFIRMED |
| 8 | 2026-10-04 | When break ends: **auto-start** next pomodoro if a next task was picked; otherwise **wait** for user | CONFIRMED |
| 9 | 2026-10-04 | Expand on **hover with ~400ms delay**; **click pins** it open | CONFIRMED |
| 10 | 2026-10-04 | Next task can be **picked/changed while working** from Expanded mode (and during break) | CONFIRMED |
| 11 | 2026-10-04 | Unchecked task returns to the pool; unanswered checkbox = not done | CONFIRMED |
| 12 | 2026-10-04 | Task list editable (add/remove) during breaks + pick-task screen only | CONFIRMED |
| 13 | 2026-10-04 | Durations: remember last used; first-run default 25/5 | CONFIRMED |
| 14 | 2026-10-04 | **Long breaks in v1**, configurable (every N pomodoros, length) | CONFIRMED |
| 15 | 2026-10-04 | Alerts: **chime sound + taskbar flash** (no toast, no pulse) | CONFIRMED |
| 16 | 2026-10-04 | App **has a taskbar icon** (needed for flash) **and** a tray icon | CONFIRMED |
| 17 | 2026-10-04 | Session end: manual anytime; prompt "End session?" when all tasks done | CONFIRMED |
| 18 | 2026-10-04 | **History view in v1** (past sessions + tasks completed) | CONFIRMED |
| 19 | 2026-10-04 | Expanded controls: pause/resume, skip phase, +5 min, end session | CONFIRMED |
| 20 | 2026-10-04 | **Settings panel in v1**: sound on/off, opacity, long-break config, hotkey | CONFIRMED |
| 21 | 2026-10-04 | **Global hotkey in v1**: show/hide overlay (default Ctrl+Alt+P, configurable) | CONFIRMED |
| 22 | 2026-10-04 | No autostart on Windows login | CONFIRMED |

## Look & feel
| # | Date | Decision | Status |
|---|---|---|---|
| 23 | 2026-10-04 | Overlay = **translucent dark pill** | CONFIRMED |
| 24 | 2026-10-04 | Default position **top-right**; draggable; position remembered | CONFIRMED |
| 25 | 2026-10-04 | No click-through | CONFIRMED |
| 26 | 2026-10-04 | Visual style: agent designs it, user reviews ("surprise me") | CONFIRMED |

## Technical
| # | Date | Decision | Status |
|---|---|---|---|
| 27 | 2026-10-04 | **Tauri v2 + React + TypeScript + Vite**; install Rust + MSVC Build Tools as needed | CONFIRMED |
| 28 | 2026-10-04 | Windows only for v1 | CONFIRMED (implied by Tauri/Windows setup; revisit if needed) |
| 29 | 2026-10-04 | Run in dev mode (`npm run tauri dev`) until v1 works; installer later | CONFIRMED |
| 30 | 2026-10-04 | Rust backend owns timer/session state; timestamp-based timing | PROPOSED |
| 31 | 2026-10-04 | JSON persistence in app data dir (current session, history, settings) | PROPOSED |
| 32 | 2026-10-04 | Build/run via Windows toolchain, not WSL Linux | PROPOSED (technically required) |
