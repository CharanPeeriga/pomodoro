// Mirrors the Rust types in src-tauri/src/session.rs and store.rs.

export type Phase = "setup" | "picking" | "work" | "break" | "summary";
export type BreakKind = "short" | "long";

export interface SessionConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakEvery: number;
  longBreakMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export interface Pomodoro {
  taskId: string;
  workStartedAt: number;
  workEndedAt: number | null;
  breakKind: BreakKind | null;
  breakEndedAt: number | null;
  completed: boolean | null;
  focusMs: number;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt: number | null;
  config: SessionConfig;
  tasks: Task[];
  pomodoros: Pomodoro[];
  currentTaskId: string | null;
  nextTaskId: string | null;
}

export interface Timer {
  endsAt: number | null;
  pausedRemaining: number | null;
  duration: number;
}

export interface AppState {
  phase: Phase;
  session: Session | null;
  timer: Timer;
}

export interface Settings {
  overlayPosition: { x: number; y: number } | null;
  soundEnabled: boolean;
  overlayOpacity: number;
  hotkey: string;
  lastWorkMinutes: number;
  lastBreakMinutes: number;
  longBreakEvery: number;
  longBreakMinutes: number;
  theme: string;
}

export type Transition =
  | { kind: "workEnded"; breakKind: BreakKind }
  | { kind: "breakEnded"; autoStarted: boolean };

export type WindowMode = "center" | "mini" | "expanded";

/** Center-screen views the user can open on top of the current phase. */
export type OverlayView = "history" | "settings" | "confirm-new";
