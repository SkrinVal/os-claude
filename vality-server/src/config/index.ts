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

  memory: {
    // Wie viele Interaktionen insgesamt auf der Platte behalten werden.
    maxConversationTurns: Number(process.env.MEMORY_MAX_CONVERSATION_TURNS ?? 200),
    // Wie viele der letzten Interaktionen als Kurzzeit-Kontext in jeden
    // claude -p Aufruf eingebaut werden.
    contextConversationTurns: Number(process.env.MEMORY_CONTEXT_CONVERSATION_TURNS ?? 6),
    // Wie viele Fakten hoechstens gleichzeitig in den Prompt-Kontext wandern.
    contextFactsLimit: Number(process.env.MEMORY_CONTEXT_FACTS_LIMIT ?? 20),
    // Fakten, die laenger als so viele Monate nicht mehr referenziert wurden,
    // werden beim Sweep als "stale" markiert (nicht geloescht).
    staleAfterMonths: Number(process.env.MEMORY_STALE_AFTER_MONTHS ?? 6),
  },

  presence: {
    // Muss mit dem Token uebereinstimmen, das die Handy-App in den
    // Einstellungen fuer den Server hinterlegt hat. Ohne Token (leer)
    // nimmt der Server JEDES Geraet im Netz an - nur fuer schnelles
    // lokales Testen akzeptabel, sonst unbedingt setzen.
    token: process.env.PRESENCE_TOKEN ?? "",
  },

  messages: {
    // Ob eingehende Nachrichten (SMS/WhatsApp-Vorschau) per Piper vorgelesen
    // werden. false = nur loggen/im Dashboard zeigen, nicht vorlesen.
    readAloud: (process.env.MESSAGES_READ_ALOUD ?? "true") !== "false",
    // Vor dem tatsaechlichen SMS-Versand per Sprache bestaetigen lassen
    // ("Ja, senden"). Auf false stellen, um das zu ueberspringen.
    confirmBeforeSend: (process.env.MESSAGES_CONFIRM_BEFORE_SEND ?? "true") !== "false",
  },

  calls: {
    // Vor dem tatsaechlichen Anruf per Sprache bestaetigen lassen ("Ja").
    confirmBeforeCall: (process.env.CALLS_CONFIRM_BEFORE_CALL ?? "true") !== "false",
    // Wie lange auf die Kontakt-Antwort des Handys gewartet wird, bevor
    // "Handy nicht erreichbar" statt eines Treffers zurueckkommt.
    contactResolveTimeoutMs: Number(process.env.CALLS_CONTACT_RESOLVE_TIMEOUT_MS ?? 6000),
  },

  dataDir: path.resolve(__dirname, "..", "..", "data"),
  tmpDir: path.resolve(__dirname, "..", "..", "data", "tmp"),
  audioOutDir: path.resolve(__dirname, "..", "..", "data", "audio-out"),
};
