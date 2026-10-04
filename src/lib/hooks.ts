import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "./api";
import type { AppState, Settings, Timer } from "./types";

/** Backend app state, kept in sync through the `state-changed` event. */
export function useAppState(): AppState | null {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => {
    const unlisten = listen<AppState>("state-changed", (e) => setState(e.payload));
    api.getState().then(setState).catch(console.error);
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);
  return state;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);
  return [settings, setSettings] as const;
}

/** Re-renders a few times a second and returns the countdown derived from the backend timer. */
export function useCountdown(timer: Timer | undefined) {
  const [now, setNow] = useState(() => Date.now());
  const running = !!timer?.endsAt && timer.pausedRemaining === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  if (!timer || (!timer.endsAt && timer.pausedRemaining === null)) {
    return { remainingMs: 0, fraction: 0, paused: false };
  }
  const remainingMs = timer.pausedRemaining ?? Math.max((timer.endsAt ?? 0) - now, 0);
  return {
    remainingMs,
    fraction: timer.duration > 0 ? remainingMs / timer.duration : 0,
    paused: timer.pausedRemaining !== null,
  };
}

export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
