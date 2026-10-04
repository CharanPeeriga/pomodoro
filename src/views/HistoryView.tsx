import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { DECOR, Screen } from "../components/Screen";
import { api } from "../lib/api";
import { formatDate, formatDuration, sessionStats } from "../lib/stats";
import type { Session } from "../lib/types";
import { shapeStyle } from "../theme/shapes";
import { SessionStats, SessionTasks } from "./SummaryView";

export function HistoryView({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHistory()
      .then((h) => setSessions([...h].reverse()))
      .catch(console.error);
  }, []);

  return (
    <Screen
      decor={DECOR.quiet}
      overline="History"
      actions={
        <button className="icon-button standard" aria-label="Back" onClick={onBack}>
          <Icon name="arrowBack" size={20} />
        </button>
      }
    >
      <h1 className="headline">
        Past
        <br />
        sessions.
      </h1>
      <div className="scroll">
        {sessions?.length === 0 && (
          <div className="empty">
            <svg viewBox="0 0 100 100" aria-hidden>
              <path className="spin-slow" style={shapeStyle("burst")} />
            </svg>
            <span className="muted">Finished sessions show up here.</span>
          </div>
        )}
        <ul className="history-list">
          {sessions?.map((session) => {
            const stats = sessionStats(session);
            const open = openId === session.id;
            const length = (session.endedAt ?? session.startedAt) - session.startedAt;
            return (
              <li key={session.id} className={`history-item${open ? " open" : ""}`}>
                <button className="history-summary" onClick={() => setOpenId(open ? null : session.id)}>
                  <svg className="history-shape" viewBox="0 0 100 100" aria-hidden>
                    <path className="morph" style={shapeStyle(open ? "flower" : "cookie9")} />
                  </svg>
                  <span className="history-text">
                    <span className="history-date">{formatDate(session.startedAt)}</span>
                    <span className="muted">
                      {formatDuration(length)} · {stats.pomodoros} pomodoro{stats.pomodoros === 1 ? "" : "s"} ·{" "}
                      {stats.tasksDone}/{stats.tasksTotal} tasks
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="history-details">
                    <SessionStats session={session} />
                    <SessionTasks session={session} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
}
