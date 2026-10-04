import {
  Hct,
  MaterialDynamicColors,
  SchemeExpressive,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

/** Tomato seed; the Expressive scheme derives a salmon primary and a cyan tertiary from it. */
export const SEED_COLOR = "#E8533F";

const ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "surface",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "onSurface",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
] as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Writes the M3 dark color roles as `--md-sys-color-*` custom properties. */
export function applyTheme(seed = SEED_COLOR, root = document.documentElement) {
  const scheme = new SchemeExpressive(Hct.fromInt(argbFromHex(seed)), true, 0, "2025");
  const colors = new MaterialDynamicColors();
  for (const role of ROLES) {
    const argb = colors[role]().getArgb(scheme);
    root.style.setProperty(`--md-sys-color-${kebab(role)}`, hexFromArgb(argb));
  }
}
