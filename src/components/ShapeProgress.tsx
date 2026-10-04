import { useId } from "react";
import { shapeStyle, type ShapeName } from "../theme/shapes";

/** Abstract shape that drains clockwise as time runs out. `remaining` is 0..1. */
export function ShapeProgress({ shape, remaining }: { shape: ShapeName; remaining: number }) {
  const clipId = `shape-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className="shape-progress" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path className="morph spin" style={shapeStyle(shape)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect className="shape-progress-track" width="100" height="100" />
        <path className="shape-progress-fill" d={wedge(remaining)} />
      </g>
    </svg>
  );
}

/** Pie wedge from 12 o'clock, clockwise, oversized so the clip shape defines the edge. */
function wedge(fraction: number): string {
  const f = Math.min(Math.max(fraction, 0), 1);
  if (f >= 0.9999) return "M-50 -50 H150 V150 H-50 Z";
  if (f <= 0) return "";
  const angle = f * Math.PI * 2;
  const x = 50 + 100 * Math.sin(angle);
  const y = 50 - 100 * Math.cos(angle);
  return `M50 50 L50 -50 A100 100 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
}
