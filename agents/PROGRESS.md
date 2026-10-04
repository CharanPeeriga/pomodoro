# Progress Log (append-only, newest at bottom)

## 2026-10-04
- Initialized local git repo (`main`), no remote.
- Created `agents/` context folder: scope, architecture (proposed), decisions, open questions, roadmap.
- Verified env: Windows Node v22.14.0 available; no Rust. Repo accessed from WSL at `/mnt/c/...`.
- **No code written** — waiting on user answers in `OPEN_QUESTIONS.md`.
- User answered all scoping questions → recorded in DECISIONS.md. Stack switched to **Tauri v2 + React + TS**.
- Env check: WebView2 ✅, winget ✅. Installed Rust 1.99 (stable-x86_64-pc-windows-msvc) and VS 2022 Build Tools (MSVC 14.44, Win SDK 10.0.26100). Toolchain ready for Tauri.
- Initial commit `3d4d8c7` (docs). Repo-local git identity set (GitHub no-reply email).
- **M1 started:** scaffolded Tauri v2 + React + TS (create-tauri-app, react-ts), removed opener plugin/demo.
  - `src-tauri/src/overlay.rs`: `set_mode(center|mini|expanded)` command; corner anchoring (expanded grows
    away from nearest screen corner); position tracked as mini top-left, clamped to monitor work area,
    default top-right; debounced save to `settings.json` on user drag.
  - `src-tauri/src/store.rs`: JSON settings in app config dir. `lib.rs`: tray (Show/Hide, Quit).
  - `src/App.tsx`: placeholder center card + overlay pill; hover 400ms expands, leave 300ms collapses,
    click pins/unpins, drag past 4px threshold via `startDragging()`.
  - User feedback: mini layout = small muted task on top, large timer below (mini 180×68, expanded 300×210).
- Builds on Windows (`npm run build`, `cargo build`), app launches via `npm run tauri dev`.
  Pending user verification: always-on-top over other apps, drag, position memory, tray.
- Dev tip: from WSL, prefix PowerShell with `$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path`
  (new cargo PATH isn't inherited yet).
- **UI moved to Material 3 Expressive** (user request: "lean VERY heavy into abstractness"):
  - `src/theme/scheme.ts` (runtime M3 color roles → `--md-sys-color-*`), `src/theme/shapes.ts`
    (polar-generated cookie/clover/flower/sunny/burst, same point count → CSS `d` morphing).
  - `src/components/`: `ShapeProgress` (shape drains clockwise), `WavyProgress` (flowing wave), `Icon`.
  - Center card: display type "Focus, in shape." + bold rotating decorative shapes. Overlay: mini 236×74,
    expanded 320×268 with wavy progress, work/break chips, next task, tonal Setup button.
  - Demo countdown in `App.tsx` is placeholder until M2 engine.
  - Note: `material-color-utilities` 0.4 has extensionless ESM imports — fine in Vite, breaks in plain Node (use tsx).
- Commit `996aa1c`: M1 scaffold + M3 UI.
- **Built the rest of v1 (uncommitted at time of writing):**
  - Rust: `session.rs` (pure state machine + timer, 8 unit tests: auto-start rule, long breaks,
    pause/extend, focus time, removal rules, end session), `commands.rs` (Tauri commands, 250ms timer
    thread, `state-changed`/`phase-ended` events, taskbar flash), `store.rs` (settings/current
    session/history JSON, atomic write), `hotkey.rs` (global-shortcut plugin), tray: New session /
    Show-Hide / History / Settings / Quit (emits `navigate`).
  - Frontend: `src/lib` (types, api, hooks, chime, stats), `src/components` (Screen + DECOR
    compositions, TaskList, Checkbox squircle→cookie morph, Switch, Stepper, NavActions),
    `src/views` (Setup, Picking, Overlay, Break, Summary, History, Settings, ConfirmNew).
  - App.tsx derives window mode from phase/view; grows window before render, shrinks after.
  - Palette switched to user's greens/slate (decision #37).
- Verified: `cargo test` 8/8, `npm run build` clean, Setup screen screenshot. Other screens not yet
  visually verified — needs a user run-through.
- User feedback round: replaced native `<select>` (unstyled OS popup overflowing the overlay) with an
  in-overlay M3 "Up next" picker; added settings icon (top-right) to the expanded overlay; added
  "Preview in corner" to opacity setting (window goes to mini for 4s showing the real pill; click to end).
- **Themes:** 6 presets in Settings (Forest default, Periwinkle, Midnight, Retro, Moon foam, Playful —
  user-supplied palettes). `ThemeSpec` pins swatches to surface/primary(work)/secondary/tertiary(break)
  roles; other roles are tones; on-colors picked by tone (>58 → dark text). `settings.theme` persisted
  in Rust; last theme cached in localStorage to avoid a first-paint flash.
- **E2E test** `tests/e2e.mjs` (WebView2 CDP, port 9333): 51/51 passing — setup, add/remove, pick,
  mini/expanded sizes, pin, next picker, pause/+5/resume, end-confirm timeout, break checkbox,
  auto-start, long break, wait-on-picking, real 60s timer expiry + focus time, tray confirm,
  all-done banner, summary stats, history, settings (sound/opacity/hotkey re-register), corner
  preview, every theme. Screenshots reviewed; fixed break decor overlapping settings icon,
  picking decor crowding add button, "1 pomodoros". User app data backed up and restored around the run.
- **Themes v2 (user: "palettes aren't exact"):** removed all derived tones. `ThemeSpec` now maps swatches
  1:1 onto roles (bg, raised, text, work/break/tonal + containers, outline, danger). Single-dark
  palettes outline raised items (`--md-sys-color-surface-border`) instead of filling. Periwinkle and
  Playful have no dark swatch → each has exactly one added near-black background (commented in code).
  Removed translucent blends from CSS/decor (solid fills; disabled = outlined; paused = accent color).
  Only remaining blends: hover state layers and the user's overlay-opacity setting.
- Added 3 palettes: Dusk (#2D3250 #424769 #7077A1 #F6B17A), Graphite (#222831 #393E46 #00ADB5 #EEEEEE),
  Plum (#2E073F #7A1CAC #AD49E1 #EBD3F8). 9 themes total. Theme picker moved to bottom of Settings.
- Re-verified: every theme screenshotted on setup/mini/expanded/break/summary; E2E 51/51.
- Created private GitHub repo https://github.com/CharanPeeriga/pomodoro and pushed `main`.
- **Distribution:** custom app icon (`app-icon.png`, cookie9 + elapsed wedge, Forest colors) → `tauri icon`.
  NSIS per-user installer (`bundle.targets: ["nsis"]`); local build OK: `Pomodoro_0.1.0_x64-setup.exe`
  (2.5 MB), release exe smoke-tested.
- **macOS support:** `macOSPrivateApi` + `macos-private-api` feature (transparent window), overlay
  `set_visible_on_all_workspaces` in mini/expanded (cfg macos), default hotkey Super+Alt+P on mac,
  hotkey shown as ⌘⌥ symbols in Settings. Mac code only compiles in CI (no Mac locally).
- `.github/workflows/build.yml`: windows-latest (nsis) + macos-latest (universal dmg) via tauri-action
  → draft release; runs `cargo test` first. README.md with install/data/build instructions.
