import { useHudState } from "../../state/store";
import ModeSwitcher from "./ModeSwitcher";
import "./TopBar.css";

export default function TopBar({ onToggleDebug }: { onToggleDebug: () => void }) {
  const { connected } = useHudState();

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
