import { motion } from "framer-motion";
import { useHudDispatch, useHudState } from "../../state/store";
import type { HudMode } from "../../state/types";
import "./ModeSwitcher.css";

const MODES: { id: HudMode; label: string }[] = [
  { id: "idle", label: "Übersicht" },
  { id: "research", label: "Recherche" },
  { id: "globe", label: "Globus" },
];

// Staendig sichtbare Navigation - vorher waren Recherche/Globus nur ueber
// das Debug-Panel oder Sprachbefehle erreichbar, ohne beides zu kennen kam
// man da nie hin. Jetzt ein normaler, immer sichtbarer Modus-Umschalter.
export default function ModeSwitcher() {
  const { mode } = useHudState();
  const dispatch = useHudDispatch();

  return (
    <nav className="mode-switcher" aria-label="Ansicht wechseln">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mode-switcher__btn mono${mode === m.id ? " mode-switcher__btn--active" : ""}`}
          onClick={() => dispatch({ type: "SET_MODE", mode: m.id })}
          aria-current={mode === m.id ? "page" : undefined}
        >
          {/* Ein einzelnes layoutId-Element wandert zwischen den Buttons hin
              und her, statt dass die Hervorhebung pro Button hart ein-/
              ausgeblendet wird - macht den Moduswechsel im HUD sichtbar
              statt nur den Text-/Farbwechsel. */}
          {mode === m.id && (
            <motion.span
              layoutId="mode-switcher-pill"
              className="mode-switcher__pill"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="mode-switcher__label">{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
