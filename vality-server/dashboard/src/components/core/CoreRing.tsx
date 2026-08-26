import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useHudState } from "../../state/store";
import { useMicRecorder } from "../../hooks/useMicRecorder";
import "./CoreRing.css";

const TICK_COUNT = 48;
const BAR_COUNT = 28;
const ORBIT_COUNT = 2;

const STATE_LABEL: Record<string, string> = {
  idle: "BEREIT",
  listening: "HÖRT ZU",
  thinking: "DENKT NACH",
  speaking: "SPRICHT",
  error: "FEHLER",
};

const ACTION_LABEL: Record<string, string> = {
  idle: "TIPPEN ZUM SPRECHEN",
  listening: "TIPPEN ZUM STOPPEN",
  thinking: "BITTE WARTEN",
  speaking: "SPRICHT GERADE",
  error: "TIPPEN ZUM SCHLIESSEN",
};

interface CoreRingProps {
  /** true = grosse zentrale Darstellung (Idle), false = verkleinert in eine Ecke. */
  expanded: boolean;
}

// Das zentrale HUD-Widget. Groesse/Position werden ueber Framer Motion
// animiert, damit spaetere Modi (research/globe) den Ring sanft in eine
// Ecke verkleinern koennen, statt ihn ein-/auszublenden - er bleibt immer
// als aktiver Status-Indikator sichtbar (siehe Aufgabenstellung).
export default function CoreRing({ expanded }: CoreRingProps) {
  const { voiceState, micLevel } = useHudState();
  const { toggle } = useMicRecorder();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.code === "Space" && !e.repeat && !isTyping) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const ticks = useMemo(() => {
    return Array.from({ length: TICK_COUNT }, (_, i) => {
      const angle = (i / TICK_COUNT) * Math.PI * 2;
      const major = i % 6 === 0;
      const r1 = major ? 93 : 96;
      const r2 = 100;
      return {
        key: i,
        major,
        x1: 100 + r1 * Math.cos(angle),
        y1: 100 + r1 * Math.sin(angle),
        x2: 100 + r2 * Math.cos(angle),
        y2: 100 + r2 * Math.sin(angle),
      };
    });
  }, []);

  // Feste Basisgeometrie plus zufaelliges Eigengewicht pro Balken - einmalig
  // ermittelt, damit der "Spektrum"-Kranz organisch statt symmetrisch-steril
  // wirkt, aber bei jedem Render stabil bleibt (kein Flackern der Form).
  const bars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const r0 = 62;
      const weight = 0.35 + Math.random() * 0.75;
      const idleDelay = Math.round(Math.random() * 240) / 100;
      return {
        key: i,
        weight,
        idleDelay,
        x1: 100 + r0 * Math.cos(angle),
        y1: 100 + r0 * Math.sin(angle),
        x2: 100 + (r0 + 5) * Math.cos(angle),
        y2: 100 + (r0 + 5) * Math.sin(angle),
      };
    });
  }, []);

  const orbits = useMemo(
    () =>
      Array.from({ length: ORBIT_COUNT }, (_, i) => ({
        key: i,
        reverse: i % 2 === 1,
        offset: (i / ORBIT_COUNT) * 200,
        durationBase: 16 + i * 5,
      })),
    []
  );

  // Der Ring zeigt immer einen kurzen, festen Status - die ausfuehrliche
  // Fehlermeldung (kann beliebig lang sein, z.B. ein Server-Stacktrace)
  // steht separat im ErrorToast, damit sie den Ring nicht sprengt.
  const label = STATE_LABEL[voiceState] ?? STATE_LABEL.idle;
  const action = ACTION_LABEL[voiceState] ?? ACTION_LABEL.idle;
  const innerScale = 1 + micLevel * 0.22;
  // micLevel spiegelt live den tatsaechlichen Pegel wider - beim Zuhoeren
  // das Mikrofon, beim Antworten die Wiedergabe (siehe useMicRecorder).
  const barBoost = voiceState === "listening" || voiceState === "speaking" ? micLevel : 0;

  return (
    <motion.div
      className="core-ring"
      data-state={voiceState}
      data-expanded={expanded}
      layout
      layoutId="core-ring"
      transition={{ type: "spring", stiffness: 170, damping: 22 }}
      style={{ width: expanded ? "min(58vw, 260px)" : "104px", height: expanded ? "min(58vw, 260px)" : "104px" }}
    >
      <div className="core-ring__halo core-ring__halo--a" aria-hidden="true" />
      <div className="core-ring__halo core-ring__halo--b" aria-hidden="true" />
      <div className="core-ring__pulse" aria-hidden="true" />

      <svg className="core-ring__svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle className="core-ring__ring core-ring__ring--outer" cx="100" cy="100" r="94" />
        <circle className="core-ring__ring core-ring__ring--mid" cx="100" cy="100" r="76" />
        <g className="core-ring__ticks">
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={t.major ? "core-ring__tick core-ring__tick--major" : "core-ring__tick"}
            />
          ))}
        </g>

        <g className="core-ring__bars">
          {bars.map((b) => (
            <line
              key={b.key}
              x1={b.x1}
              y1={b.y1}
              x2={b.x2}
              y2={b.y2}
              className="core-ring__bar"
              style={{
                transform: `scale(${1 + barBoost * b.weight * 2.4})`,
                transformOrigin: `${b.x1}px ${b.y1}px`,
                ["--bar-delay" as string]: `${b.idleDelay}s`,
              }}
            />
          ))}
        </g>

        {orbits.map((o) => (
          <g
            key={o.key}
            className={`core-ring__orbit${o.reverse ? " core-ring__orbit--rev" : ""}`}
            style={{ transformOrigin: "100px 100px", animationDuration: `${o.durationBase}s`, animationDelay: `-${o.offset}ms` }}
          >
            <circle className="core-ring__orbit-dot" cx="100" cy="7" r="2.1" />
          </g>
        ))}

        <motion.circle
          className="core-ring__ring core-ring__ring--inner"
          cx="100"
          cy="100"
          r="56"
          animate={{ scale: innerScale }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ transformOrigin: "100px 100px" }}
        />
      </svg>

      <button type="button" className="core-ring__button" onClick={toggle} aria-label={action}>
        {expanded ? (
          <>
            <span className="core-ring__brand mono">VALITY</span>
            <span className="core-ring__status mono">
              <span className={`core-ring__status-dot core-ring__status-dot--${voiceState}`} />
              {label}
            </span>
            <span className="core-ring__action mono">{action}</span>
          </>
        ) : (
          <span className={`core-ring__status-dot core-ring__status-dot--${voiceState} core-ring__status-dot--solo`} />
        )}
      </button>
    </motion.div>
  );
}
