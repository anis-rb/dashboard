import type { ThemeConfig } from "@/lib/rb/types";

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#243044",
  primaryFg: "#f5f6f7",
  secondary: "#5c6b7a",
  background: "#f3f2ef",
  surface: "#fbfbfa",
  ink: "#1c1e21",
  sidebar: "#16181c",
  line: "#e3e1dc",
  radius: "24px",
};

export function inkOn(hex: string): string {
  const raw = hex.replace("#", "").trim();
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) return "#f5f6f7";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.62 ? "#1c1e21" : "#f5f6f7";
}

export function applyTheme(theme: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const sidebarFg = inkOn(theme.sidebar);
  const pairs: Record<string, string> = {
    "--color-primary": theme.primary,
    "--color-primary-fg": theme.primaryFg || inkOn(theme.primary),
    "--color-secondary": theme.secondary,
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-fg": theme.ink,
    "--color-sidebar": theme.sidebar,
    "--color-sidebar-fg": sidebarFg,
    "--color-line": theme.line,
    "--color-muted": `color-mix(in oklab, ${theme.ink} 62%, ${theme.background})`,
    "--radius-xl": theme.radius || "24px",
  };
  for (const [key, value] of Object.entries(pairs)) root.style.setProperty(key, value);
  const paper = theme.background.replace("#", "");
  const full = paper.length === 3 ? paper.split("").map((c) => c + c).join("") : paper;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  root.style.colorScheme = l > 0.55 ? "light" : "dark";
}
