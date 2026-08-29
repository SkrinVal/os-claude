import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useMemoryFacts, type MemoryFact } from "../../hooks/useMemoryFacts";
import { formatRelative } from "../../utils/formatRelative";
import HudFrame from "../layout/HudFrame";
import Skeleton from "../layout/Skeleton";
import "./MemoryPanel.css";

// Reihenfolge der Fakten (neueste zuerst vom Server) bestimmt, welche
// Kategorie zuerst erscheint - kein zusaetzliches Sortierkriterium noetig.
function groupByCategory(facts: MemoryFact[]): [string, MemoryFact[]][] {
  const groups = new Map<string, MemoryFact[]>();
  for (const fact of facts) {
    const list = groups.get(fact.category);
    if (list) list.push(fact);
    else groups.set(fact.category, [fact]);
  }
  return Array.from(groups.entries());
}

// Macht "Lernen" sichtbar statt einem unsichtbaren Hintergrundvorgang -
// "GELERNT" markiert Fakten, die Vality beilaeufig aus einem Gespraech
// aufgeschnappt hat (hud/nlIntent.ts), "GESAGT" die per "Merk dir, dass..."
// diktierten. Nach Kategorie gruppiert, mit Loesch-Knopf pro Fakt - fuer
// den groben Aufraeum-Fall bleibt zusaetzlich der Sprachbefehl "Vergiss X".
export default function MemoryPanel({ delay }: { delay?: number }) {
  const { facts, loading, error, remove } = useMemoryFacts();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => groupByCategory(facts), [facts]);

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

      {grouped.map(([category, items]) => (
        <div key={category} className="memory-panel__group">
          <h3 className="memory-panel__group-title mono">{category}</h3>
          <ul className="memory-panel__list">
            <AnimatePresence initial={false}>
              {items.map((fact) => (
                <motion.li
                  key={fact.id}
                  className="memory-panel__item"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
                >
                  <div className="memory-panel__item-main">
                    <span className="memory-panel__content">{fact.content}</span>
                    <span className="memory-panel__meta mono" title={new Date(fact.createdAt).toLocaleString("de-DE")}>
                      {formatRelative(fact.createdAt, now)}
                    </span>
                  </div>
                  <div className="memory-panel__item-actions">
                    <span className={`memory-panel__badge mono${fact.source === "learned" ? " memory-panel__badge--learned" : ""}`}>
                      {fact.source === "learned" ? "GELERNT" : "GESAGT"}
                    </span>
                    <button
                      type="button"
                      className="memory-panel__delete"
                      onClick={() => remove(fact.id)}
                      aria-label={`„${fact.content}" vergessen`}
                      title="Vergessen"
                    >
                      ×
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ))}
    </HudFrame>
  );
}
