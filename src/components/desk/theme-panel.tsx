import { useDesk } from "@/lib/rb/store";
import { DEFAULT_THEME } from "@/lib/rb/theme";
import type { ThemeConfig } from "@/lib/rb/types";

const FIELDS: { key: keyof ThemeConfig; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "background", label: "Paper" },
  { key: "surface", label: "Surface" },
  { key: "ink", label: "Ink" },
  { key: "sidebar", label: "Sidebar" },
  { key: "line", label: "Hairline" },
];

export function ThemePanel() {
  const theme = useDesk((state) => state.theme);
  const setTheme = useDesk((state) => state.setTheme);

  return (
    <div className="grid max-w-3xl gap-4">
      <p className="max-w-xl text-sm text-muted">
        These variables are the RB Theme tab. Primary and secondary drive actions and charts. The rest are the desk surfaces.
      </p>
      <div className="grid gap-3">
        {FIELDS.map((field) => {
          const value = theme[field.key];
          const valid = /^#[0-9a-fA-F]{6}$/.test(value);
          return (
            <label key={field.key} className="desk-panel grid grid-cols-[auto_1fr] items-center gap-3 p-3">
              <input
                type="color"
                aria-label={field.label}
                className="size-11 cursor-pointer rounded-sm border border-line bg-surface"
                value={valid ? value : "#243044"}
                onChange={(event) => setTheme({ [field.key]: event.target.value })}
              />
              <span className="grid gap-1">
                <span className="text-sm font-medium">{field.label}</span>
                <input className="desk-field font-mono" value={value} onChange={(event) => setTheme({ [field.key]: event.target.value })} />
              </span>
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="desk-chip" data-active={theme.radius === "16px" ? "true" : "false"} onClick={() => setTheme({ radius: "16px" })}>
          Quiet radius
        </button>
        <button type="button" className="desk-chip" data-active={theme.radius === "24px" ? "true" : "false"} onClick={() => setTheme({ radius: "24px" })}>
          Soft radius
        </button>
        <button type="button" className="min-h-11 px-3 text-sm text-muted" onClick={() => setTheme(DEFAULT_THEME)}>
          Reset theme
        </button>
      </div>
    </div>
  );
}
