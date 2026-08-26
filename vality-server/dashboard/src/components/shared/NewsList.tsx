import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "../layout/Skeleton";
import type { NewsItem } from "../../hooks/useNews";
import "./NewsList.css";

function formatTime(pubDate: string | null): string {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

interface NewsListProps {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  emptyHint: string;
  skeletonCount?: number;
}

// Gemeinsame Liste fuer die globale Nachrichten-Karte (Uebersicht) und die
// ortsbezogene Nachrichten-Karte (Globus-Modus) - gleiches Aussehen, gleiche
// Lade-/Fehlerzustaende, nur die Datenquelle unterscheidet sich.
export default function NewsList({ items, loading, error, emptyHint, skeletonCount = 4 }: NewsListProps) {
  return (
    <div className="news-list">
      {loading && items.length === 0 && (
        <div className="news-list__skeletons">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} className="news-list__skeleton-item">
              <Skeleton height={13} width={`${86 - (i % 4) * 6}%`} />
              <Skeleton height={9} width="40%" />
            </div>
          ))}
        </div>
      )}
      {!loading && error && <p className="news-list__hint news-list__hint--error mono">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="news-list__hint mono">{emptyHint}</p>}
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.a
            key={item.link}
            className="news-list__item"
            href={item.link}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 0.9, 0.32, 1] }}
          >
            <span className="news-list__item-title">{item.title}</span>
            <span className="news-list__item-meta mono">
              {item.source}
              {formatTime(item.pubDate) && ` · ${formatTime(item.pubDate)}`}
            </span>
          </motion.a>
        ))}
      </AnimatePresence>
    </div>
  );
}
