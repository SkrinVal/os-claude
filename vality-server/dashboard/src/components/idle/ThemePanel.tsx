import { useState } from "react";
import { ACCENTS, applyAccent, loadSavedAccent, type AccentId } from "../../services/theme";
import HudFrame from "../layout/HudFrame";
import "./ThemePanel.css";

export default function ThemePanel({ delay }: { delay?: number }) {
  const [active, setActive] = useState<AccentId>(() => loadSavedAccent());

  function select(id: AccentId) {
    applyAccent(id);
    setActive(id);
  }

  return (
    <HudFrame title="Design" className="theme-panel" delay={delay}>
      <div className="theme-panel__swatches">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`theme-panel__swatch${a.id === active ? " theme-panel__swatch--active" : ""}`}
            style={{ ["--swatch-color" as string]: a.accent }}
            onClick={() => select(a.id)}
            aria-label={`Akzentfarbe ${a.label}`}
            aria-pressed={a.id === active}
          >
            <span className="theme-panel__swatch-dot" />
            <span className="theme-panel__swatch-label mono">{a.label}</span>
          </button>
        ))}
      </div>
    </HudFrame>
  );
}
