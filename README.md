# Pomodoro

A tiny pomodoro timer that floats in the corner of your screen, above every app. In focus mode it shows
only two things: the time left and the task you're on. Hover to see more.

- Plan a session: list your tasks, set work/break lengths (plus optional long breaks).
- Pick one task per pomodoro. The overlay sits in a corner; drag it anywhere.
- Hover (or click to pin) for intervals, the next task, and pause / skip / +5 min / end.
- Breaks come to the center: check off what you finished and queue the next task. If you queue one,
  the next pomodoro starts on its own.
- Session summary and history, 9 color themes, adjustable overlay opacity, chime on phase changes,
  and a global show/hide shortcut (Ctrl+Alt+P on Windows, ⌘⌥P on macOS).

## Install

Get the installer from this repo's **Releases** page (or from whoever shared it with you).

### Windows 10/11

1. Run `Pomodoro_<version>_x64-setup.exe`. It installs for your user only (no admin needed).
2. Windows SmartScreen may say it "protected your PC" because the app isn't code-signed. Click
   **More info → Run anyway**.
3. Launch **Pomodoro** from the Start menu. Uninstall it from *Settings → Apps* like any other app.

### macOS 11+

1. Open `Pomodoro_<version>_universal.dmg` (works on Apple Silicon and Intel) and drag **Pomodoro** into
   **Applications**.
2. The app isn't notarized, so the first time, **right-click Pomodoro → Open → Open**. After that it
   opens normally.
3. If macOS says the app "is damaged", run this once in Terminal, then open it again:
   `xattr -cr /Applications/Pomodoro.app`

## Using it

| Where | What you can do |
|---|---|
| Setup | Type tasks one per line, set durations, **Start session** |
| Pick task | Click a task to start a pomodoro; add, remove, or check off tasks |
| Corner overlay | Hover to expand, click to pin; drag to move; **Next** queues a task; tune icon opens Settings |
| Break | Check off the task you just did; queue what's next; **Start now** skips the rest of the break |
| Tray / menu bar icon | New session, Show/Hide, History, Settings, Quit |

The app stays running in the tray when its window is hidden. Use **Quit** from the tray icon to close it.

## Your data

Everything stays on your computer. Nothing is uploaded. The app saves three JSON files in your user
profile:

| OS | Folder |
|---|---|
| Windows | `%APPDATA%\com.charan.pomodoro\` |
| macOS | `~/Library/Application Support/com.charan.pomodoro/` |

- `settings.json`: theme, opacity, sound, shortcut, default durations, overlay position
- `current_session.json`: the session in progress, so it picks up where you left off after a restart
- `history.json`: finished sessions

The files aren't inside the app, so reinstalling or updating keeps your history. To reset everything,
quit the app and delete that folder.

## Build from source

Prerequisites: [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (stable), and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (on Windows: the Visual
Studio C++ Build Tools; on macOS: Xcode Command Line Tools).

```sh
npm install
npm run tauri dev      # run in development
npm run tauri build    # build an installer into src-tauri/target/release/bundle/
```

On Windows, run these from PowerShell or cmd, not WSL. A WSL build produces a Linux app.

Tests:

```sh
cd src-tauri && cargo test --lib   # session engine unit tests
node tests/e2e.mjs                 # end-to-end UI test; see the header of that file first
```

### Release builds via GitHub Actions

`.github/workflows/build.yml` builds the Windows installer and a universal macOS `.dmg` and attaches
both to a **draft release**. Run it from the **Actions** tab (*Build → Run workflow*) or push a version
tag:

```sh
git tag v0.1.0 && git push origin v0.1.0
```

Then open the draft on the Releases page, check it, and publish it. Bump `version` in
`src-tauri/tauri.conf.json` (and `package.json`) before each new release.

## Tech

Tauri v2 (Rust) with React and TypeScript. The UI follows Material 3 Expressive, with shapes generated
in code. Project notes for contributors and AI agents are in [`agents/`](agents/README.md).
