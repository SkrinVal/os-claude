import { AnimatePresence, motion } from "framer-motion";
import { useHudState } from "../../state/store";
import "./DebugPanel.css";

// Entwickler-Einblick in den aktuellen State, plus (sobald gebaut) die
// manuellen Modus-Trigger fuer research/globe, solange das Backend noch
// keine echten Ausloeser dafuer sendet.
export default function DebugPanel({ open }: { open: boolean }) {
  const state = useHudState();

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
            Modus-Umschalter für „research" und „globe" folgen mit diesen
            Ausbaustufen. Bis dahin steuert nur das Backend-Event
            „ui_mode" (noch nicht gesendet) oder direkte State-Tests.
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
