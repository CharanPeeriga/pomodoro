import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Stepper, Switch } from "../components/controls";
import { Icon } from "../components/Icon";
import { DECOR, Screen } from "../components/Screen";
import { api } from "../lib/api";
import { playChime } from "../lib/chime";
import type { Settings } from "../lib/types";
import { THEMES } from "../theme/scheme";
import { shapeStyle } from "../theme/shapes";

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);
const IS_MAC = navigator.userAgent.includes("Mac");
const MAC_SYMBOLS: Record<string, string> = { Super: "⌘", Alt: "⌥", Ctrl: "⌃", Shift: "⇧" };

/** "Super+Alt+P" → "⌘⌥P" on macOS; unchanged elsewhere. */
const displayHotkey = (accelerator: string) =>
  IS_MAC ? accelerator.split("+").map((part) => MAC_SYMBOLS[part] ?? part).join("") : accelerator;

/** Turns a keydown into an accelerator like "Ctrl+Alt+P"; null until a non-modifier is pressed. */
function acceleratorFrom(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;
  const parts = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Super");
  if (parts.length === 0) return null; // a bare key would hijack normal typing
  const key = e.code.startsWith("Key") ? e.code.slice(3) : e.code.startsWith("Digit") ? e.code.slice(5) : e.code;
  return [...parts, key].join("+");
}

export function SettingsView({
  settings,
  onChange,
  onBack,
  onPreview,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onBack: () => void;
  /** Shows the real overlay in the corner for a few seconds. */
  onPreview: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    onChange(next);
    setError(null);
    api
      .updateSettings(next)
      .then(onChange)
      .catch((e) => {
        setError(String(e));
        onChange(settings);
      });
  };

  return (
    <Screen
      decor={DECOR.quiet}
      overline="Settings"
      actions={
        <button className="icon-button standard" aria-label="Back" onClick={onBack}>
          <Icon name="arrowBack" size={20} />
        </button>
      }
    >
      <h1 className="headline">Tune it.</h1>
      <div className="scroll settings-list">
        <div className="setting-row">
          <div className="setting-text">
            <span>Sound</span>
            <span className="muted">Chime when work or a break ends</span>
          </div>
          <button className="icon-button standard" aria-label="Preview chime" onClick={() => playChime("down")}>
            <Icon name="play" size={18} />
          </button>
          <Switch label="Sound" checked={settings.soundEnabled} onChange={(soundEnabled) => save({ soundEnabled })} />
        </div>

        <div className="setting-row column">
          <div className="setting-text">
            <span>Overlay opacity</span>
            <span className="muted">{Math.round(settings.overlayOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            className="slider"
            min={40}
            max={100}
            value={Math.round(settings.overlayOpacity * 100)}
            style={{ "--value": `${((settings.overlayOpacity * 100 - 40) / 60) * 100}%` } as React.CSSProperties}
            onChange={(e) => save({ overlayOpacity: Number(e.target.value) / 100 })}
          />
          <div className="opacity-row">
            <div className="opacity-preview" data-phase="work">
              <span className="current-task">Overlay preview</span>
              <span className="timer">25:00</span>
            </div>
            <button className="m3-button tonal" onClick={onPreview}>
              <Icon name="northEast" size={16} />
              Preview in corner
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-text">
            <span>Show/hide shortcut</span>
            <span className="muted">{error ?? "Works from any app"}</span>
          </div>
          <button
            className={`m3-button ${recording ? "filled" : "tonal"} hotkey-button`}
            onClick={() => setRecording(true)}
            onBlur={() => setRecording(false)}
            onKeyDown={(e) => {
              if (!recording) return;
              e.preventDefault();
              if (e.key === "Escape") return setRecording(false);
              if (e.key === "Backspace") {
                setRecording(false);
                return save({ hotkey: "" });
              }
              const accelerator = acceleratorFrom(e);
              if (accelerator) {
                setRecording(false);
                save({ hotkey: accelerator });
              }
            }}
          >
            {recording ? "Press keys…" : settings.hotkey ? displayHotkey(settings.hotkey) : "Off"}
          </button>
        </div>

        <span className="section-label">Default long breaks</span>
        <div className="stepper-grid">
          <Stepper
            label="Every"
            value={settings.longBreakEvery}
            onChange={(longBreakEvery) => save({ longBreakEvery })}
            min={0}
            max={12}
            suffix={settings.longBreakEvery === 0 ? "off" : "poms"}
          />
          <Stepper
            label="Length"
            value={settings.longBreakMinutes}
            onChange={(longBreakMinutes) => save({ longBreakMinutes })}
            min={1}
            max={90}
            suffix="min"
          />
        </div>

        <span className="section-label">Theme</span>
        <div className="theme-grid" role="radiogroup" aria-label="Theme">
          {THEMES.map((theme) => {
            const selected = theme.id === settings.theme;
            return (
              <button
                key={theme.id}
                role="radio"
                aria-checked={selected}
                className={`theme-option${selected ? " selected" : ""}`}
                onClick={() => save({ theme: theme.id })}
              >
                <span className="theme-swatches">
                  {theme.swatches.map((hex) => (
                    <span key={hex} style={{ background: hex }} />
                  ))}
                </span>
                <span className="theme-name">
                  {selected && (
                    <svg className="theme-check" viewBox="0 0 100 100" aria-hidden>
                      <path style={shapeStyle("cookie9")} />
                    </svg>
                  )}
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
