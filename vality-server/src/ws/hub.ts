import type { WebSocket, WebSocketServer } from "ws";

export type ValityEvent =
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
  // Schaltet den Dashboard-Modus per Sprachbefehl um (siehe hud/commands.ts).
  // "city" ist bewusst nur ein Name, keine Koordinaten - das Dashboard
  // loest ihn selbst per Geocoding auf, der Server braucht dafuer keinen
  // eigenen API-Key.
  | { type: "ui_mode"; mode: "idle" }
  | { type: "ui_mode"; mode: "research"; query: string }
  | { type: "ui_mode"; mode: "globe"; city?: string }
  // Befehle an die Handy-App, ueber denselben WS-Hub wie das Dashboard -
  // das Dashboard ignoriert unbekannte type-Werte einfach.
  | { type: "send_sms"; to: string; body: string }
  | { type: "place_call"; to: string }
  | { type: "resolve_contact"; requestId: string; name: string }
  // Termine landen NICHT mehr serverseitig gespeichert, sondern direkt im
  // echten Kalender des Nutzers (Handy-App schreibt ueber expo-calendar) -
  // dasselbe Anfrage/Antwort-Muster wie resolve_contact: Server broadcastet,
  // die Handy-App antwortet per REST (siehe routes/calendar.ts).
  | { type: "create_calendar_event"; requestId: string; title: string; startAt: string; endAt: string; notes?: string }
  | { type: "list_calendar_events"; requestId: string };

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function attachWebSocketServer(server: WebSocketServer): void {
  wss = server;
  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
  });
}

export function broadcast(event: ValityEvent): void {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}
