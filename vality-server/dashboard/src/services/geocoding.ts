import type { Dispatch } from "react";
import type { Action } from "../state/store";
import type { CityMarker } from "../state/types";
import { describeFetchError } from "./networkError";
import { focusCity } from "./weather";

// Echte, kostenlose Open-Meteo-Geocoding-API - kein API-Key, CORS-faehig.
// Loest JEDEN Ortsnamen auf, nicht nur eine feste Liste ("keine
// Vorschlaege wie Berlin" - der Globus soll auf jede genannte Stadt
// reagieren koennen, nicht nur auf eine vorausgewaehlte Handvoll).
export async function geocodeCity(name: string): Promise<CityMarker> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Kein Ortsname angegeben.");

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "de");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Ortssuche antwortet mit Status ${res.status}`);
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) throw new Error(`Kein Ort namens „${trimmed}" gefunden.`);

  return {
    id: `geo-${hit.id ?? hit.latitude + "," + hit.longitude}`,
    name: hit.name,
    country: hit.country ?? "",
    lat: hit.latitude,
    lng: hit.longitude,
  };
}

// Gemeinsame Pipeline fuer die freie Ortssuche (manuelles Suchfeld im
// Globus-Modus wie der Sprachbefehl-Ausloeser "ui_mode" mit city-Namen) -
// geokodiert und fokussiert in einem Schritt.
export async function geocodeAndFocusCity(dispatch: Dispatch<Action>, name: string): Promise<void> {
  // lat/lng noch unbekannt (NaN) - der Globus fliegt erst los, sobald die
  // echte Position da ist (siehe Number.isFinite-Check in GlobeLayout.tsx).
  // Bis dahin zeigt das Wetter-Panel ehrlich "LÄDT…", weil globe.loading
  // ueber GLOBE_FOCUS_CITY schon true ist.
  dispatch({ type: "GLOBE_FOCUS_CITY", city: { id: "pending", name: name.trim(), country: "", lat: NaN, lng: NaN } });
  try {
    const city = await geocodeCity(name);
    await focusCity(dispatch, city);
  } catch (err) {
    dispatch({ type: "GLOBE_WEATHER_ERROR", error: describeFetchError(err) });
  }
}
