import { useId } from "react";

const HEIGHT = 14;
const AMPLITUDE = 3;
const WAVELENGTH = 22;
const GAP = 6;

/** M3 Expressive wavy linear progress: a flowing wave for elapsed time, flat track for the rest. */
export function WavyProgress({
  value,
  width,
  paused = false,
}: {
  value: number;
  width: number;
  paused?: boolean;
}) {
  const clipId = `wave-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const v = Math.min(Math.max(value, 0), 1);
  const split = v * width;
  const mid = HEIGHT / 2;

  return (
    <svg className="wavy-progress" width={width} height={HEIGHT} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect width={split} height={HEIGHT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path
          className={`wavy-progress-wave${paused ? " paused" : ""}`}
          d={wavePath(-WAVELENGTH, width + WAVELENGTH, mid)}
          style={{ "--wavelength": `${WAVELENGTH}px` } as React.CSSProperties}
        />
      </g>
      {split + GAP < width - 2 && (
        <line className="wavy-progress-track" x1={split + GAP} y1={mid} x2={width - 2} y2={mid} />
      )}
      <circle className="wavy-progress-stop" cx={width - 2} cy={mid} r={2} />
    </svg>
  );
}

function wavePath(from: number, to: number, mid: number): string {
  const parts = [`M${from} ${mid}`];
  for (let x = from; x < to; x += WAVELENGTH / 2) {
    const peak = ((x - from) / (WAVELENGTH / 2)) % 2 === 0 ? -AMPLITUDE : AMPLITUDE;
    parts.push(`Q${x + WAVELENGTH / 4} ${mid + peak * 2} ${x + WAVELENGTH / 2} ${mid}`);
  }
  return parts.join(" ");
}
