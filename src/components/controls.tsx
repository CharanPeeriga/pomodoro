import { Icon } from "./Icon";
import { shapeStyle } from "../theme/shapes";

/** M3 checkbox, Expressive twist: an outlined squircle that morphs into a filled cookie. */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`checkbox${checked ? " checked" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <svg viewBox="0 0 100 100" aria-hidden>
        <path className="morph checkbox-shape" style={shapeStyle(checked ? "cookie9" : "squircle")} />
        <path className="checkbox-check" d="M30 52 L44 66 L72 36" />
      </svg>
    </button>
  );
}

/** M3 switch: handle grows and gains a check icon when on. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-handle">{checked && <Icon name="check" size={16} />}</span>
    </button>
  );
}

/** Number input flanked by tonal −/+ buttons. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button
          type="button"
          className="icon-button tonal small"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          <Icon name="remove" size={18} />
        </button>
        <label className="stepper-value">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            aria-label={label}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange(clamp(v));
            }}
          />
          {suffix && <span className="stepper-suffix">{suffix}</span>}
        </label>
        <button
          type="button"
          className="icon-button tonal small"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <Icon name="add" size={18} />
        </button>
      </div>
    </div>
  );
}
