import ValityMessaging from "../../modules/vality-messaging/src/ValityMessagingModule";
import { loadSettings } from "../storage/settings";

// Verbindung zum selben WebSocket-Hub, den auch das PC-Dashboard nutzt.
// Der PC schickt darueber "send_sms"-Befehle (Antwort auf einen per Sprache
// diktierten Text), die das Handy direkt ausfuehrt. Erfordert, dass die App
// im Vorder- oder Hintergrund laeuft - wird sie vom System vollstaendig
// beendet, kommen keine Befehle mehr an (kein Push-Service angebunden).
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = true;

interface SendSmsCommand {
  type: "send_sms";
  to: string;
  body: string;
}

function isSendSmsCommand(msg: unknown): msg is SendSmsCommand {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as Record<string, unknown>).type === "send_sms" &&
    typeof (msg as Record<string, unknown>).to === "string" &&
    typeof (msg as Record<string, unknown>).body === "string"
  );
}

async function handleCommand(msg: unknown): Promise<void> {
  if (!isSendSmsCommand(msg)) return;
  const settings = await loadSettings();
  if (!settings.smsEnabled) {
    console.warn("send_sms-Befehl erhalten, aber SMS-Feature ist auf dem Handy deaktiviert.");
    return;
  }
  try {
    await ValityMessaging.sendSms(msg.to, msg.body);
  } catch (err) {
    console.warn("SMS-Versand fehlgeschlagen:", err);
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
