import CoreRing from "../core/CoreRing";
import LogPanel from "./LogPanel";
import SystemPanel from "./SystemPanel";
import QuickActionsPanel from "./QuickActionsPanel";
import "./IdleLayout.css";

export default function IdleLayout() {
  return (
    <div className="idle-layout">
      <div className="idle-layout__aside idle-layout__aside--left">
        <SystemPanel delay={0.05} />
        <QuickActionsPanel delay={0.14} />
      </div>

      <div className="idle-layout__core">
        <CoreRing expanded />
      </div>

      <div className="idle-layout__aside idle-layout__aside--right">
        <LogPanel delay={0.1} />
      </div>
    </div>
  );
}
