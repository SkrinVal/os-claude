import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";

export interface FeatureFlags {
  memory: boolean;
  presence: boolean;
  messages: boolean;
  calls: boolean;
  news: boolean;
}

const FEATURES_PATH = path.resolve(__dirname, "..", "..", "config", "features.json");

const DEFAULT_FLAGS: FeatureFlags = {
  memory: true,
  presence: false,
  messages: false,
  calls: false,
  news: true,
};

function readFlagsSync(): FeatureFlags {
  try {
    const raw = readFileSync(FEATURES_PATH, "utf-8");
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_FLAGS;
  }
}

// Beim Start einmal synchron geladen. Ein Server-Neustart ist noetig, damit
// eine Aenderung an config/features.json wirksam wird - das ist bewusst so
// einfach gehalten, kein Datei-Watcher.
export const features: FeatureFlags = readFlagsSync();

export async function readFeatureFlags(): Promise<FeatureFlags> {
  try {
    const raw = await fs.readFile(FEATURES_PATH, "utf-8");
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_FLAGS;
  }
}
