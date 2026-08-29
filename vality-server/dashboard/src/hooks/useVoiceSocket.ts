import { useEffect, useRef } from "react";
import { useHudDispatch, useHudState } from "../state/store";
import { claimInteraction } from "../state/interactionGate";

// Verbindet mit demselben WebSocket-Hub, den auch die Handy-App nutzt.
// Kennt die bestehenden Event-Typen (interaction/error/mic_status) und ist
// auf den zukuenftigen "ui_mode"-Typ vorbereitet, den das Backend noch
// nicht sendet (Recherche-/Globus-Modus werden bisher nur ueber das
// Debug-Panel ausgeloest, siehe DebugPanel.tsx).
type IncomingEvent =
  | { type: "mic_status"; listening: boolean }
  | {
      type: "interaction";
      id: string;
      transcript: string;
      reply: string;
      audioUrl: string | null;
      ts: string;
      kind?: "briefing";
    }
  | { type: "error"; message: string; ts: string }
  | UiModeEvent;

export type UiModeEvent =
  | { type: "ui_mode"; mode: "idle" }
  | { type: "ui_mode"; mode: "research"; query: string }
  | { type: "ui_mode"; mode: "globe"; city?: string };

export function useVoiceSocket(onModeEvent?: (event: UiModeEvent) => void) {
  const dispatch = useHudDispatch();
  const { audioMuted } = useHudState();
  const onModeEventRef = useRef(onModeEvent);
  onModeEventRef.current = onModeEvent;
  const mutedRef = useRef(audioMuted);
  mutedRef.current = audioMuted;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      const proto = location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${proto}://${location.host}/ws`);

      socket.onopen = () => dispatch({ type: "SET_CONNECTED", connected: true });
      socket.onclose = () => {
        dispatch({ type: "SET_CONNECTED", connected: false });
        reconnectTimer = setTimeout(connect, 2000);
      };
      socket.onerror = () => socket?.close();

      socket.onmessage = (event) => {
        let msg: IncomingEvent;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "interaction") {
          // Vom Server auch direkt per HTTP an die eigene Aufnahme
          // beantwortet (siehe useMicRecorder.ts) - nicht doppelt behandeln.
          if (!claimInteraction(msg.id)) return;
          dispatch({
            type: "ADD_LOG_ENTRY",
            entry: { id: msg.id, transcript: msg.transcript, reply: msg.reply, ts: msg.ts, kind: msg.kind },
          });
          if (msg.audioUrl && !mutedRef.current) {
            const audio = new Audio(msg.audioUrl);
            audio.play().catch(() => {
              console.warn("Autoplay blockiert - einmal auf die Seite klicken, dann geht es.");
            });
          }
        } else if (msg.type === "error") {
          dispatch({ type: "SET_VOICE_STATE", state: "error", label: msg.message });
          setTimeout(() => dispatch({ type: "SET_VOICE_STATE", state: "idle", label: "BEREIT" }), 3000);
        } else if (msg.type === "ui_mode") {
          onModeEventRef.current?.(msg);
        }
      };
    }

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [dispatch]);
}
