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
