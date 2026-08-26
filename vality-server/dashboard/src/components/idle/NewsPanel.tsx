import { useHudDispatch } from "../../state/store";
import { useNews } from "../../hooks/useNews";
import HudFrame from "../layout/HudFrame";
import NewsList from "../shared/NewsList";
import "./NewsPanel.css";

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

      <NewsList items={items} loading={loading} error={error} emptyHint="Keine Meldungen verfügbar." />
    </HudFrame>
  );
}
