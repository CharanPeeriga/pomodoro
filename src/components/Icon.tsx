/** Material Symbols (24px grid) used by the app, inlined to avoid an icon font. */
const ICONS = {
  northEast: "M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z",
  tune: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z",
  arrowForward: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}
