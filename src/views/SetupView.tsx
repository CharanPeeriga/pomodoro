import { useState } from "react";
import { Stepper } from "../components/controls";
import { Icon } from "../components/Icon";
import { DECOR, Screen } from "../components/Screen";
import { NavActions } from "../components/NavActions";
import { api } from "../lib/api";
import type { OverlayView, Settings } from "../lib/types";

export function SetupView({
  settings,
  onOpen,
  onSettingsChange,
}: {
  settings: Settings;
  onOpen: (view: OverlayView) => void;
  /** Starting a session remembers its durations as the next defaults. */
  onSettingsChange: (settings: Settings) => void;
}) {
  const [text, setText] = useState("");
  const [workMinutes, setWorkMinutes] = useState(settings.lastWorkMinutes);
  const [breakMinutes, setBreakMinutes] = useState(settings.lastBreakMinutes);
  const [longBreakEvery, setLongBreakEvery] = useState(settings.longBreakEvery);
  const [longBreakMinutes, setLongBreakMinutes] = useState(settings.longBreakMinutes);
  const [error, setError] = useState<string | null>(null);

  const tasks = text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const start = () => {
    setError(null);
    api
      .startSession(tasks, { workMinutes, breakMinutes, longBreakEvery, longBreakMinutes })
      .then(api.getSettings)
      .then(onSettingsChange)
      .catch((e) => setError(String(e)));
  };

  return (
    <Screen
      decor={DECOR.setup}
      overline="New session"
      actions={<NavActions onOpen={onOpen} />}
      footer={
        <>
          <button className="m3-button filled large" disabled={tasks.length === 0} onClick={start}>
            <Icon name="play" />
            Start session
          </button>
          <span className="footer-note muted">
            {error ??
              (tasks.length === 0
                ? "Add at least one task"
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`)}
          </span>
        </>
      }
    >
      <h1 className="headline">
        Plan the
        <br />
        session.
      </h1>

      <label className="field">
        <span className="field-label">Tasks · one per line</span>
        <textarea
          className="text-area"
          value={text}
          autoFocus
          spellCheck={false}
          placeholder={"Write the intro section\nReview lecture notes\nProblem set 3"}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <div className="stepper-grid">
        <Stepper label="Work" value={workMinutes} onChange={setWorkMinutes} min={1} max={180} suffix="min" />
        <Stepper label="Break" value={breakMinutes} onChange={setBreakMinutes} min={1} max={60} suffix="min" />
        <Stepper
          label="Long break every"
          value={longBreakEvery}
          onChange={setLongBreakEvery}
          min={0}
          max={12}
          suffix={longBreakEvery === 0 ? "off" : "poms"}
        />
        <Stepper
          label="Long break"
          value={longBreakMinutes}
          onChange={setLongBreakMinutes}
          min={1}
          max={90}
          suffix="min"
        />
      </div>
    </Screen>
  );
}
