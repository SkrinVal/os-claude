import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HomeLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AppSettings {
  serverUrl: string;
  presenceToken: string;
  presenceEnabled: boolean;
  home: HomeLocation | null;
}

const STORAGE_KEY = "vality.settings.v1";

export const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: "",
  presenceToken: "",
  presenceEnabled: false,
  home: null,
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
