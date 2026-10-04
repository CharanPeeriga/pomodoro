import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icon } from "../components/Icon";
import { ShapeProgress } from "../components/ShapeProgress";
import { WavyProgress } from "../components/WavyProgress";
import { api, run } from "../lib/api";
import { formatClock, useCountdown } from "../lib/hooks";
import type { AppState, Session } from "../lib/types";
import { shapeStyle } from "../theme/shapes";

const HOVER_EXPAND_MS = 400;
const LEAVE_COLLAPSE_MS = 300;
const DRAG_THRESHOLD_PX = 4;
const CONFIRM_TIMEOUT_MS = 3000;
const EXPANDED_CONTENT_WIDTH = 284;
const PREVIEW_MS = 4000;

/** Whether the break after the current pomodoro will be a long one. */
const nextBreakIsLong = (session: Session) =>
  session.config.longBreakEvery > 0 &&
  session.pomodoros.length % session.config.longBreakEvery === 0;

export function OverlayView({
  state,
  expanded,
  onExpandedChange,
  onOpenSettings,
}: {
  state: AppState;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenSettings: () => void;
}) {
  const session = state.session!;
  const { remainingMs, fraction, paused } = useCountdown(state.timer);
  const [pinned, setPinned] = useState(false);
  const [choosingNext, setChoosingNext] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  const current = session.tasks.find((t) => t.id === session.currentTaskId);
  const nextOptions = session.tasks.filter((t) => !t.done && t.id !== session.currentTaskId);
  const longBreak = nextBreakIsLong(session);

  const clearTimers = () => {
    window.clearTimeout(hoverTimer.current);
    window.clearTimeout(leaveTimer.current);
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!confirmEnd) return;
    const id = window.setTimeout(() => setConfirmEnd(false), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [confirmEnd]);

  const collapse = () => {
    setPinned(false);
    setConfirmEnd(false);
    setChoosingNext(false);
    onExpandedChange(false);
  };

  const handleEnter = () => {
    window.clearTimeout(leaveTimer.current);
    if (!expanded) {
      hoverTimer.current = window.setTimeout(() => onExpandedChange(true), HOVER_EXPAND_MS);
    }
  };

  const handleLeave = () => {
    window.clearTimeout(hoverTimer.current);
    if (expanded && !pinned && !choosingNext) {
      leaveTimer.current = window.setTimeout(collapse, LEAVE_COLLAPSE_MS);
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    pressStart.current = { x: e.screenX, y: e.screenY };
  };

  // Drag once the pointer moves past a small threshold; otherwise the press is a click.
  const handleMouseMove = (e: MouseEvent) => {
    const start = pressStart.current;
    if (!start) return;
    if (Math.hypot(e.screenX - start.x, e.screenY - start.y) > DRAG_THRESHOLD_PX) {
      pressStart.current = null;
      clearTimers();
      void getCurrentWindow().startDragging();
    }
  };

  const handleMouseUp = () => {
    if (!pressStart.current) return;
    pressStart.current = null;
    clearTimers();
    if (!expanded) {
      setPinned(true);
      onExpandedChange(true);
    } else if (pinned) {
      collapse();
    } else {
      setPinned(true);
    }
  };

  const endSession = () => {
    if (confirmEnd) run(api.endSession());
    else setConfirmEnd(true);
  };

  const chooseNext = (taskId: string | null) => {
    run(api.setNextTask(taskId));
    setChoosingNext(false);
  };
  const nextTask = session.tasks.find((t) => t.id === session.nextTaskId);

  const shape = paused ? "squircle" : pinned ? "flower" : expanded ? "cookie12" : "cookie9";

  return (
    <div
      className={`overlay overlay-${expanded ? "expanded" : "mini"}${pinned ? " pinned" : ""}${paused ? " paused" : ""}`}
      data-phase="work"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="overlay-main">
        <ShapeProgress shape={shape} remaining={fraction} />
        <div className="overlay-text">
          <span className="current-task" title={current?.title}>
            {current?.title ?? "—"}
          </span>
          <span className="timer">{formatClock(remainingMs)}</span>
        </div>
      </div>

      {expanded && (
        <button className="icon-button standard small overlay-settings" aria-label="Settings" onClick={onOpenSettings}>
          <Icon name="tune" size={18} />
        </button>
      )}

      {expanded && choosingNext && (
        <div className="next-picker">
          <div className="next-picker-header">
            <button className="icon-button standard small" aria-label="Back" onClick={() => setChoosingNext(false)}>
              <Icon name="arrowBack" size={18} />
            </button>
            <span className="section-label">Up next</span>
          </div>
          <div className="next-picker-list">
            {[{ id: null as string | null, title: "Pick during break" }, ...nextOptions].map((option) => {
              const selected = option.id === (session.nextTaskId ?? null);
              return (
                <button
                  key={option.id ?? "none"}
                  className={`next-option${selected ? " selected" : ""}`}
                  onClick={() => chooseNext(option.id)}
                >
                  <svg className="task-bullet" viewBox="0 0 100 100" aria-hidden>
                    <path className="morph" style={shapeStyle(selected ? "flower" : "circle")} />
                  </svg>
                  <span className={`truncate${option.id ? "" : " muted"}`}>{option.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {expanded && !choosingNext && (
        <div className="overlay-details">
          <WavyProgress value={1 - fraction} width={EXPANDED_CONTENT_WIDTH} paused={paused} />
          <div className="chips">
            <span className="chip">
              <span className="chip-dot work" />
              Work {session.config.workMinutes}m
            </span>
            <span className="chip">
              <span className="chip-dot break" />
              {longBreak
                ? `Long break ${session.config.longBreakMinutes}m`
                : `Break ${session.config.breakMinutes}m`}
            </span>
          </div>
          <button
            className="next-task"
            disabled={nextOptions.length === 0}
            onClick={() => setChoosingNext(true)}
          >
            <Icon name="arrowForward" size={16} />
            <span className="label muted">Next</span>
            <span className={`next-value truncate${nextTask ? "" : " muted"}`}>
              {nextTask?.title ?? (nextOptions.length ? "Pick during break" : "No other tasks")}
            </span>
          </button>
          <div className="controls">
            <button
              className={`icon-button filled toggle${paused ? "" : " selected"}`}
              aria-label={paused ? "Resume" : "Pause"}
              onClick={() => run(paused ? api.resume() : api.pause())}
            >
              <Icon name={paused ? "play" : "pause"} size={20} />
            </button>
            <button className="icon-button tonal" aria-label="Skip to break" onClick={() => run(api.skipPhase())}>
              <Icon name="skipNext" size={20} />
            </button>
            <button className="icon-button tonal text-icon" aria-label="Add 5 minutes" onClick={() => run(api.extendPhase(5))}>
              +5
            </button>
            <button className={`m3-button ${confirmEnd ? "filled danger" : "tonal"} end-button`} onClick={endSession}>
              <Icon name="stop" size={16} />
              {confirmEnd ? "Confirm" : "End"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Mini pill shown in the corner while previewing settings; click to dismiss. */
export function OverlayPreview({ state, onDone }: { state: AppState; onDone: () => void }) {
  const { remainingMs, fraction } = useCountdown(state.timer);
  const working = state.phase === "work" && state.session;
  const task = working ? state.session!.tasks.find((t) => t.id === state.session!.currentTaskId) : null;

  useEffect(() => {
    const id = window.setTimeout(onDone, PREVIEW_MS);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <div className="overlay overlay-mini preview" data-phase="work" onClick={onDone}>
      <div className="overlay-main">
        <ShapeProgress shape="cookie9" remaining={working ? fraction : 0.65} />
        <div className="overlay-text">
          <span className="current-task">{task?.title ?? "Opacity preview"}</span>
          <span className="timer">{working ? formatClock(remainingMs) : "25:00"}</span>
        </div>
      </div>
    </div>
  );
}
