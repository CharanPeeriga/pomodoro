import { Icon } from "../components/Icon";
import { DECOR, Screen } from "../components/Screen";
import { PomodoroDots } from "../components/TaskList";
import { api, run } from "../lib/api";
import { sessionStats } from "../lib/stats";
import type { OverlayView, Session } from "../lib/types";
import { shapeStyle, type ShapeName } from "../theme/shapes";

function Stat({ shape, tone, value, label }: { shape: ShapeName; tone: string; value: string; label: string }) {
  return (
    <div className={`stat stat-${tone}`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <path className="spin-slow" style={shapeStyle(shape)} />
      </svg>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function SessionStats({ session }: { session: Session }) {
  const stats = sessionStats(session);
  return (
    <div className="stats">
      <Stat shape="cookie9" tone="primary" value={String(stats.pomodoros)} label="pomodoros" />
      <Stat shape="clover" tone="tertiary" value={String(stats.focusMinutes)} label="focus min" />
      <Stat shape="flower" tone="secondary" value={`${stats.tasksDone}/${stats.tasksTotal}`} label="tasks done" />
    </div>
  );
}

export function SessionTasks({ session }: { session: Session }) {
  return (
    <ul className="summary-tasks">
      {session.tasks.map((task) => (
        <li key={task.id} className={task.done ? "done" : ""}>
          <span className="summary-mark">
            <Icon name={task.done ? "check" : "remove"} size={16} />
          </span>
          <span className="truncate">{task.title}</span>
          <PomodoroDots count={session.pomodoros.filter((p) => p.taskId === task.id).length} />
        </li>
      ))}
    </ul>
  );
}

export function SummaryView({ session, onOpen }: { session: Session; onOpen: (view: OverlayView) => void }) {
  return (
    <Screen
      decor={DECOR.summary}
      overline="Session complete"
      footer={
        <>
          <button className="m3-button filled large" onClick={() => run(api.newSession())}>
            <Icon name="add" />
            New session
          </button>
          <button className="m3-button tonal" onClick={() => onOpen("history")}>
            <Icon name="history" size={18} />
            History
          </button>
        </>
      }
    >
      <h1 className="headline">
        Nice
        <br />
        work.
      </h1>
      <SessionStats session={session} />
      <div className="scroll">
        <SessionTasks session={session} />
      </div>
    </Screen>
  );
}
