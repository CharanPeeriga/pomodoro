import { useState } from "react";
import { api, run } from "../lib/api";
import type { Session, Task } from "../lib/types";
import { shapeStyle } from "../theme/shapes";
import { Checkbox } from "./controls";
import { Icon } from "./Icon";

const pomodoroCount = (session: Session, taskId: string) =>
  session.pomodoros.filter((p) => p.taskId === taskId).length;

/**
 * Task list for the pick and break screens. Open tasks are selectable rows; finished tasks
 * collapse underneath. Tasks never worked on can be removed.
 */
export function TaskList({
  session,
  selectedId,
  excludeId,
  onSelect,
  selectHint,
}: {
  session: Session;
  selectedId?: string | null;
  /** Task to leave out of the open list (e.g. the one just worked on, shown separately). */
  excludeId?: string | null;
  onSelect: (task: Task) => void;
  selectHint: string;
}) {
  const open = session.tasks.filter((t) => !t.done && t.id !== excludeId);
  const done = session.tasks.filter((t) => t.done && t.id !== excludeId);

  return (
    <div className="task-list">
      {open.length === 0 && <p className="task-empty muted">No open tasks. Add one below.</p>}
      {open.map((task) => {
        const count = pomodoroCount(session, task.id);
        const selected = task.id === selectedId;
        return (
          <div key={task.id} className={`task-row${selected ? " selected" : ""}`}>
            <Checkbox
              checked={false}
              label={`Mark ${task.title} done`}
              onChange={() => run(api.setTaskDone(task.id, true))}
            />
            <button className="task-select" onClick={() => onSelect(task)}>
              <svg className="task-bullet" viewBox="0 0 100 100" aria-hidden>
                <path className="morph" style={shapeStyle(selected ? "flower" : "circle")} />
              </svg>
              <span className="task-title truncate">{task.title}</span>
              {count > 0 && <PomodoroDots count={count} />}
              <span className="task-hint">{selected ? "Selected" : selectHint}</span>
            </button>
            {count === 0 && (
              <button
                className="icon-button standard small"
                aria-label={`Remove ${task.title}`}
                onClick={() => run(api.removeTask(task.id))}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        );
      })}

      {done.length > 0 && (
        <>
          <span className="section-label">Done</span>
          {done.map((task) => (
            <div key={task.id} className="task-row done">
              <Checkbox
                checked
                label={`Mark ${task.title} not done`}
                onChange={() => run(api.setTaskDone(task.id, false))}
              />
              <span className="task-title truncate">{task.title}</span>
              <PomodoroDots count={pomodoroCount(session, task.id)} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/** One tiny cookie per pomodoro spent on a task. */
export function PomodoroDots({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="pomodoro-dots" aria-label={`${count} pomodoros`}>
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <svg key={i} viewBox="0 0 100 100" aria-hidden>
          <path style={shapeStyle("cookie7")} />
        </svg>
      ))}
      {count > 6 && <span>+{count - 6}</span>}
    </span>
  );
}

export function AddTask() {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    run(api.addTask(title.trim()));
    setTitle("");
  };
  return (
    <form
      className="add-task"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        className="text-input"
        value={title}
        placeholder="Add a task"
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" className="icon-button tonal" aria-label="Add task" disabled={!title.trim()}>
        <Icon name="add" />
      </button>
    </form>
  );
}

export function AllDoneBanner({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="banner">
      <svg className="banner-shape" viewBox="0 0 100 100" aria-hidden>
        <path className="spin" style={shapeStyle("sunny")} />
      </svg>
      <span>Every task is checked off.</span>
      <button className="m3-button tonal" onClick={onEnd}>
        End session
      </button>
    </div>
  );
}
