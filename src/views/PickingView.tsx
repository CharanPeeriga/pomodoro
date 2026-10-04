import { AddTask, AllDoneBanner, TaskList } from "../components/TaskList";
import { DECOR, Screen } from "../components/Screen";
import { NavActions } from "../components/NavActions";
import { api, run } from "../lib/api";
import type { OverlayView, Session } from "../lib/types";

export function PickingView({
  session,
  onOpen,
}: {
  session: Session;
  onOpen: (view: OverlayView) => void;
}) {
  const allDone = session.tasks.every((t) => t.done);
  const endSession = () => run(api.endSession());

  return (
    <Screen
      decor={DECOR.picking}
      overline={`Pomodoro ${session.pomodoros.length + 1}`}
      actions={<NavActions onOpen={onOpen} />}
      footer={
        <button className="m3-button text" onClick={endSession}>
          End session
        </button>
      }
    >
      <h1 className="headline">
        What's
        <br />
        next?
      </h1>
      {allDone && <AllDoneBanner onEnd={endSession} />}
      <div className="scroll">
        <TaskList session={session} onSelect={(task) => run(api.pickTask(task.id))} selectHint="Start" />
      </div>
      <AddTask />
    </Screen>
  );
}
