import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type {
  CityMarker,
  CityWeather,
  HudMode,
  HudState,
  LogEntry,
  ResearchResult,
  SystemStatus,
  VoiceState,
} from "./types";

export type Action =
  | { type: "SET_MODE"; mode: HudMode }
  | { type: "SET_VOICE_STATE"; state: VoiceState; label: string }
  | { type: "SET_CONNECTED"; connected: boolean }
  | { type: "SET_MIC_LEVEL"; level: number }
  | { type: "ADD_LOG_ENTRY"; entry: LogEntry }
  | { type: "SET_LOG"; entries: LogEntry[] }
  | { type: "SET_SYSTEM"; status: SystemStatus }
  | { type: "RESEARCH_START"; query: string }
  | { type: "RESEARCH_SUCCESS"; results: ResearchResult[] }
  | { type: "RESEARCH_ERROR"; error: string }
  | { type: "GLOBE_FOCUS_CITY"; city: CityMarker }
  | { type: "GLOBE_WEATHER_SUCCESS"; weather: CityWeather }
  | { type: "GLOBE_WEATHER_ERROR"; error: string }
  | { type: "GLOBE_RESET" }
  | { type: "TOGGLE_DEBUG" }
  | { type: "TOGGLE_MUTE" }
  | { type: "CLEAR_LOG" };

const MAX_LOG_ENTRIES = 50;

const initialState: HudState = {
  mode: "idle",
  voiceState: "idle",
  voiceLabel: "BEREIT",
  connected: false,
  micLevel: 0,
  log: [],
  system: null,
  research: { query: "", results: [], loading: false, error: null },
  globe: { focusCity: null, weather: null, loading: false, error: null },
  debugOpen: false,
  audioMuted: false,
};

function reducer(state: HudState, action: Action): HudState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_VOICE_STATE":
      return { ...state, voiceState: action.state, voiceLabel: action.label };
    case "SET_CONNECTED":
      return { ...state, connected: action.connected };
    case "SET_MIC_LEVEL":
      return { ...state, micLevel: action.level };
    case "ADD_LOG_ENTRY":
      return { ...state, log: [action.entry, ...state.log].slice(0, MAX_LOG_ENTRIES) };
    case "SET_LOG":
      return { ...state, log: action.entries.slice(0, MAX_LOG_ENTRIES) };
    case "SET_SYSTEM":
      return { ...state, system: action.status };
    case "RESEARCH_START":
      return { ...state, research: { query: action.query, results: [], loading: true, error: null } };
    case "RESEARCH_SUCCESS":
      return { ...state, research: { ...state.research, results: action.results, loading: false } };
    case "RESEARCH_ERROR":
      return { ...state, research: { ...state.research, loading: false, error: action.error } };
    case "GLOBE_FOCUS_CITY":
      return { ...state, globe: { focusCity: action.city, weather: null, loading: true, error: null } };
    case "GLOBE_WEATHER_SUCCESS":
      return { ...state, globe: { ...state.globe, weather: action.weather, loading: false } };
    case "GLOBE_WEATHER_ERROR":
      return { ...state, globe: { ...state.globe, loading: false, error: action.error } };
    case "GLOBE_RESET":
      return { ...state, globe: { focusCity: null, weather: null, loading: false, error: null } };
    case "TOGGLE_DEBUG":
      return { ...state, debugOpen: !state.debugOpen };
    case "TOGGLE_MUTE":
      return { ...state, audioMuted: !state.audioMuted };
    case "CLEAR_LOG":
      return { ...state, log: [] };
    default:
      return state;
  }
}

const StateContext = createContext<HudState | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function HudStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useHudState(): HudState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useHudState muss innerhalb von HudStoreProvider aufgerufen werden.");
  return ctx;
}

export function useHudDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useHudDispatch muss innerhalb von HudStoreProvider aufgerufen werden.");
  return ctx;
}
