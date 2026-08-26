import ValityMessaging from "../../modules/vality-messaging/src/ValityMessagingModule";
import { loadSettings } from "../storage/settings";
import { findContactsByName } from "../features/contacts/lookup";
import { postToServer } from "../api/client";

// Verbindung zum selben WebSocket-Hub, den auch das PC-Dashboard nutzt.
// Der PC schickt darueber Befehle (SMS-Antwort senden, Kontakt aufloesen,
// Anruf starten), die das Handy direkt ausfuehrt. Erfordert, dass die App
// im Vorder- oder Hintergrund laeuft - wird sie vom System vollstaendig
// beendet, kommen keine Befehle mehr an (kein Push-Service angebunden).
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = true;

type Command =
  | { type: "send_sms"; to: string; body: string }
  | { type: "place_call"; to: string }
  | { type: "resolve_contact"; requestId: string; name: string };

function asCommand(msg: unknown): Command | null {
  if (typeof msg !== "object" || msg === null) return null;
  const m = msg as Record<string, unknown>;
  if (m.type === "send_sms" && typeof m.to === "string" && typeof m.body === "string") {
    return { type: "send_sms", to: m.to, body: m.body };
  }
  if (m.type === "place_call" && typeof m.to === "string") {
    return { type: "place_call", to: m.to };
  }
  if (m.type === "resolve_contact" && typeof m.requestId === "string" && typeof m.name === "string") {
    return { type: "resolve_contact", requestId: m.requestId, name: m.name };
  }
  return null;
}

async function handleCommand(raw: unknown): Promise<void> {
  const command = asCommand(raw);
  if (!command) return;
  const settings = await loadSettings();

  if (command.type === "send_sms") {
    if (!settings.smsEnabled) {
      console.warn("send_sms-Befehl erhalten, aber SMS-Feature ist auf dem Handy deaktiviert.");
      return;
    }
    try {
      await ValityMessaging.sendSms(command.to, command.body);
    } catch (err) {
      console.warn("SMS-Versand fehlgeschlagen:", err);
    }
    return;
  }

  if (command.type === "place_call") {
    try {
      await ValityMessaging.placeCall(command.to);
    } catch (err) {
      console.warn("Anruf fehlgeschlagen:", err);
    }
    return;
  }

  if (command.type === "resolve_contact") {
    try {
      const matches = await findContactsByName(command.name);
      await postToServer("/api/contacts/resolve", { requestId: command.requestId, matches });
    } catch (err) {
      console.warn("Kontakt-Aufloesung fehlgeschlagen:", err);
      // Trotzdem eine leere Antwort schicken, damit der Server nicht bis
      // zum Timeout wartet.
      await postToServer("/api/contacts/resolve", { requestId: command.requestId, matches: [] }).catch(() => {});
    }
  }
}

async function connect(): Promise<void> {
  if (stopped) return;
  const settings = await loadSettings();
  if (!settings.serverUrl) {
    scheduleReconnect();
    return;
  }

  const wsUrl = settings.serverUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/ws";
  try {
    socket = new WebSocket(wsUrl);
  } catch (err) {
    scheduleReconnect();
    return;
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data));
      handleCommand(msg);
    } catch (err) {
      // Nicht-JSON oder unbekannte Nachricht - ignorieren.
    }
  };
  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect(): void {
  if (stopped || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 5000);
}

export function startCommandListener(): void {
  stopped = false;
  connect();
}

export function stopCommandListener(): void {
  stopped = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}
