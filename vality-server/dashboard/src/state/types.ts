export type HudMode = "idle" | "research" | "globe";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface LogEntry {
  id: string;
  transcript: string;
  reply: string;
  ts: string;
}

export interface SystemStatus {
  hostname: string;
  uptimeSec: number;
  cpuCount: number;
  loadAvg1m: number;
  freeMemMb: number;
  totalMemMb: number;
}

export interface ResearchResult {
  id: string;
  name: string;
  kind: string;
  summary: string;
  facts: string[];
  sourceUrl?: string;
}

export interface CityMarker {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface CityWeather {
  city: CityMarker;
  temperatureC: number;
  weatherCode: number;
  description: string;
  windKph: number;
  isDay: boolean;
}

export interface HudState {
  mode: HudMode;
  voiceState: VoiceState;
  voiceLabel: string;
  connected: boolean;
  micLevel: number;
  log: LogEntry[];
  system: SystemStatus | null;
  research: {
    query: string;
    results: ResearchResult[];
    loading: boolean;
    error: string | null;
  };
  globe: {
    focusCity: CityMarker | null;
    weather: CityWeather | null;
    loading: boolean;
    error: string | null;
  };
  debugOpen: boolean;
  audioMuted: boolean;
}
