import type { Session } from "./types";

export function sessionStats(session: Session) {
  const focusMs = session.pomodoros.reduce((sum, p) => sum + p.focusMs, 0);
  return {
    pomodoros: session.pomodoros.filter((p) => p.workEndedAt !== null).length,
    focusMinutes: Math.round(focusMs / 60_000),
    tasksDone: session.tasks.filter((t) => t.done).length,
    tasksTotal: session.tasks.length,
  };
}

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const formatDuration = (ms: number) => {
  const minutes = Math.round(ms / 60_000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};
