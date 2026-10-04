/**
 * Material 3 Expressive-style abstract shapes, generated as polar curves.
 *
 * Every shape is sampled with the same number of points, so any two paths can be morphed by
 * transitioning the CSS `d` property.
 */

const POINTS = 144;

export interface ShapeSpec {
  /** Number of scallops/petals; 0 is a circle. */
  lobes: number;
  /** How far valleys dip toward the center, as a fraction of the radius. */
  depth: number;
  /** >1 makes peaks pointier (sunny/burst), <1 makes them fatter (clover/flower). */
  sharpness?: number;
}

export const SHAPES = {
  circle: { lobes: 0, depth: 0 },
  cookie7: { lobes: 7, depth: 0.09 },
  cookie9: { lobes: 9, depth: 0.075 },
  cookie12: { lobes: 12, depth: 0.06 },
  clover: { lobes: 4, depth: 0.26, sharpness: 0.6 },
  flower: { lobes: 8, depth: 0.2, sharpness: 0.7 },
  sunny: { lobes: 8, depth: 0.12, sharpness: 2.5 },
  burst: { lobes: 12, depth: 0.16, sharpness: 3 },
} satisfies Record<string, ShapeSpec>;

export type ShapeName = keyof typeof SHAPES;

/** SVG path for a shape filling a 100×100 viewBox. */
export function shapePath({ lobes, depth, sharpness = 1 }: ShapeSpec): string {
  const parts: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const theta = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
    const wave = lobes === 0 ? 1 : ((1 + Math.cos(lobes * theta)) / 2) ** sharpness;
    const r = 50 * (1 - depth + depth * wave);
    const x = (50 + r * Math.cos(theta)).toFixed(2);
    const y = (50 + r * Math.sin(theta)).toFixed(2);
    parts.push(`${i === 0 ? "M" : "L"}${x} ${y}`);
  }
  return `${parts.join(" ")} Z`;
}

/** `style` value that sets a path's geometry through CSS so it can be transitioned. */
export const shapeStyle = (name: ShapeName) =>
  ({ d: `path("${shapePath(SHAPES[name])}")` }) as React.CSSProperties;
