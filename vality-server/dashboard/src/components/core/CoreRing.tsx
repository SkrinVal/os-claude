import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useHudState } from "../../state/store";
import { useMicRecorder } from "../../hooks/useMicRecorder";
import "./CoreRing.css";

const BAR_COUNT = 26;
const RIB_COUNT = 46;
const ORBIT_COUNT = 2;
const CENTER = 100;

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

// Baut aus grob ueber den Kreis verteilten Punkten eine weiche geschlossene
// Kurve (Catmull-Rom -> kubische Bezier) - damit sieht die aeussere
// Membran organisch/leicht unregelmaessig statt wie ein perfekter Kreis
// aus (siehe Vorbild: bio-lumineszente Huelle statt technischem Ring).
function smoothClosedPath(points: [number, number][]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const [p0x, p0y] = at(i - 1);
    const [p1x, p1y] = at(i);
    const [p2x, p2y] = at(i + 1);
    const [p3x, p3y] = at(i + 2);
    const c1x = p1x + (p2x - p0x) / 6;
    const c1y = p1y + (p2y - p0y) / 6;
    const c2x = p2x - (p3x - p1x) / 6;
    const c2y = p2y - (p3y - p1y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2x.toFixed(2)} ${p2y.toFixed(2)} `;
  }
  return d + "Z";
}

function blobPoints(baseR: number, count: number, seed: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r =
      baseR +
      Math.sin(angle * 3 + seed) * baseR * 0.045 +
      Math.sin(angle * 5 + seed * 1.7) * baseR * 0.028 +
      Math.sin(angle * 2 + seed * 0.5) * baseR * 0.02;
    pts.push([CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]);
  }
  return pts;
}

// Dreiecksgitter aus Punkten innerhalb eines Radius - liest sich als
// Hex-/Netzwerkmuster im Kern (wie das Vorbild), ohne echte Sechsecke
// zeichnen zu muessen.
function hexDots(radius: number, spacing: number) {
  const dots: { x: number; y: number; depth: number }[] = [];
  const rows = Math.ceil(radius / (spacing * 0.866)) + 1;
  for (let row = -rows; row <= rows; row++) {
    const y = row * spacing * 0.866;
    const xOffset = row % 2 !== 0 ? spacing / 2 : 0;
    const cols = Math.ceil(radius / spacing) + 1;
    for (let col = -cols; col <= cols; col++) {
      const x = col * spacing + xOffset;
      const dist = Math.sqrt(x * x + y * y);
      if (dist <= radius) dots.push({ x: CENTER + x, y: CENTER + y, depth: 1 - dist / radius });
    }
  }
  return dots;
}

interface CoreRingProps {
  /** true = grosse zentrale Darstellung (Idle), false = verkleinert in eine Ecke. */
  expanded: boolean;
}

// Das zentrale HUD-Widget - bio-lumineszenter "Energiekern" statt
// technischem Radar-Ring: wabernde Membran, gerippter Kranz, Hex-Netzwerk
// mit Funken im Inneren. Groesse/Position werden ueber Framer Motion
// animiert, damit spaetere Modi (research/globe) den Ring sanft in eine
// Ecke verkleinern koennen, statt ihn ein-/auszublenden - er bleibt immer
// als aktiver Status-Indikator sichtbar.
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

  const membraneOuter = useMemo(() => smoothClosedPath(blobPoints(95, 16, 0)), []);
  const membraneInner = useMemo(() => smoothClosedPath(blobPoints(88, 13, 2.4)), []);

  const ribs = useMemo(() => {
    return Array.from({ length: RIB_COUNT }, (_, i) => {
      const angle = (i / RIB_COUNT) * Math.PI * 2;
      const r1 = 72;
      const r2 = 85;
      return {
        key: i,
        major: i % 4 === 0,
        x1: CENTER + r1 * Math.cos(angle),
        y1: CENTER + r1 * Math.sin(angle),
        x2: CENTER + r2 * Math.cos(angle),
        y2: CENTER + r2 * Math.sin(angle),
      };
    });
  }, []);

  const bars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const r0 = 61;
      const weight = 0.35 + Math.random() * 0.75;
      const idleDelay = Math.round(Math.random() * 240) / 100;
      return {
        key: i,
        weight,
        idleDelay,
        x1: CENTER + r0 * Math.cos(angle),
        y1: CENTER + r0 * Math.sin(angle),
        x2: CENTER + (r0 + 4.5) * Math.cos(angle),
        y2: CENTER + (r0 + 4.5) * Math.sin(angle),
      };
    });
  }, []);

  const orbits = useMemo(
    () =>
      Array.from({ length: ORBIT_COUNT }, (_, i) => ({
        key: i,
        reverse: i % 2 === 1,
        offset: (i / ORBIT_COUNT) * 200,
        durationBase: 18 + i * 6,
      })),
    []
  );

  const dots = useMemo(() => hexDots(48, 7.5), []);
  const sparkles = useMemo(() => {
    const seeds = [0.6, 2.1, 4.4, 5.3];
    return seeds.map((seed, i) => {
      const angle = seed * 1.7;
      const r = 14 + ((seed * 37) % 26);
      return {
        key: i,
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
        delay: (seed * 0.8) % 3,
      };
    });
  }, []);

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
        <defs>
          <radialGradient id="core-sphere-fill" cx="50%" cy="42%" r="60%">
            <stop offset="0%" style={{ stopColor: "rgba(var(--accent-rgb), 0.35)" }} />
            <stop offset="70%" style={{ stopColor: "rgba(var(--accent-rgb), 0.08)" }} />
            <stop offset="100%" style={{ stopColor: "rgba(var(--accent-rgb), 0)" }} />
          </radialGradient>
        </defs>

        {/* Wabernde Membran - zwei leicht unregelmaessige, gegenlaeufig
            rotierende Konturen statt eines technischen Kreisrings. */}
        <path d={membraneOuter} className="core-ring__membrane core-ring__membrane--outer" />
        <path d={membraneInner} className="core-ring__membrane core-ring__membrane--inner" />

        {/* Gerippter Kranz zwischen den Membranen. */}
        <g className="core-ring__ribs">
          {ribs.map((r) => (
            <line
              key={r.key}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              className={r.major ? "core-ring__rib core-ring__rib--major" : "core-ring__rib"}
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
                transform: `scale(${1 + barBoost * b.weight * 2.2})`,
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
            <circle className="core-ring__orbit-dot" cx="100" cy="8" r="2" />
          </g>
        ))}

        {/* Kern: gefuellte Sphaere mit Hex-Netzwerk und Funken - reagiert
            per Skalierung live auf den Mikrofon-/Wiedergabepegel. */}
        <motion.g animate={{ scale: innerScale }} transition={{ type: "spring", stiffness: 300, damping: 18 }} style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="50" fill="url(#core-sphere-fill)" />
          <circle cx="100" cy="100" r="50" className="core-ring__sphere-edge" />
          <g className="core-ring__hexdots">
            {dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={0.9} opacity={0.15 + d.depth * 0.55} />
            ))}
          </g>
          {sparkles.map((s) => (
            <circle key={s.key} cx={s.x} cy={s.y} r="1.6" className="core-ring__sparkle" style={{ ["--spark-delay" as string]: `${s.delay}s` }} />
          ))}
        </motion.g>
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
