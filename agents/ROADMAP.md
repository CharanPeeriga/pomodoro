# Roadmap

## M0 — Scoping ✅ (2026-10-04)
- [x] Vision, definitions, flows, architecture, decisions
- [x] All open questions answered
- [x] Install toolchain: Rust (rustup, MSVC) + VS 2022 Build Tools (C++ workload)

## M1 — Skeleton + overlay proof
- [ ] Scaffold Tauri v2 + React + TS (`npm create tauri-app`), run from Windows
- [ ] Transparent frameless window with a dark pill; always-on-top over other apps
- [ ] Switch center ↔ corner; drag; remember position
- [ ] Tray icon (Quit, Show/Hide) + taskbar icon

## M2 — Session engine (Rust, unit-tested)
- [ ] Structs + serde; state machine incl. long breaks + auto-start rule
- [ ] Timestamp timer: pause/resume, skip, +5 min, sleep handling
- [ ] Events to frontend; commands from frontend
- [ ] Persistence: settings, current session (recovery), history

## M3 — Views
- [ ] Design mockup → user review (decision #26)
- [ ] Setup, Pick task
- [ ] Mini + Expanded (hover delay, click pin, next-task picker, controls)
- [ ] Break (center): checkbox, next task, add/remove tasks
- [ ] "All done?" prompt, Summary
- [ ] History, Settings

## M4 — Polish
- [ ] Chime + taskbar flash
- [ ] Global hotkey show/hide (configurable)
- [ ] Mode transition animations
- [ ] Multi-monitor / DPI edge cases

## M5 — Later
- [ ] Installer build, stats, themes, remote repo
