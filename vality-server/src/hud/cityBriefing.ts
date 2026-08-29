import { geocodePlace } from "../places/geocode";
import { fetchPlaceWeather } from "../places/weather";
import { getNewsForLocation } from "../news/fetchNews";

const MAX_HEADLINES = 3;

// Wenn per Sprachbefehl ein Ort genannt wird, soll Vality nicht nur den
// Globus dorthin fliegen lassen, sondern wie ein echtes Briefing erst ueber
// das Wetter und danach ueber die wichtigsten Nachrichten sprechen - in
// dieser Reihenfolge. Alle Werte kommen aus echten Abrufen (Open-Meteo,
// Google-News-Suche), nichts wird geschaetzt. Schlaegt ein Abruf fehl,
// faellt der jeweilige Satz einfach weg statt eine Fehlermeldung
// vorzulesen - nur wenn der Ort selbst nicht gefunden wird, bleibt es beim
// alten kurzen Hinweis.
export async function buildCityBriefing(cityName: string): Promise<string> {
  let place;
  try {
    place = await geocodePlace(cityName);
  } catch {
    return `Ich zeige dir ${cityName} auf dem Globus.`;
  }

  const [weather, news] = await Promise.all([
    fetchPlaceWeather(place.lat, place.lng).catch(() => null),
    getNewsForLocation([place.name, place.country].filter(Boolean).join(" ")).catch(() => []),
  ]);

  const sentences = [`Ich zeige dir ${place.name} auf dem Globus.`];

  if (weather) {
    sentences.push(
      `Aktuell ${Math.round(weather.temperatureC)} Grad, ${weather.description}. Der Wind weht mit ${Math.round(weather.windKph)} Stundenkilometern.`
    );
  }

  const headlines = news.slice(0, MAX_HEADLINES).map((n) => n.title);
  if (headlines.length > 0) {
    sentences.push(`Die wichtigsten Nachrichten aus ${place.name}: ${headlines.join(". ")}.`);
  }

  return sentences.join(" ");
}
