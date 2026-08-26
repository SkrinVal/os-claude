import { useEffect, useState } from "react";
import "./BootSequence.css";

const BOOT_LINES = [
  "Kernsysteme werden geladen",
  "Core-Ring kalibriert",
  "Audio-Analyse verbunden",
  "Spracherkennung bereit",
  "WebSocket-Verbindung hergestellt",
  "Wikipedia-Schnittstelle aktiv",
  "Geocoding-Dienst verbunden",
  "Globus-Textur geladen",
  "Alle Systeme bereit",
];

const LINE_INTERVAL_MS = 170;
const HOLD_AFTER_MS = 450;
const FADE_MS = 500;

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (leaving) return;
    if (visibleCount >= BOOT_LINES.length) {
      const t = setTimeout(() => setLeaving(true), HOLD_AFTER_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), LINE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [visibleCount, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, FADE_MS);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  useEffect(() => {
    function skip() {
      setLeaving(true);
    }
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  const progress = Math.round((visibleCount / BOOT_LINES.length) * 100);

  return (
    <div className={`boot${leaving ? " boot--leaving" : ""}`} onClick={() => setLeaving(true)} role="presentation">
      <div className="boot__glyph" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <circle className="boot__glyph-ring boot__glyph-ring--outer" cx="100" cy="100" r="80" />
          <circle className="boot__glyph-ring boot__glyph-ring--mid" cx="100" cy="100" r="60" />
          <circle className="boot__glyph-ring boot__glyph-ring--inner" cx="100" cy="100" r="38" />
        </svg>
      </div>

      <div className="boot__wordmark mono">VALITY AI</div>

      <div className="boot__log mono">
        {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
          <div key={line} className="boot__log-line" style={{ animationDelay: `${i * 0.02}s` }}>
            <span className="boot__log-ok">[OK]</span> {line}
          </div>
        ))}
      </div>

      <div className="boot__progress">
        <div className="boot__progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="boot__progress-label mono">{progress}%</div>

      <div className="boot__skip mono">TIPPEN ODER BELIEBIGE TASTE ZUM ÜBERSPRINGEN</div>
    </div>
  );
}
