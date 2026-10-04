import { invoke } from "@tauri-apps/api/core";
import type { AppState, Session, SessionConfig, Settings, WindowMode } from "./types";

export const api = {
  setMode: (mode: WindowMode) => invoke<void>("set_mode", { mode }),
  getState: () => invoke<AppState>("get_state"),
  startSession: (tasks: string[], config: SessionConfig) =>
    invoke<void>("start_session", { tasks, config }),
  pickTask: (taskId: string) => invoke<void>("pick_task", { taskId }),
  setNextTask: (taskId: string | null) => invoke<void>("set_next_task", { taskId }),
  setTaskDone: (taskId: string, done: boolean) => invoke<void>("set_task_done", { taskId, done }),
  addTask: (title: string) => invoke<string>("add_task", { title }),
  removeTask: (taskId: string) => invoke<void>("remove_task", { taskId }),
  pause: () => invoke<void>("pause"),
  resume: () => invoke<void>("resume"),
  extendPhase: (minutes: number) => invoke<void>("extend_phase", { minutes }),
  skipPhase: () => invoke<void>("skip_phase"),
  endSession: () => invoke<void>("end_session"),
  newSession: () => invoke<void>("new_session"),
  getHistory: () => invoke<Session[]>("get_history"),
  getSettings: () => invoke<Settings>("get_settings"),
  updateSettings: (settings: Settings) => invoke<Settings>("update_settings", { settings }),
};

/** Fire-and-forget a command, logging failures (the backend rejects invalid transitions). */
export function run(promise: Promise<unknown>) {
  promise.catch((e) => console.error(e));
}
