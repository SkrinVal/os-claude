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
}

const STORAGE_KEY = "vality.settings.v1";

export const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: "",
  presenceToken: "",
  presenceEnabled: false,
  home: null,
  whatsappEnabled: false,
  smsEnabled: false,
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
