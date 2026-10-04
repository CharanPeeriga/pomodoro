/**
 * Themes map palette swatches directly onto M3 color roles. No derived tones: every role is an exact
 * swatch, so the UI only ever shows the palette's own colors.
 *
 * Roles: `bg` card/overlay background, `raised` rows/fields, `text` all text, `work` work accent,
 * `break` break accent, `tonal` secondary buttons. `*Container` fills mark selected/highlighted items.
 * Palettes with only one dark swatch set `border` so raised items are outlined instead of filled.
 */
export interface ThemeSpec {
  id: string;
  name: string;
  swatches: string[];
  bg: string;
  raised: string;
  border?: string;
  text: string;
  muted?: string;
  outline: string;
  work: string;
  onWork: string;
  workContainer: string;
  onWorkContainer: string;
  tonal: string;
  onTonal: string;
  break: string;
  onBreak: string;
  breakContainer: string;
  onBreakContainer: string;
  danger: string;
}

export const THEMES: ThemeSpec[] = [
  {
    id: "forest",
    name: "Forest",
    swatches: ["#9CB080", "#618764", "#2B5748", "#273338"],
    bg: "#273338",
    raised: "#2B5748",
    text: "#9CB080",
    outline: "#618764",
    work: "#9CB080",
    onWork: "#273338",
    workContainer: "#618764",
    onWorkContainer: "#273338",
    tonal: "#618764",
    onTonal: "#273338",
    break: "#618764",
    onBreak: "#273338",
    breakContainer: "#9CB080",
    onBreakContainer: "#273338",
    danger: "#9CB080",
  },
  {
    id: "midnight",
    name: "Midnight",
    swatches: ["#121842", "#4A5592", "#7889B0", "#EBE3D5"],
    bg: "#121842",
    raised: "#4A5592",
    text: "#EBE3D5",
    outline: "#7889B0",
    work: "#EBE3D5",
    onWork: "#121842",
    workContainer: "#7889B0",
    onWorkContainer: "#121842",
    tonal: "#7889B0",
    onTonal: "#121842",
    break: "#7889B0",
    onBreak: "#121842",
    breakContainer: "#EBE3D5",
    onBreakContainer: "#121842",
    danger: "#EBE3D5",
  },
  {
    id: "retro",
    name: "Retro",
    swatches: ["#32ABA9", "#F8DFA5", "#A82123", "#6E1919"],
    bg: "#6E1919",
    raised: "#A82123",
    text: "#F8DFA5",
    outline: "#32ABA9",
    work: "#32ABA9",
    onWork: "#6E1919",
    workContainer: "#F8DFA5",
    onWorkContainer: "#6E1919",
    tonal: "#32ABA9",
    onTonal: "#6E1919",
    break: "#F8DFA5",
    onBreak: "#6E1919",
    breakContainer: "#32ABA9",
    onBreakContainer: "#6E1919",
    danger: "#F8DFA5",
  },
  {
    id: "moon-foam",
    name: "Moon foam",
    swatches: ["#600C00", "#FFBA42", "#D16A00", "#FFD67A", "#F8A600"],
    bg: "#600C00",
    raised: "#600C00",
    border: "#D16A00",
    text: "#FFD67A",
    muted: "#FFBA42",
    outline: "#D16A00",
    work: "#F8A600",
    onWork: "#600C00",
    workContainer: "#D16A00",
    onWorkContainer: "#600C00",
    tonal: "#D16A00",
    onTonal: "#600C00",
    break: "#FFD67A",
    onBreak: "#600C00",
    breakContainer: "#FFBA42",
    onBreakContainer: "#600C00",
    danger: "#FFBA42",
  },
  {
    id: "dusk",
    name: "Dusk",
    swatches: ["#2D3250", "#424769", "#7077A1", "#F6B17A"],
    bg: "#2D3250",
    raised: "#424769",
    text: "#F6B17A",
    outline: "#7077A1",
    work: "#F6B17A",
    onWork: "#2D3250",
    workContainer: "#7077A1",
    onWorkContainer: "#2D3250",
    tonal: "#7077A1",
    onTonal: "#2D3250",
    break: "#7077A1",
    onBreak: "#2D3250",
    breakContainer: "#F6B17A",
    onBreakContainer: "#2D3250",
    danger: "#F6B17A",
  },
  {
    id: "graphite",
    name: "Graphite",
    swatches: ["#222831", "#393E46", "#00ADB5", "#EEEEEE"],
    bg: "#222831",
    raised: "#393E46",
    text: "#EEEEEE",
    outline: "#00ADB5",
    work: "#00ADB5",
    onWork: "#222831",
    workContainer: "#EEEEEE",
    onWorkContainer: "#222831",
    tonal: "#00ADB5",
    onTonal: "#222831",
    break: "#EEEEEE",
    onBreak: "#222831",
    breakContainer: "#00ADB5",
    onBreakContainer: "#222831",
    danger: "#EEEEEE",
  },
  {
    id: "plum",
    name: "Plum",
    swatches: ["#2E073F", "#7A1CAC", "#AD49E1", "#EBD3F8"],
    bg: "#2E073F",
    raised: "#7A1CAC",
    text: "#EBD3F8",
    outline: "#AD49E1",
    work: "#AD49E1",
    onWork: "#2E073F",
    workContainer: "#EBD3F8",
    onWorkContainer: "#2E073F",
    tonal: "#AD49E1",
    onTonal: "#2E073F",
    break: "#EBD3F8",
    onBreak: "#2E073F",
    breakContainer: "#AD49E1",
    onBreakContainer: "#2E073F",
    danger: "#EBD3F8",
  },
  {
    // No dark swatch in this palette: #1C1D3B is the one added color, used as the background.
    id: "periwinkle",
    name: "Periwinkle",
    swatches: ["#9FA2FF", "#B3B6FF", "#ABE0FF", "#D8F8E1"],
    bg: "#1C1D3B",
    raised: "#1C1D3B",
    border: "#9FA2FF",
    text: "#D8F8E1",
    muted: "#B3B6FF",
    outline: "#9FA2FF",
    work: "#9FA2FF",
    onWork: "#1C1D3B",
    workContainer: "#B3B6FF",
    onWorkContainer: "#1C1D3B",
    tonal: "#ABE0FF",
    onTonal: "#1C1D3B",
    break: "#ABE0FF",
    onBreak: "#1C1D3B",
    breakContainer: "#D8F8E1",
    onBreakContainer: "#1C1D3B",
    danger: "#D8F8E1",
  },
  {
    // No dark swatch in this palette: #1F1B1E is the one added color, used as the background.
    id: "playful",
    name: "Playful",
    swatches: ["#F296C8", "#8ADEF0", "#64BF5A", "#F2C43C", "#F75C38"],
    bg: "#1F1B1E",
    raised: "#1F1B1E",
    border: "#F296C8",
    text: "#8ADEF0",
    muted: "#F296C8",
    outline: "#64BF5A",
    work: "#F75C38",
    onWork: "#1F1B1E",
    workContainer: "#F296C8",
    onWorkContainer: "#1F1B1E",
    tonal: "#64BF5A",
    onTonal: "#1F1B1E",
    break: "#8ADEF0",
    onBreak: "#1F1B1E",
    breakContainer: "#F2C43C",
    onBreakContainer: "#1F1B1E",
    danger: "#F2C43C",
  },
];

export const DEFAULT_THEME = "forest";

function buildRoles(t: ThemeSpec): Record<string, string> {
  return {
    primary: t.work,
    onPrimary: t.onWork,
    primaryContainer: t.workContainer,
    onPrimaryContainer: t.onWorkContainer,
    secondary: t.tonal,
    onSecondary: t.onTonal,
    secondaryContainer: t.tonal,
    onSecondaryContainer: t.onTonal,
    tertiary: t.break,
    onTertiary: t.onBreak,
    tertiaryContainer: t.breakContainer,
    onTertiaryContainer: t.onBreakContainer,
    surface: t.bg,
    surfaceContainerLowest: t.bg,
    surfaceContainerLow: t.bg,
    surfaceContainer: t.raised,
    surfaceContainerHigh: t.raised,
    surfaceContainerHighest: t.raised,
    surfaceBorder: t.border ?? "transparent",
    onSurface: t.text,
    onSurfaceVariant: t.muted ?? t.text,
    outline: t.outline,
    outlineVariant: t.outline,
    error: t.danger,
    onError: t.bg,
  };
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const THEME_CACHE_KEY = "pomodoro.theme";

/** Writes a theme's color roles as `--md-sys-color-*` custom properties. */
export function applyTheme(id?: string, root = document.documentElement) {
  let themeId = id;
  if (!themeId) {
    // Before settings load, reuse the last theme so the first paint doesn't flash the default.
    try {
      themeId = localStorage.getItem(THEME_CACHE_KEY) ?? undefined;
    } catch {
      themeId = undefined;
    }
  }
  const spec = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  for (const [role, hex] of Object.entries(buildRoles(spec))) {
    root.style.setProperty(`--md-sys-color-${kebab(role)}`, hex);
  }
  try {
    localStorage.setItem(THEME_CACHE_KEY, spec.id);
  } catch {
    // Storage unavailable; the theme still applies for this run.
  }
}
