import { useMemo } from "react";
import "./AbstractAvatar.css";

// Rein geometrisch generierter Avatar aus dem Namen abgeleitet - bewusst
// KEIN Foto und KEIN Versuch, eine Person oder Figur darzustellen. Gleicher
// Name ergibt immer dasselbe Muster (deterministischer Hash), unterschied-
// liche Namen sehen sichtbar verschieden aus.
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function AbstractAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const shapes = useMemo(() => {
    const h = hashString(name);
    const hueA = h % 360;
    const hueB = (hueA + 40 + (h >> 8) % 80) % 360;
    const ringCount = 3 + (h % 3);
    const rings = Array.from({ length: ringCount }, (_, i) => {
      const seed = h >> (i * 5);
      return {
        key: i,
        cx: 50 + (((seed >> 2) % 30) - 15),
        cy: 50 + (((seed >> 4) % 30) - 15),
        r: 12 + ((seed >> 6) % 26),
        rotate: (seed >> 1) % 360,
        opacity: 0.22 + ((seed % 40) / 100),
      };
    });
    return { hueA, hueB, rings };
  }, [name]);

  return (
    <div className="abstract-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={`grad-${shapes.hueA}-${shapes.hueB}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${shapes.hueA} 70% 22%)`} />
            <stop offset="100%" stopColor={`hsl(${shapes.hueB} 65% 14%)`} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={`url(#grad-${shapes.hueA}-${shapes.hueB})`} />
        {shapes.rings.map((r) => (
          <circle
            key={r.key}
            cx={r.cx}
            cy={r.cy}
            r={r.r}
            fill="none"
            stroke={`hsl(${shapes.hueA} 80% 65%)`}
            strokeWidth="1.4"
            opacity={r.opacity}
            transform={`rotate(${r.rotate} ${r.cx} ${r.cy})`}
          />
        ))}
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      </svg>
    </div>
  );
}
