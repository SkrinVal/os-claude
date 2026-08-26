import type { Dispatch } from "react";
import type { Action } from "../state/store";
import type { CityMarker, CityWeather } from "../state/types";
import { describeFetchError } from "./networkError";

// WMO-Wettercode -> deutsche Kurzbeschreibung. Deckt die von Open-Meteo
// tatsaechlich gelieferten Codes ab (https://open-meteo.com/en/docs).
const WEATHER_CODE_LABEL: Record<number, string> = {
  0: "Klarer Himmel",
  1: "Überwiegend klar",
  2: "Teilweise bewölkt",
  3: "Bedeckt",
  45: "Nebel",
  48: "Reifnebel",
  51: "Leichter Nieselregen",
  53: "Nieselregen",
  55: "Starker Nieselregen",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  71: "Leichter Schneefall",
  73: "Schneefall",
  75: "Starker Schneefall",
  80: "Regenschauer",
  81: "Kräftige Regenschauer",
  82: "Heftige Regenschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Schweres Gewitter mit Hagel",
};

// Echte, kostenlose Open-Meteo-API - kein API-Key, CORS-faehig.
export async function fetchWeather(city: CityMarker): Promise<CityWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(city.lat));
  url.searchParams.set("longitude", String(city.lng));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wetterdienst antwortet mit Status ${res.status}`);
  const data = await res.json();
  const current = data.current;
  if (!current) throw new Error("Wetterdienst hat keine aktuellen Daten geliefert.");

  return {
    city,
    temperatureC: current.temperature_2m,
    weatherCode: current.weather_code,
    description: WEATHER_CODE_LABEL[current.weather_code] ?? "Unbekannte Wetterlage",
    windKph: current.wind_speed_10m,
    isDay: current.is_day === 1,
  };
}

// Gemeinsame Fokus-Pipeline (Auswahl + Wetterabruf) - genutzt vom Klick auf
// Marker/Stadtliste im Globus-Modus wie vom kommenden Sprachbefehl-
// Ausloeser ("ui_mode"-Event, siehe useVoiceSocket.ts). Das Fly-to auf dem
// Globus selbst bleibt Sache von GlobeLayout (braucht den Globus-Ref).
export async function focusCity(dispatch: Dispatch<Action>, city: CityMarker): Promise<void> {
  dispatch({ type: "GLOBE_FOCUS_CITY", city });
  try {
    const weather = await fetchWeather(city);
    dispatch({ type: "GLOBE_WEATHER_SUCCESS", weather });
  } catch (err) {
    dispatch({ type: "GLOBE_WEATHER_ERROR", error: describeFetchError(err) });
  }
}
