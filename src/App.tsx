import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icon } from "./components/Icon";
import { ShapeProgress } from "./components/ShapeProgress";
import { WavyProgress } from "./components/WavyProgress";
import { shapeStyle } from "./theme/shapes";
import "./App.css";

type Mode = "center" | "mini" | "expanded";
type Phase = "work" | "break";

const HOVER_EXPAND_MS = 400;
const LEAVE_COLLAPSE_MS = 300;
const DRAG_THRESHOLD_PX = 4;
const EXPANDED_CONTENT_WIDTH = 284;

// M1 placeholder data until the session engine (M2) exists.
const DEMO = {
  phase: "work" as Phase,
  task: "Write the intro section",
  workMinutes: 25,
  breakMinutes: 5,
  nextTask: "Review lecture notes",
};

/** Placeholder countdown so the overlay has motion before the real timer lands in M2. */
function useDemoCountdown(totalSeconds: number) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  const remaining = Math.max(totalSeconds - Math.floor((now - startedAt) / 1000), 0);
  return { remaining, fraction: remaining / totalSeconds };
}

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function App() {
  const [mode, setMode] = useState<Mode>("center");

  const changeMode = async (next: Mode) => {
    await invoke("set_mode", { mode: next });
    setMode(next);
  };

  useEffect(() => {
    void invoke("set_mode", { mode: "center" });
  }, []);

  if (mode === "center") {
    return <CenterView onStart={() => changeMode("mini")} />;
  }
  return <Overlay mode={mode} onModeChange={changeMode} />;
}

function CenterView({ onStart }: { onStart: () => void }) {
  return (
    <main className="card" data-phase="work">
      <div className="decor" aria-hidden>
        <svg className="decor-shape decor-clover" viewBox="0 0 100 100">
          <path className="spin-slow" style={shapeStyle("clover")} />
        </svg>
        <svg className="decor-shape decor-burst" viewBox="0 0 100 100">
          <path className="spin-reverse" style={shapeStyle("burst")} />
        </svg>
        <svg className="decor-shape decor-cookie" viewBox="0 0 100 100">
          <path className="spin" style={shapeStyle("cookie7")} />
        </svg>
      </div>

      <header className="card-header" data-tauri-drag-region>
        <span className="overline" data-tauri-drag-region>
          Mini pomodoro
        </span>
      </header>

      <section className="card-body">
        <h1 className="display">
          Focus,
          <br />
          in shape.
        </h1>
        <p className="body-large muted">
          Overlay prototype. The setup flow for tasks and intervals lands in M3.
        </p>
        <button className="m3-button filled large" onClick={onStart}>
          <Icon name="northEast" />
          Send to corner
        </button>
      </section>
    </main>
  );
}

function Overlay({
  mode,
  onModeChange,
}: {
  mode: Exclude<Mode, "center">;
  onModeChange: (mode: Mode) => Promise<void>;
}) {
  const [pinned, setPinned] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const { remaining, fraction } = useDemoCountdown(DEMO.workMinutes * 60);

  const clearTimers = () => {
    window.clearTimeout(hoverTimer.current);
    window.clearTimeout(leaveTimer.current);
  };

  useEffect(() => clearTimers, []);

  const collapse = () => {
    setPinned(false);
    void onModeChange("mini");
  };

  const handleEnter = () => {
    window.clearTimeout(leaveTimer.current);
    if (mode === "mini") {
      hoverTimer.current = window.setTimeout(() => onModeChange("expanded"), HOVER_EXPAND_MS);
    }
  };

  const handleLeave = () => {
    window.clearTimeout(hoverTimer.current);
    if (mode === "expanded" && !pinned) {
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
    if (mode === "mini") {
      setPinned(true);
      void onModeChange("expanded");
    } else if (pinned) {
      collapse();
    } else {
      setPinned(true);
    }
  };

  const expanded = mode === "expanded";

  return (
    <div
      className={`overlay overlay-${mode}${pinned ? " pinned" : ""}`}
      data-phase={DEMO.phase}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="overlay-main">
        <ShapeProgress shape={pinned ? "flower" : expanded ? "cookie12" : "cookie9"} remaining={fraction} />
        <div className="overlay-text">
          <span className="current-task" title={DEMO.task}>
            {DEMO.task}
          </span>
          <span className="timer">{formatTime(remaining)}</span>
        </div>
      </div>

      {expanded && (
        <div className="overlay-details">
          <WavyProgress value={1 - fraction} width={EXPANDED_CONTENT_WIDTH} />
          <div className="chips">
            <span className="chip">
              <span className="chip-dot work" />
              Work {DEMO.workMinutes}m
            </span>
            <span className="chip">
              <span className="chip-dot break" />
              Break {DEMO.breakMinutes}m
            </span>
          </div>
          <div className="next-task">
            <Icon name="arrowForward" size={16} />
            <span className="label muted">Next</span>
            <span className="truncate">{DEMO.nextTask}</span>
          </div>
          <div className="controls">
            <button className="m3-button tonal" onClick={() => onModeChange("center")}>
              <Icon name="tune" size={16} />
              Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
