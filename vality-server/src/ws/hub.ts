import type { WebSocket, WebSocketServer } from "ws";

export type ValityEvent =
  | { type: "mic_status"; listening: boolean }
  | { type: "interaction"; id: string; transcript: string; reply: string; audioUrl: string | null; ts: string }
  | { type: "error"; message: string; ts: string }
  // Befehle an die Handy-App, ueber denselben WS-Hub wie das Dashboard -
  // das Dashboard ignoriert unbekannte type-Werte einfach.
  | { type: "send_sms"; to: string; body: string }
  | { type: "place_call"; to: string }
  | { type: "resolve_contact"; requestId: string; name: string };

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
