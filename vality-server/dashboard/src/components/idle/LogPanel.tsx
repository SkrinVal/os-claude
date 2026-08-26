import { AnimatePresence, motion } from "framer-motion";
import { useHudState } from "../../state/store";
import HudFrame from "../layout/HudFrame";
import "./LogPanel.css";

export default function LogPanel() {
  const { log } = useHudState();

  return (
    <HudFrame title="Logbuch" className="log-panel">
      <div className="log-panel__list">
        {log.length === 0 && <p className="log-panel__empty mono">Noch keine Interaktionen.</p>}
        <AnimatePresence initial={false}>
          {log.map((entry) => (
            <motion.div
              key={entry.id}
              className="log-panel__entry"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.9, 0.32, 1] }}
            >
              <div className="log-panel__ts mono">{new Date(entry.ts).toLocaleTimeString("de-DE")}</div>
              <div className="log-panel__you">DU: {entry.transcript}</div>
              <div className="log-panel__reply">VALITY: {entry.reply}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </HudFrame>
  );
}
