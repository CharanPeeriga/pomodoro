# Project Scope — Mini Pomodoro Overlay

## Vision
A tiny, distraction-free pomodoro timer that floats as a translucent dark pill in a corner of the
screen, above every app. It shows only what matters right now: **time left** and **the current task**.
Setup, breaks, and transitions happen in a larger, centered view; focus time happens in the corner.

Target platform: **Windows** (user's laptop, Windows 11).

## Definitions
- **Session** — one full study/work block. Has a task list, work length, break length, long-break
  config, and contains many pomodoros. Starts at setup, ends when the user ends it.
- **Pomodoro** — one work interval + its following break (e.g. 30 min work + 5 min break).
  Each pomodoro is assigned **exactly one task**, picked before it starts.
- **Long break** — every N pomodoros the break is replaced by a longer one (configurable).
- **Task** — a line item for the session. Can span multiple pomodoros if not completed.

## Views (UI modes)

| Mode | Where | Shows | Interaction |
|---|---|---|---|
| **Setup** | Center | Task textarea (one per line), work min, break min, long break (every N, length) | Type, start |
| **Pick task** | Center | Remaining tasks; add/remove tasks | Click a task → work begins |
| **Mini (focus)** | Corner (default top-right), translucent dark pill, always-on-top | **Only** countdown + current task | Hover 400ms → Expanded; click → Expanded pinned; drag to move |
| **Expanded** | Same corner, slightly larger | Countdown, current task, work interval, break interval, **next task (pickable)**, controls: pause/resume, skip, +5 min, end session | Mouse leave → Mini (unless pinned) |
| **Break** | **Center** | Break countdown, "Did you complete *<task>*?" checkbox, next-task picker, add/remove tasks | If next task picked → auto-start work at break end; else wait for user |
| **Session summary** | Center | Pomodoros done, tasks completed vs not | Close / new session |
| **History** | Center | Past sessions: date, duration, pomodoros, tasks completed | Browse |
| **Settings** | Center | Sound on/off, overlay opacity, long-break defaults, hotkey | Edit |

## Core user flow
1. Launch → **Setup** in center (durations pre-filled from last session; first run 25/5).
2. Start → **Pick task** for pomodoro #1.
3. Work starts → window moves to corner → **Mini**.
4. Hover (400ms) → **Expanded**; click to pin. Can pick next task here.
5. Work ends → chime + taskbar flash → **Break** in center: completion checkbox, pick next task.
   - Unchecked / unanswered → task goes back to the pool.
6. Break ends → if a next task is picked, next pomodoro auto-starts; otherwise wait on the pick screen.
7. When all tasks are checked off → prompt "End session?". User can also end anytime.
8. **Summary** → saved to history.

## Global surfaces
- **Taskbar icon** (visible; flashes on phase end).
- **Tray icon** menu: New session, Show/Hide, History, Settings, Quit.
- **Global hotkey** (default Ctrl+Alt+P, configurable): show/hide overlay.

## v1 feature checklist
- [ ] Setup: multi-line tasks, work/break durations (remember last), long-break config
- [ ] Pick one task per pomodoro; incomplete tasks stay in the pool
- [ ] Corner overlay: transparent, frameless, always-on-top, translucent dark pill
- [ ] Mini = timer + task only
- [ ] Expanded on hover-delay / click-pin: intervals, next-task picker, pause/skip/+5/end
- [ ] Drag; position remembered; clamped to screen on restore
- [ ] Accurate timestamp-based timer (survives sleep)
- [ ] Centered break screen: completion checkbox, next-task picker, add/remove tasks
- [ ] Auto-start rule after break
- [ ] Long breaks every N pomodoros
- [ ] Chime + taskbar flash on phase end
- [ ] "All done?" prompt; manual end; summary
- [ ] History view (persisted sessions)
- [ ] Settings: sound, opacity, long-break defaults, hotkey
- [ ] Tray icon + taskbar icon
- [ ] Global hotkey show/hide
- [ ] Crash/restart recovery of the running session

## Later
- Stats/charts on history, themes, click-through, installer (.msi/.exe), autostart, remote repo

## Out of scope (v1)
- Accounts, cloud sync, mobile, macOS/Linux
