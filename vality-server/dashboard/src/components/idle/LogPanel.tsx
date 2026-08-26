import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useHudState } from "../../state/store";
import HudFrame from "../layout/HudFrame";
import "./LogPanel.css";

// Kurze relative Zeit statt nur der Uhrzeit ("vor 2 Min" liest sich in
// einem Live-Log schneller als "14:37") - die exakte Uhrzeit steht per
// Hover/title weiterhin zur Verfuegung.
function formatRelative(ts: string, now: number): string {
  const diffSec = Math.max(0, Math.round((now - new Date(ts).getTime()) / 1000));
  if (diffSec < 10) return "gerade eben";
  if (diffSec < 60) return `vor ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function LogPanel({ delay }: { delay?: number }) {
  const { log } = useHudState();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <HudFrame title="Logbuch" className="log-panel" delay={delay}>
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
              <div className="log-panel__ts mono" title={new Date(entry.ts).toLocaleString("de-DE")}>
                {formatRelative(entry.ts, now)}
              </div>
              <div className="log-panel__you">DU: {entry.transcript}</div>
              <div className="log-panel__reply">VALITY: {entry.reply}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </HudFrame>
  );
}
