import type { ReactNode } from "react";
import { shapeStyle, type ShapeName } from "../theme/shapes";

export interface DecorShape {
  shape: ShapeName;
  /** Position/size in px relative to the card; negative values bleed off the edge. */
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  size: number;
  /** An `--md-sys-color-*` role name, e.g. "tertiary-container". */
  color: string;
  spin?: "spin" | "spin-slow" | "spin-reverse";
}

/** Abstract background compositions, one per screen. */
export const DECOR: Record<string, DecorShape[]> = {
  setup: [
    { shape: "clover", top: -150, right: -140, size: 330, color: "surface-container", spin: "spin-slow" },
    { shape: "cookie7", top: 92, right: 128, size: 52, color: "primary", spin: "spin" },
    { shape: "burst", bottom: -150, right: -120, size: 300, color: "surface-container", spin: "spin-reverse" },
  ],
  picking: [
    { shape: "flower", top: -130, left: -110, size: 240, color: "surface-container", spin: "spin-slow" },
    { shape: "cookie12", bottom: -110, right: -90, size: 190, color: "tertiary-container", spin: "spin-reverse" },
  ],
  break: [
    { shape: "clover", bottom: -150, left: -120, size: 360, color: "surface-container", spin: "spin-slow" },
    { shape: "cookie7", top: 112, right: 36, size: 44, color: "primary", spin: "spin" },
  ],
  summary: [
    { shape: "burst", top: -180, right: -170, size: 340, color: "surface-container", spin: "spin-slow" },
    { shape: "clover", bottom: -110, left: -100, size: 200, color: "surface-container", spin: "spin-reverse" },
  ],
  quiet: [
    { shape: "cookie12", top: -120, right: -110, size: 260, color: "surface-container", spin: "spin-slow" },
  ],
};

export function Decor({ shapes }: { shapes: DecorShape[] }) {
  return (
    <div className="decor" aria-hidden>
      {shapes.map((d, i) => (
        <svg
          key={i}
          className="decor-shape"
          viewBox="0 0 100 100"
          style={{
            top: d.top,
            right: d.right,
            bottom: d.bottom,
            left: d.left,
            width: d.size,
            height: d.size,
            fill: `var(--md-sys-color-${d.color})`,
          }}
        >
          <path className={`morph ${d.spin ?? ""}`} style={shapeStyle(d.shape)} />
        </svg>
      ))}
    </div>
  );
}

/** Centered card layout shared by every non-overlay screen. */
export function Screen({
  phase = "work",
  decor,
  overline,
  actions,
  footer,
  children,
}: {
  phase?: "work" | "break";
  decor: DecorShape[];
  overline: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="card" data-phase={phase}>
      <Decor shapes={decor} />
      <header className="card-header" data-tauri-drag-region>
        <span className="overline" data-tauri-drag-region>
          {overline}
        </span>
        {actions && <div className="card-actions">{actions}</div>}
      </header>
      <section className="card-body">{children}</section>
      {footer && <footer className="card-footer">{footer}</footer>}
    </main>
  );
}
