import { createContext, useContext, useRef } from "react";

interface StaggerCounter {
  current: number;
}

// Erlaubt Panels, die ueber sechs verschiedene Section-Komponenten verteilt
// gemountet werden, trotzdem eine fortlaufende Reihenfolge fuer eine
// Kaskaden-Eintrittsanimation zu bekommen - ohne den Index manuell durch
// jede einzelne Section-Komponente durchreichen zu muessen.
export const StaggerContext = createContext<StaggerCounter | null>(null);

export function useStaggerDelay(stepMs = 55, maxDelayMs = 330): number {
  const ctx = useContext(StaggerContext);
  const indexRef = useRef<number | null>(null);
  if (indexRef.current === null) {
    indexRef.current = ctx ? ctx.current++ : 0;
  }
  return Math.min(indexRef.current * stepMs, maxDelayMs);
}
