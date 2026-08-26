import { HudStoreProvider, useHudDispatch, useHudState } from "./state/store";
import { useVoiceSocket } from "./hooks/useVoiceSocket";
import { useSystemStatus, useInitialHistory } from "./hooks/useSystemStatus";
import TopBar from "./components/layout/TopBar";
import ErrorToast from "./components/layout/ErrorToast";
import IdleLayout from "./components/idle/IdleLayout";
import DebugPanel from "./components/debug/DebugPanel";
import "./App.css";

function Dashboard() {
  const { mode, debugOpen } = useHudState();
  const dispatch = useHudDispatch();

  useVoiceSocket();
  useSystemStatus();
  useInitialHistory();

  return (
    <div className="app">
      <TopBar onToggleDebug={() => dispatch({ type: "TOGGLE_DEBUG" })} />
      <main className="app__main">{mode === "idle" && <IdleLayout />}</main>
      <ErrorToast />
      <DebugPanel open={debugOpen} />
    </div>
  );
}

export default function App() {
  return (
    <HudStoreProvider>
      <Dashboard />
    </HudStoreProvider>
  );
}
