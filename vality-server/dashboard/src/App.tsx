import { lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HudStoreProvider, useHudDispatch, useHudState } from "./state/store";
import { useVoiceSocket, type UiModeEvent } from "./hooks/useVoiceSocket";
import { useSystemStatus, useInitialHistory } from "./hooks/useSystemStatus";
import { runResearch } from "./services/wikipedia";
import { focusCity } from "./services/weather";
import { CITIES } from "./data/cities";
import TopBar from "./components/layout/TopBar";
import ErrorToast from "./components/layout/ErrorToast";
import IdleLayout from "./components/idle/IdleLayout";
import ResearchLayout from "./components/research/ResearchLayout";
import DebugPanel from "./components/debug/DebugPanel";
import "./App.css";

// three.js/react-globe.gl sind schwer (~600 kB gzip) - erst laden, wenn der
// Globus-Modus tatsaechlich betreten wird, damit Idle/Recherche schlank
// bleiben.
const GlobeLayout = lazy(() => import("./components/globe/GlobeLayout"));

const viewTransition = { duration: 0.28, ease: [0.22, 0.9, 0.32, 1] as const };

function Dashboard() {
  const { mode, debugOpen } = useHudState();
  const dispatch = useHudDispatch();

  // Sobald das Backend echte Sprachbefehl-Trigger sendet ("wer ist X" /
  // "Wetter in X" / "oeffne die Weltkarte"), landen sie hier als "ui_mode"-
  // Event und schalten den Modus genauso um wie die Debug-Panel-Knoepfe.
  const onModeEvent = useCallback(
    (event: UiModeEvent) => {
      if (event.mode === "idle") {
        dispatch({ type: "SET_MODE", mode: "idle" });
      } else if (event.mode === "research") {
        dispatch({ type: "SET_MODE", mode: "research" });
        runResearch(dispatch, event.query);
      } else if (event.mode === "globe") {
        dispatch({ type: "SET_MODE", mode: "globe" });
        const known = CITIES.find((c) => c.id === event.city.id) ?? event.city;
        focusCity(dispatch, known);
      }
    },
    [dispatch]
  );

  useVoiceSocket(onModeEvent);
  useSystemStatus();
  useInitialHistory();

  return (
    <div className="app">
      <TopBar onToggleDebug={() => dispatch({ type: "TOGGLE_DEBUG" })} />
      <main className="app__main">
        <AnimatePresence mode="popLayout">
          {mode === "idle" && (
            <motion.div
              key="idle"
              className="app__view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={viewTransition}
            >
              <IdleLayout />
            </motion.div>
          )}
          {mode === "research" && (
            <motion.div
              key="research"
              className="app__view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={viewTransition}
            >
              <ResearchLayout />
            </motion.div>
          )}
          {mode === "globe" && (
            <motion.div
              key="globe"
              className="app__view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={viewTransition}
            >
              <Suspense fallback={<div className="app__view-loading mono">LÄDT GLOBUS…</div>}>
                <GlobeLayout />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
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
