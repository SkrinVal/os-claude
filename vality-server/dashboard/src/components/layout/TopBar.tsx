import { useHudDispatch, useHudState } from "../../state/store";
import ModeSwitcher from "./ModeSwitcher";
import "./TopBar.css";

// Kurze, feste Labels statt state.voiceLabel - das kann bei Fehlern eine
// beliebig lange Server-Meldung sein (siehe useVoiceSocket), die den
// schmalen Topbar-Chip sprengen wuerde. Die ausfuehrliche Meldung steht
// weiterhin im ErrorToast.
const VOICE_LABEL: Record<string, string> = {
  idle: "BEREIT",
  listening: "HÖRT ZU",
  thinking: "DENKT NACH",
  speaking: "SPRICHT",
  error: "FEHLER",
};

export default function TopBar({ onToggleDebug }: { onToggleDebug: () => void }) {
  const { connected, voiceState, audioMuted } = useHudState();
  const dispatch = useHudDispatch();

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__dot" />
        VALITY&nbsp;AI
      </div>
      <div className="topbar__center">
        <ModeSwitcher />
      </div>
      <div className="topbar__right">
        <div className={`topbar__voice mono topbar__voice--${voiceState}`}>
          <span className="topbar__voice-dot" />
          <span className="topbar__voice-label">{VOICE_LABEL[voiceState] ?? VOICE_LABEL.idle}</span>
        </div>
        <button
          type="button"
          className={`topbar__icon-btn mono${audioMuted ? " topbar__icon-btn--off" : ""}`}
          onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
          aria-label={audioMuted ? "Wiedergabe stummgeschaltet - antippen zum Einschalten" : "Wiedergabe an - antippen zum Stummschalten"}
          aria-pressed={audioMuted}
          title={audioMuted ? "Wiedergabe stumm" : "Wiedergabe an"}
        >
          {audioMuted ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 7.5h3.2L11 4.2v11.6L7.2 12.5H4z" />
              <line x1="13" y1="7" x2="18" y2="13" />
              <line x1="18" y1="7" x2="13" y2="13" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 7.5h3.2L11 4.2v11.6L7.2 12.5H4z" />
              <path className="topbar__icon-wave" d="M14 7c1.1 1 1.1 5 0 6" />
              <path className="topbar__icon-wave" d="M16.2 5.2c2.2 2.3 2.2 7.3 0 9.6" />
            </svg>
          )}
        </button>
        <div className={`topbar__conn mono${connected ? " topbar__conn--up" : ""}`}>
          <span className="topbar__conn-dot" />
          {connected ? "VERBUNDEN" : "GETRENNT"}
        </div>
        <button className="topbar__debug mono" onClick={onToggleDebug} aria-label="Debug-Panel umschalten">
          DEBUG
        </button>
      </div>
    </header>
  );
}
