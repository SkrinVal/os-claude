import type { CSSProperties, ReactNode } from "react";
import "./HudFrame.css";

interface HudFrameProps {
  title?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Eckenklammern-Panel statt voller Box - das durchgaengige Bauelement fuer
// jede Flaeche im HUD (Idle-Panels, Recherche-Karten, Globus-Overlay, ...).
export default function HudFrame({ title, children, className, style }: HudFrameProps) {
  return (
    <div className={`hud-frame${className ? ` ${className}` : ""}`} style={style}>
      <span className="hud-frame__corner hud-frame__corner--tl" />
      <span className="hud-frame__corner hud-frame__corner--tr" />
      <span className="hud-frame__corner hud-frame__corner--bl" />
      <span className="hud-frame__corner hud-frame__corner--br" />
      {title && <h2 className="hud-frame__title eyebrow">{title}</h2>}
      <div className="hud-frame__body">{children}</div>
    </div>
  );
}
