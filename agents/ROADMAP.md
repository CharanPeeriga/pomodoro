# Roadmap

## M0 — Scoping ✅ (2026-10-04)
- [x] Vision, definitions, flows, architecture, decisions
- [x] All open questions answered
- [x] Install toolchain: Rust (rustup, MSVC) + VS 2022 Build Tools (C++ workload)

## M1 — Skeleton + overlay proof
- [x] Scaffold Tauri v2 + React + TS (`npm create tauri-app`), run from Windows
- [x] Transparent frameless window with a dark pill; always-on-top over other apps
- [x] Switch center ↔ corner; drag; remember position
- [x] Tray icon (Quit, Show/Hide) + taskbar icon

## M2 — Session engine (Rust, unit-tested)
- [x] Structs + serde; state machine incl. long breaks + auto-start rule
- [x] Timestamp timer: pause/resume, skip, +5 min, sleep handling
- [x] Events to frontend; commands from frontend
- [x] Persistence: settings, current session (recovery), history

## M3 — Views
- [x] Design mockup → user review (decision #26)
- [x] Setup, Pick task
- [x] Mini + Expanded (hover delay, click pin, next-task picker, controls)
- [x] Break (center): checkbox, next task, add/remove tasks
- [x] "All done?" prompt, Summary
- [x] History, Settings

## M3.5 — Verify (user)
- [x] Full flow test on Windows: setup → work → break (auto-start + wait) → long break → summary → history (tests/e2e.mjs)
- [x] Hotkey re-register, tray navigate events (via emit), settings persistence
- [ ] Not automatable: audible chime, taskbar flash, physical hotkey press, kill/restart recovery (observed working once by user)

## M4 — Polish
- [x] Chime + taskbar flash
- [x] Global hotkey show/hide (configurable)
- [ ] Mode transition animations
- [ ] Multi-monitor / DPI edge cases

## M5 — Later
- [ ] Installer build, stats, themes, remote repo
