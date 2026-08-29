export interface PlaceWeather {
  temperatureC: number;
  description: string;
  windKph: number;
  isDay: boolean;
}

// Gleiche WMO-Code-Zuordnung wie dashboard/src/services/weather.ts (gleicher
// Wortlaut, damit gesprochener und angezeigter Text zusammenpassen) - deckt
// die von Open-Meteo tatsaechlich gelieferten Codes ab
// (https://open-meteo.com/en/docs). Bewusst dupliziert statt geteilt: Server
// und Dashboard sind zwei getrennte npm-Pakete ohne gemeinsames Build, eine
// Mini-Konstante hier extra zu verpacken waere mehr Aufwand als Nutzen.
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

// Serverseitiges Pendant zu dashboard/src/services/weather.ts - gleiche
// Werte, gleicher Wortlaut wie die Wetter-Karte im Globus-Modus.
export async function fetchPlaceWeather(lat: number, lng: number): Promise<PlaceWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wetterdienst antwortet mit Status ${res.status}`);
  const data = (await res.json()) as {
    current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number; is_day: number };
  };
  const current = data.current;
  if (!current) throw new Error("Wetterdienst hat keine aktuellen Daten geliefert.");

  return {
    temperatureC: current.temperature_2m,
    description: WEATHER_CODE_LABEL[current.weather_code] ?? "unbekannter Wetterlage",
    windKph: current.wind_speed_10m,
    isDay: current.is_day === 1,
  };
}
