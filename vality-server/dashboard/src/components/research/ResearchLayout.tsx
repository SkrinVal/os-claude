import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHudDispatch, useHudState } from "../../state/store";
import { runResearch } from "../../services/wikipedia";
import CoreRing from "../core/CoreRing";
import HudFrame from "../layout/HudFrame";
import Skeleton from "../layout/Skeleton";
import SteckbriefCard from "./SteckbriefCard";
import "./ResearchLayout.css";

function SteckbriefSkeleton() {
  return (
    <HudFrame className="steckbrief-card">
      <div className="steckbrief-card__head">
        <Skeleton width={72} height={72} circle />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height={16} width="60%" />
          <Skeleton height={11} width="85%" />
        </div>
      </div>
      <Skeleton height={12} width="100%" />
      <Skeleton height={12} width="92%" />
      <Skeleton height={12} width="70%" />
    </HudFrame>
  );
}

export default function ResearchLayout() {
  const { research } = useHudState();
  const dispatch = useHudDispatch();
  const [input, setInput] = useState(research.query);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runResearch(dispatch, input);
  }

  return (
    <div className="research-layout">
      <div className="research-layout__corner">
        <CoreRing expanded={false} />
      </div>

      <button
        type="button"
        className="research-layout__back mono"
        onClick={() => dispatch({ type: "SET_MODE", mode: "idle" })}
      >
        ← ZURÜCK
      </button>

      <div className="research-layout__body">
        <h1 className="research-layout__title eyebrow">Recherche</h1>
        <form className="research-layout__search" onSubmit={onSubmit}>
          <input
            className="mono"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Name oder Begriff..."
            aria-label="Suchbegriff"
          />
          <button type="submit" className="mono" disabled={research.loading}>
            {research.loading ? "SUCHT…" : "SUCHEN"}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {research.loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SteckbriefSkeleton />
            </motion.div>
          )}
          {!research.loading && research.error && (
            <motion.p
              key="error"
              className="research-layout__status research-layout__status--error mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {research.error}
            </motion.p>
          )}
          {!research.loading && !research.error && research.results.length === 0 && (
            <motion.p key="empty" className="research-layout__status mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              NOCH KEINE SUCHE.
            </motion.p>
          )}
        </AnimatePresence>

        {research.results.map((result) => (
          <SteckbriefCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
