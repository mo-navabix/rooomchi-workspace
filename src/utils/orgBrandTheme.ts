/** Default Rooomchi portal primary when org has no custom color */
export const DEFAULT_ORG_PRIMARY = "#0f786e";

function normalizeHex(hex: string): string | null {
  const h = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const [, r, g, b] = h;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = normalizeHex(hex) ?? DEFAULT_ORG_PRIMARY;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (x: number) =>
    Math.round(Math.max(0, Math.min(255, x)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

function mix(hex: string, target: string, weight: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    a.r * (1 - w) + b.r * w,
    a.g * (1 - w) + b.g * w,
    a.b * (1 - w) + b.b * w,
  );
}

const THEME_VAR_KEYS = [
  "--brand-primary",
  "--brand-primary-hover",
  "--brand-primary-hover-dark",
  "--brand-primary-light",
  "--brand-primary-lighter",
  "--brand-primary-ultra-light",
  "--brand-primary-rgb",
  "--brand-primary-on-dark",
  "--brand-nav-active-from",
  "--brand-nav-active-bg-light",
  "--brand-gradient-start",
  "--brand-gradient-end",
  "--brand-gradient-soft-start",
  "--brand-gradient-soft-end",
  "--brand-secondary",
  "--color-exec-primary",
  "--color-exec-primary-light",
  "--color-exec-secondary",
  "--color-exec-tertiary",
] as const;

/** Apply per-organization brand colors to the document root (portal UI). */
export function applyOrgBrandTheme(primaryColor?: string | null): void {
  if (typeof document === "undefined") return;

  const primary =
    (primaryColor && normalizeHex(primaryColor)) || DEFAULT_ORG_PRIMARY;
  const hover = mix(primary, "#000000", 0.1);
  const hoverDark = mix(primary, "#ffffff", 0.14);
  const light = mix(primary, "#ffffff", 0.22);
  const lighter = mix(primary, "#ffffff", 0.42);
  const ultraLight = mix(primary, "#ffffff", 0.9);
  const onDark = mix(primary, "#ffffff", 0.62);
  const { r, g, b } = hexToRgb(primary);

  const root = document.documentElement;
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-primary-hover", hover);
  root.style.setProperty("--brand-primary-hover-dark", hoverDark);
  root.style.setProperty("--brand-primary-light", light);
  root.style.setProperty("--brand-primary-lighter", lighter);
  root.style.setProperty("--brand-primary-ultra-light", ultraLight);
  root.style.setProperty("--brand-primary-rgb", `${r} ${g} ${b}`);
  root.style.setProperty("--brand-primary-on-dark", onDark);
  root.style.setProperty("--brand-nav-active-from", `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.style.setProperty(
    "--brand-nav-active-bg-light",
    `rgba(${r}, ${g}, ${b}, 0.08)`,
  );
  root.style.setProperty("--brand-gradient-start", light);
  root.style.setProperty("--brand-gradient-end", lighter);
  root.style.setProperty("--brand-gradient-soft-start", ultraLight);
  root.style.setProperty("--brand-gradient-soft-end", mix(primary, "#ffffff", 0.82));
  root.style.setProperty("--brand-secondary", light);
  root.style.setProperty("--color-exec-primary", primary);
  root.style.setProperty("--color-exec-primary-light", light);
  root.style.setProperty("--color-exec-secondary", light);
  root.style.setProperty("--color-exec-tertiary", lighter);
}

/** Restore marketing / default palette from `index.css` `:root` (no org override). */
export function clearOrgBrandThemeOverrides(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of THEME_VAR_KEYS) {
    root.style.removeProperty(key);
  }
}
