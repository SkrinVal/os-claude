export interface GeocodedPlace {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Serverseitiges Pendant zu dashboard/src/services/geocoding.ts - dieselbe
// kostenlose Open-Meteo-Geocoding-API (kein API-Key), damit der gesprochene
// Stadt-Briefing-Text (siehe hud/cityBriefing.ts) echte Koordinaten fuers
// Wetter bekommt. Laeuft unabhaengig vom Dashboard-eigenen Aufruf fuers
// Fliegen auf dem Globus - beide brauchen dieselbe Info, aber zu
// unterschiedlichen Zeitpunkten (Server antwortet sofort mit dem
// Sprachbefehl, das Dashboard holt sich seine Kopie beim "ui_mode"-Event).
export async function geocodePlace(name: string): Promise<GeocodedPlace> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Kein Ortsname angegeben.");

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "de");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Ortssuche antwortet mit Status ${res.status}`);
  const data = (await res.json()) as { results?: { name: string; country?: string; latitude: number; longitude: number }[] };
  const hit = data.results?.[0];
  if (!hit) throw new Error(`Kein Ort namens „${trimmed}" gefunden.`);

  return { name: hit.name, country: hit.country ?? "", lat: hit.latitude, lng: hit.longitude };
}
