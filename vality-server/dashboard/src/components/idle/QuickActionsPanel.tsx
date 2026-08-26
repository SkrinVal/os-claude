import { useState } from "react";
import { useHudDispatch, useHudState } from "../../state/store";
import HudFrame from "../layout/HudFrame";
import "./QuickActionsPanel.css";

// Nur echte, sofort wirksame Aktionen - keine Knoepfe, die auf ein noch
// nicht existierendes Backend-Feature verweisen.
export default function QuickActionsPanel() {
  const { audioMuted } = useHudState();
  const dispatch = useHudDispatch();
  const [fullscreen, setFullscreen] = useState(false);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  return (
    <HudFrame title="Schnellzugriff" className="quick-actions">
      <button type="button" className="quick-actions__btn" onClick={toggleFullscreen}>
        <span>Vollbild</span>
        <span className="mono quick-actions__state">{fullscreen ? "AN" : "AUS"}</span>
      </button>
      <button type="button" className="quick-actions__btn" onClick={() => dispatch({ type: "TOGGLE_MUTE" })}>
        <span>Automatische Wiedergabe</span>
        <span className={`mono quick-actions__state${audioMuted ? " quick-actions__state--off" : ""}`}>
          {audioMuted ? "STUMM" : "AN"}
        </span>
      </button>
      <button type="button" className="quick-actions__btn" onClick={() => dispatch({ type: "CLEAR_LOG" })}>
        <span>Logbuch leeren</span>
      </button>
    </HudFrame>
  );
}
