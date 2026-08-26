import { AnimatePresence, motion } from "framer-motion";
import { useMemoryFacts } from "../../hooks/useMemoryFacts";
import HudFrame from "../layout/HudFrame";
import Skeleton from "../layout/Skeleton";
import "./MemoryPanel.css";

// Macht "Lernen" sichtbar statt einem unsichtbaren Hintergrundvorgang -
// "GELERNT" markiert Fakten, die Vality beilaeufig aus einem Gespraech
// aufgeschnappt hat (hud/nlIntent.ts), "GESAGT" die per "Merk dir, dass..."
// diktierten. Bewusst nur Anzeige, kein Loeschen hier - dafuer bleibt der
// Sprachbefehl "Vergiss X" zustaendig.
export default function MemoryPanel({ delay }: { delay?: number }) {
  const { facts, loading, error } = useMemoryFacts();

  return (
    <HudFrame title="Gedächtnis" className="memory-panel" delay={delay}>
      {loading && facts.length === 0 && (
        <div className="memory-panel__skeletons">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={12} width={`${82 - i * 12}%`} />
          ))}
        </div>
      )}
      {!loading && error && <p className="memory-panel__hint memory-panel__hint--error mono">{error}</p>}
      {!loading && !error && facts.length === 0 && (
        <p className="memory-panel__hint mono">Noch nichts gemerkt. Sag „Merk dir, dass …".</p>
      )}
      <ul className="memory-panel__list">
        <AnimatePresence initial={false}>
          {facts.map((fact, i) => (
            <motion.li
              key={fact.id}
              className="memory-panel__item"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: [0.22, 0.9, 0.32, 1] }}
            >
              <span className="memory-panel__content">{fact.content}</span>
              <span className={`memory-panel__badge mono${fact.source === "learned" ? " memory-panel__badge--learned" : ""}`}>
                {fact.source === "learned" ? "GELERNT" : "GESAGT"}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </HudFrame>
  );
}
