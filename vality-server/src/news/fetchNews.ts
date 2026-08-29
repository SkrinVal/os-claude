import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
}

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string;
}

// Tagesschau-RSS: oeffentlich, kostenlos, kein API-Key - eine der wenigen
// deutschen Nachrichtenquellen mit stabilem, dokumentiertem RSS-Feed.
// Serverseitig geholt, damit das Dashboard es ohne CORS-Sorgen anzeigen
// kann (die meisten RSS-Feeds setzen keine CORS-Header fuers Aufrufen aus
// dem Browser).
const FEED_URL = "https://www.tagesschau.de/xml/rss2/";
const SOURCE_NAME = "Tagesschau";
const MAX_ITEMS = 8;

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchFeed(): Promise<NewsItem[]> {
  const res = await fetch(FEED_URL, { headers: { "User-Agent": "vality-server/0.1" } });
  if (!res.ok) throw new Error(`Feed antwortet mit Status ${res.status}`);
  const xml = await res.text();

  const parsed = parser.parse(xml);
  const rawItems: RssItem[] = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .filter((it) => it && it.title && it.link)
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      title: String(it.title).trim(),
      link: String(it.link).trim(),
      pubDate: it.pubDate ? String(it.pubDate).trim() : null,
      source: SOURCE_NAME,
    }));
}

// Kurzer In-Memory-Cache - das Dashboard pollt regelmaessig, der Feed selbst
// aendert sich nicht im Sekundentakt.
export async function getNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }
  const items = await fetchFeed();
  cache = { items, fetchedAt: Date.now() };
  return items;
}

// Google-News-RSS-Suche: einzige oeffentliche, kostenlose Quelle, die zu
// JEDEM beliebigen Ort/Land echte, aktuelle Treffer liefert - kein API-Key,
// deckt Sprachbefehle zu jeder genannten Stadt/jedem Land ab, nicht nur
// eine feste Vorauswahl. hl/gl/ceid=DE sorgt fuer deutschsprachige
// Ergebnisse, passend zum Rest des Dashboards.
const LOCATION_FEED_BASE = "https://news.google.com/rss/search";
const MAX_LOCATION_ITEMS = 6;
const LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;
const LOCATION_CACHE_MAX_ENTRIES = 50;

const locationCache = new Map<string, { items: NewsItem[]; fetchedAt: number }>();

// Google News haengt den Publisher-Namen oft doppelt an - einmal im
// <source>-Tag, einmal als " - Publisher"-Suffix im Titel. Fuers Dashboard
// reicht der Titel ohne das Suffix, der Publisher steht schon separat in
// der Meta-Zeile.
function stripSourceSuffix(title: string, source: string): string {
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

export async function getNewsForLocation(query: string): Promise<NewsItem[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Kein Ort angegeben.");
  const key = trimmed.toLowerCase();

  const cached = locationCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < LOCATION_CACHE_TTL_MS) {
    return cached.items;
  }

  const url = new URL(LOCATION_FEED_BASE);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("hl", "de");
  url.searchParams.set("gl", "DE");
  url.searchParams.set("ceid", "DE:de");

  const res = await fetch(url.toString(), { headers: { "User-Agent": "vality-server/0.1" } });
  if (!res.ok) throw new Error(`Nachrichtensuche antwortet mit Status ${res.status}`);
  const xml = await res.text();

  const parsed = parser.parse(xml);
  const rawItems: RssItem[] = parsed?.rss?.channel?.item ?? [];
  const rawList = Array.isArray(rawItems) ? rawItems : [rawItems];

  const items = rawList
    .filter((it) => it && it.title && it.link)
    .slice(0, MAX_LOCATION_ITEMS)
    .map((it) => {
      const source = it.source ? String(it.source).trim() : "Google News";
      return {
        title: stripSourceSuffix(String(it.title).trim(), source),
        link: String(it.link).trim(),
        pubDate: it.pubDate ? String(it.pubDate).trim() : null,
        source,
      };
    });

  // Cache-Groesse deckeln - bei vielen verschiedenen Orten soll das nicht
  // unbegrenzt wachsen. Map behaelt Einfuegereihenfolge, der aelteste
  // Eintrag fliegt zuerst raus (einfaches FIFO statt echtem LRU).
  if (locationCache.size >= LOCATION_CACHE_MAX_ENTRIES) {
    const oldestKey = locationCache.keys().next().value;
    if (oldestKey !== undefined) locationCache.delete(oldestKey);
  }
  locationCache.set(key, { items, fetchedAt: Date.now() });
  return items;
}
