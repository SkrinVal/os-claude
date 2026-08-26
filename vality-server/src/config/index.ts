import "dotenv/config";
import path from "node:path";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Fehlende Umgebungsvariable: ${name} (siehe .env.example)`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4390),
  host: process.env.HOST ?? "0.0.0.0",

  whisper: {
    bin: required("WHISPER_BIN", "whisper-cli"),
    model: required("WHISPER_MODEL"),
    lang: process.env.WHISPER_LANG ?? "auto",
  },

  claude: {
    bin: process.env.CLAUDE_BIN ?? "claude",
    extraArgs: (process.env.CLAUDE_EXTRA_ARGS ?? "").split(" ").filter(Boolean),
    timeoutMs: Number(process.env.CLAUDE_TIMEOUT_MS ?? 60000),
  },

  piper: {
    bin: required("PIPER_BIN", "piper"),
    model: required("PIPER_MODEL"),
    modelConfig: process.env.PIPER_CONFIG,
  },

  dataDir: path.resolve(__dirname, "..", "..", "data"),
  tmpDir: path.resolve(__dirname, "..", "..", "data", "tmp"),
  audioOutDir: path.resolve(__dirname, "..", "..", "data", "audio-out"),
};
