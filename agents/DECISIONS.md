# Decisions Log

Status: `CONFIRMED` (user agreed) · `PROPOSED` (agent recommendation, not yet agreed) · `REVERSED`

## Process
| # | Date | Decision | Status |
|---|---|---|---|
| 1 | 2026-10-04 | App lives in this repo; private GitHub remote CharanPeeriga/pomodoro (added 2026-10-04 on request) | CONFIRMED |
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
| 26 | 2026-10-04 | Visual style: agent designs it, user reviews ("surprise me") | REVERSED by #33 |
| 33 | 2026-10-04 | **Material 3 Expressive**, leaning HEAVILY into abstract shapes (cookie/clover/burst, shape morphing, wavy progress) | CONFIRMED |
| 34 | 2026-10-04 | ~~Tomato seed via `SchemeExpressive`~~ | REVERSED by #37 |
| 37 | 2026-10-04 | (superseded by #42 mapping) **Palette: #9CB080 sage, #618764 green, #2B5748 deep green, #273338 slate.** Pinned roles: primary=sage (work accent), secondary=green, tertiaryContainer=deep green, surfaceContainerLow=slate (card). Other roles = tones of those palettes; break accent = tertiary tone 80 (mint). See `src/theme/scheme.ts` | CONFIRMED |
| 35 | 2026-10-04 | Font: Roboto Flex variable (bundled via @fontsource, wide `wdth` for display/timer) | PROPOSED |
| 36 | 2026-10-04 | Mini overlay = shape that drains as time passes + task (small, top) + timer (large, below) | PROPOSED (shape is the timer's visual, not extra info) |

## Technical
| # | Date | Decision | Status |
|---|---|---|---|
| 27 | 2026-10-04 | **Tauri v2 + React + TypeScript + Vite**; install Rust + MSVC Build Tools as needed | CONFIRMED |
| 28 | 2026-10-04 | Windows + macOS (mac builds in GitHub Actions); no iOS/Android (overlay concept not possible there) | CONFIRMED |
| 29 | 2026-10-04 | Distribution: unsigned NSIS setup.exe (per-user) + unsigned universal .dmg via draft GitHub Releases; no app stores | CONFIRMED |
| 30 | 2026-10-04 | Rust backend owns timer/session state; timestamp-based timing | DONE |
| 31 | 2026-10-04 | JSON persistence in app config dir (current session, history, settings) | DONE |
| 32 | 2026-10-04 | Build/run via Windows toolchain, not WSL Linux | PROPOSED (technically required) |
| 38 | 2026-10-04 | Done tasks: any task can be checked off from pick/break lists; tasks with pomodoros can't be removed (check off instead) | DONE (agent call) |
| 39 | 2026-10-04 | Overlay "End" needs a second click within 3s ("Confirm") | DONE (agent call) |
| 40 | 2026-10-04 | Chime synthesized with Web Audio (descending at work end, ascending at break end); no audio assets | DONE (agent call) |
| 41 | 2026-10-04 | Theme presets in Settings (9: 6 user palettes + Dusk, Graphite, Plum); Forest default; picker at bottom of Settings | CONFIRMED |
| 42 | 2026-10-04 | Themes use exact swatch colors only — no derived tones or translucent blends (exceptions: one added dark bg for Periwinkle/Playful, hover layers, overlay-opacity setting) | CONFIRMED |
