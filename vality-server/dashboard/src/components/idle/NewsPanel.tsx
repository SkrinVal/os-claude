import { AnimatePresence, motion } from "framer-motion";
import { useHudDispatch } from "../../state/store";
import { useNews } from "../../hooks/useNews";
import HudFrame from "../layout/HudFrame";
import "./NewsPanel.css";

function formatTime(pubDate: string | null): string {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function NewsPanel({ delay }: { delay?: number }) {
  const { items, loading, error } = useNews();
  const dispatch = useHudDispatch();

  return (
    <HudFrame className="news-panel" delay={delay}>
      <div className="news-panel__head">
        <h2 className="eyebrow news-panel__title">
          <span className="news-panel__live" aria-hidden="true" />
          Nachrichten
        </h2>
        <button
          type="button"
          className="news-panel__globe-btn mono"
          onClick={() => dispatch({ type: "SET_MODE", mode: "globe" })}
        >
          GLOBUS ÖFFNEN ↗
        </button>
      </div>

      <div className="news-panel__list">
        {loading && items.length === 0 && <p className="news-panel__hint mono">LÄDT…</p>}
        {!loading && error && <p className="news-panel__hint news-panel__hint--error mono">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="news-panel__hint mono">Keine Meldungen verfügbar.</p>
        )}
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.a
              key={item.link}
              className="news-panel__item"
              href={item.link}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 0.9, 0.32, 1] }}
            >
              <span className="news-panel__item-title">{item.title}</span>
              <span className="news-panel__item-meta mono">
                {item.source}
                {formatTime(item.pubDate) && ` · ${formatTime(item.pubDate)}`}
              </span>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </HudFrame>
  );
}
