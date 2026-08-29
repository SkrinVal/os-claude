import { AnimatePresence, motion } from "framer-motion";
import { useHudDispatch, useHudState } from "../../state/store";
import type { HudMode } from "../../state/types";
import "./DebugPanel.css";

const MODES: { id: HudMode; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "research", label: "Recherche" },
  { id: "globe", label: "Globus" },
];

// Entwickler-Einblick in den aktuellen State, plus manueller Modus-
// Umschalter fuer research/globe, solange das Backend noch keine echten
// Sprachbefehl-Ausloeser dafuer sendet ("ui_mode"-Event, vorbereitet in
// useVoiceSocket.ts, aber noch nicht serverseitig gebaut).
export default function DebugPanel({ open }: { open: boolean }) {
  const state = useHudState();
  const dispatch = useHudDispatch();

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="debug-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
        >
          <h2 className="eyebrow debug-panel__title">Debug</h2>

          <div className="debug-panel__modes">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`debug-panel__mode-btn mono${state.mode === m.id ? " debug-panel__mode-btn--active" : ""}`}
                onClick={() => dispatch({ type: "SET_MODE", mode: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>

          <dl className="debug-panel__grid mono">
            <dt>mode</dt>
            <dd>{state.mode}</dd>
            <dt>voiceState</dt>
            <dd>{state.voiceState}</dd>
            <dt>connected</dt>
            <dd>{String(state.connected)}</dd>
            <dt>log entries</dt>
            <dd>{state.log.length}</dd>
            <dt>micLevel</dt>
            <dd>{state.micLevel.toFixed(2)}</dd>
          </dl>
          <p className="debug-panel__note">
            Manuelles Umschalten zum Testen. Im echten Betrieb geht das auch
            per Sprachbefehl (feste Formulierungen oder frei, siehe
            hud/nlIntent.ts) oder über den Umschalter in der Kopfzeile.
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
