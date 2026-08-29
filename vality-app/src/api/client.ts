import { loadSettings } from "../storage/settings";

export class ApiError extends Error {}

// Kleiner fetch-Wrapper zum Vality-Server im lokalen Netz. Server-URL und
// Bearer-Token kommen aus den lokal gespeicherten Einstellungen, nicht
// hartcodiert - jede Installation zeigt auf ihren eigenen PC.
export async function postToServer(pathname: string, body: unknown): Promise<unknown> {
  const settings = await loadSettings();
  if (!settings.serverUrl) {
    throw new ApiError("Keine Server-URL in den Einstellungen hinterlegt.");
  }

  const url = new URL(pathname, settings.serverUrl).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.presenceToken ? { Authorization: `Bearer ${settings.presenceToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(`Server antwortete mit ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}
