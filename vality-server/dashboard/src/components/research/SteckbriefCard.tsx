import { motion } from "framer-motion";
import type { ResearchResult } from "../../state/types";
import HudFrame from "../layout/HudFrame";
import AbstractAvatar from "./AbstractAvatar";
import "./SteckbriefCard.css";

export default function SteckbriefCard({ result }: { result: ResearchResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 0.9, 0.32, 1] }}
    >
      <HudFrame className="steckbrief-card">
        <div className="steckbrief-card__head">
          <AbstractAvatar name={result.name} size={72} />
          <div>
            <h2 className="steckbrief-card__name">{result.name}</h2>
            <span className="steckbrief-card__kind eyebrow">{result.kind}</span>
          </div>
        </div>

        <p className="steckbrief-card__summary">{result.summary}</p>

        {result.facts.length > 0 && (
          <ul className="steckbrief-card__facts">
            {result.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}

        {result.sourceUrl && (
          <a className="steckbrief-card__source mono" href={result.sourceUrl} target="_blank" rel="noreferrer">
            QUELLE: WIKIPEDIA ↗
          </a>
        )}
      </HudFrame>
    </motion.div>
  );
}
