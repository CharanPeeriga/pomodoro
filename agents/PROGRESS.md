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
