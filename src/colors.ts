/** User colour overrides for the operation tints (issue #48). `""` means
 *  "use the stylesheet default". */
export interface MarkColors {
  addition: string;
  deletion: string;
  highlight: string;
  aiTextStart: string;
  aiTextEnd: string;
  commentYou: string;
  commentAi: string;
}

export type MarkColorKey = keyof MarkColors;

/** Mirrors the defaults declared on `body` in styles.css; seeds the pickers. */
export const DEFAULT_MARK_COLORS: MarkColors = {
  addition: "#38a169",
  deletion: "#dc2626",
  highlight: "#fcd34d",
  aiTextStart: "#f97316",
  aiTextEnd: "#a855f7",
  commentYou: "#007acc",
  commentAi: "#a73cdd",
};

export const EMPTY_MARK_COLORS: MarkColors = {
  addition: "",
  deletion: "",
  highlight: "",
  aiTextStart: "",
  aiTextEnd: "",
  commentYou: "",
  commentAi: "",
};

export const DEFAULT_MARK_INTENSITY = 100;
export const MIN_MARK_INTENSITY = 50;
export const MAX_MARK_INTENSITY = 300;

const CSS_VARS: Record<MarkColorKey, { name: string; rgb: boolean }> = {
  addition: { name: "--tc-add-rgb", rgb: true },
  deletion: { name: "--tc-del-rgb", rgb: true },
  highlight: { name: "--tc-highlight-rgb", rgb: true },
  aiTextStart: { name: "--tc-aitext-start", rgb: false },
  aiTextEnd: { name: "--tc-aitext-end", rgb: false },
  commentYou: { name: "--tc-you-rgb", rgb: true },
  commentAi: { name: "--tc-ai-comment-rgb", rgb: true },
};

export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Every managed CSS variable mapped to its override, or `""` to remove the
 *  inline value so the stylesheet default applies. */
export function colorCssProps(colors: MarkColors, intensityPct: number): Record<string, string> {
  const props: Record<string, string> = {};
  for (const key of Object.keys(CSS_VARS) as MarkColorKey[]) {
    const { name, rgb } = CSS_VARS[key];
    const v = colors[key];
    props[name] = isHexColor(v) ? (rgb ? hexToRgb(v) : v.toLowerCase()) : "";
  }
  props["--tc-intensity"] =
    intensityPct === DEFAULT_MARK_INTENSITY ? "" : String(intensityPct / 100);
  return props;
}
