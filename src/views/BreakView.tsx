import { Checkbox } from "../components/controls";
import { Icon } from "../components/Icon";
import { NavActions } from "../components/NavActions";
import { DECOR, Screen } from "../components/Screen";
import { ShapeProgress } from "../components/ShapeProgress";
import { AddTask, AllDoneBanner, TaskList } from "../components/TaskList";
import { api, run } from "../lib/api";
import { formatClock, useCountdown } from "../lib/hooks";
import type { AppState, OverlayView } from "../lib/types";

export function BreakView({
  state,
  onOpen,
}: {
  state: AppState;
  onOpen: (view: OverlayView) => void;
}) {
  const session = state.session!;
  const { remainingMs, fraction, paused } = useCountdown(state.timer);
  const last = session.pomodoros[session.pomodoros.length - 1];
  const lastTask = session.tasks.find((t) => t.id === last?.taskId);
  const longBreak = last?.breakKind === "long";
  const nextId = session.nextTaskId;
  const allDone = session.tasks.every((t) => t.done);

  return (
    <Screen
      phase="break"
      decor={DECOR.break}
      overline={longBreak ? "Long break" : "Break"}
      actions={<NavActions onOpen={onOpen} />}
      footer={
        <>
          <button
            className={`icon-button filled toggle${paused ? "" : " selected"}`}
            aria-label={paused ? "Resume break" : "Pause break"}
            onClick={() => run(paused ? api.resume() : api.pause())}
          >
            <Icon name={paused ? "play" : "pause"} size={20} />
          </button>
          <button className="icon-button tonal text-icon" aria-label="Add 5 minutes" onClick={() => run(api.extendPhase(5))}>
            +5
          </button>
          <button className="m3-button tonal" onClick={() => run(api.skipPhase())}>
            <Icon name="skipNext" size={18} />
            {nextId ? "Start now" : "End break"}
          </button>
          <span className="spacer" />
          <button className="m3-button text" onClick={() => run(api.endSession())}>
            End session
          </button>
        </>
      }
    >
      <div className={`break-hero${paused ? " paused" : ""}`}>
        <ShapeProgress shape={paused ? "squircle" : "sunny"} remaining={fraction} />
        <div className="break-clock">
          <span className="label muted">{paused ? "Paused" : "Back to it in"}</span>
          <span className="timer">{formatClock(remainingMs)}</span>
        </div>
      </div>

      {lastTask && (
        <div className="finished-card">
          <Checkbox
            checked={lastTask.done}
            label={`Finished ${lastTask.title}`}
            onChange={(done) => run(api.setTaskDone(lastTask.id, done))}
          />
          <div className="finished-text">
            <span className="label muted">Did you finish it?</span>
            <span className="truncate">{lastTask.title}</span>
          </div>
        </div>
      )}

      {allDone && <AllDoneBanner onEnd={() => run(api.endSession())} />}

      <span className="section-label">Up next</span>
      <div className="scroll">
        <TaskList
          session={session}
          excludeId={lastTask?.done ? lastTask.id : undefined}
          selectedId={nextId}
          selectHint="Queue"
          onSelect={(task) => run(api.setNextTask(task.id === nextId ? null : task.id))}
        />
      </div>
      <AddTask />
      <p className="hint muted">
        {nextId
          ? "The next pomodoro starts on its own when the break ends."
          : "Queue a task to auto-start, or pick one when the break ends."}
      </p>
    </Screen>
  );
}
