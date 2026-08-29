import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HomeLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AppSettings {
  serverUrl: string;
  // Ein gemeinsames Geraete-Token fuer alle Server-Endpunkte (Presence,
  // Messages, ...) - eine Installation, ein Geheimnis.
  presenceToken: string;
  presenceEnabled: boolean;
  home: HomeLocation | null;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  // Vom Nutzer gewaehlter Kalender fuer per Sprachbefehl angelegte Termine
  // (siehe features/calendar/). null = automatisch waehlen (bevorzugt den
  // primaeren Account-Kalender), sonst die ID des gewaehlten Kalenders.
  calendarId: string | null;
  // "Hi Jarvis"-Weckwort im Hintergrund (siehe features/wakeword/). Braucht
  // einen kostenlosen AccessKey von console.picovoice.ai.
  wakeWordEnabled: boolean;
  picovoiceAccessKey: string;
}

const STORAGE_KEY = "vality.settings.v1";

export const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: "",
  presenceToken: "",
  presenceEnabled: false,
  home: null,
  whatsappEnabled: false,
  smsEnabled: false,
  calendarId: null,
  wakeWordEnabled: false,
  picovoiceAccessKey: "",
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
