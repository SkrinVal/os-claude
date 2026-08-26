export type AccentId = "cyan" | "violet" | "amber" | "emerald" | "rose";

interface AccentDef {
  id: AccentId;
  label: string;
  accent: string;
  accentDim: string;
  accentRgb: string;
}

// Fuenf Akzentfarben-Presets - nur die Akzentfarbe wechselt (Hintergrund,
// Text, Status-Farben bleiben stabil), damit jede Kombination lesbar und
// im Rahmen der bestehenden HUD-Sprache bleibt.
export const ACCENTS: AccentDef[] = [
  { id: "cyan", label: "Cyan", accent: "#22d3ee", accentDim: "#0e6d80", accentRgb: "34, 211, 238" },
  { id: "violet", label: "Violet", accent: "#a78bfa", accentDim: "#5b4b96", accentRgb: "167, 139, 250" },
  { id: "amber", label: "Amber", accent: "#ff9d3d", accentDim: "#8a5220", accentRgb: "255, 157, 61" },
  { id: "emerald", label: "Smaragd", accent: "#34d399", accentDim: "#1a6b52", accentRgb: "52, 211, 153" },
  { id: "rose", label: "Rose", accent: "#fb7185", accentDim: "#8a3d47", accentRgb: "251, 113, 133" },
];

const STORAGE_KEY = "vality-accent";
const DEFAULT_ACCENT: AccentId = "cyan";

export function applyAccent(id: AccentId): void {
  const def = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  const root = document.documentElement.style;
  root.setProperty("--accent", def.accent);
  root.setProperty("--accent-dim", def.accentDim);
  root.setProperty("--accent-rgb", def.accentRgb);
  root.setProperty("--accent-soft", `rgba(${def.accentRgb}, 0.12)`);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Speicher kann blockiert sein (privater Modus/Artefakt-Sandbox) - die
    // Auswahl gilt dann nur fuer diese Sitzung, kein Fehler noetig.
  }
}

export function loadSavedAccent(): AccentId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ACCENTS.some((a) => a.id === saved)) return saved as AccentId;
  } catch {
    // ignore
  }
  return DEFAULT_ACCENT;
}
