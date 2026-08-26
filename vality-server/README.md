# Vality-Server

PC-"Brain" fuer das Vality AI Sprachassistenz-System. Nimmt Sprache per
Push-to-Talk entgegen, transkribiert lokal mit whisper.cpp, schickt den Text
an die Claude Code CLI (`claude -p`) und liest die Antwort per Piper (lokal,
offline) vor. Ein Web-Dashboard im Sci-Fi-HUD-Stil zeigt Mikrofon-Status,
Logbuch und System-Stats.

Kein eigenes LLM-API-Billing: Es wird ausschliesslich das bestehende
Claude-Abo ueber die lokal installierte `claude` CLI genutzt.

## Voraussetzungen (Windows)

1. **Node.js 20+** installieren (https://nodejs.org).
2. **Claude Code CLI** installiert und eingeloggt (`claude` im PATH,
   `claude -p "Hallo"` funktioniert im Terminal).
3. **whisper.cpp** kompilieren oder eine fertige Windows-Release-Executable
   besorgen (`whisper-cli.exe` bzw. `main.exe`) und ein GGML-Modell laden,
   z.B. `ggml-base.bin` (https://github.com/ggml-org/whisper.cpp).
4. **Piper** (Windows-Binary) plus eine Stimme herunterladen, z.B.
   `de_DE-thorsten-medium.onnx` (+ zugehoerige `.onnx.json`)
   (https://github.com/OHF-Voice/piper1-gpl bzw. rhasspy/piper Releases).

Alle drei Tools werden per `child_process.spawn` als externe CLI aufgerufen —
es gibt keine Cloud-Abhaengigkeit fuer STT/TTS.

## Installation

```bash
cd vality-server
npm install
cp .env.example .env
```

`.env` oeffnen und die Pfade zu `whisper-cli.exe`, dem Whisper-Modell,
`piper.exe` und dem Piper-Stimm-Modell auf die eigenen Speicherorte
anpassen (siehe Kommentare in `.env.example`).

## Starten (Entwicklung)

```bash
npm run dev
```

Der Server startet auf `http://localhost:4390` (Port in `.env` aenderbar)
und bindet auf `0.0.0.0`, damit die geplante Handy-App im selben WLAN
zugreifen kann.

## Testen

1. Browser oeffnen: `http://localhost:4390`
2. Mikrofon-Berechtigung erlauben.
3. Push-to-Talk-Kreis in der Mitte gedrueckt halten (Maus/Touch) oder
   Leertaste gedrueckt halten, sprechen, wieder loslassen.
4. Ablauf: Aufnahme → Upload an `/api/voice` → whisper.cpp transkribiert →
   Text geht an `claude -p` → Antwort wird mit Piper vertont → Dashboard
   zeigt den Eintrag im Logbuch und spielt die Antwort automatisch ab.

Kurztest der einzelnen Bausteine ohne Browser:

```bash
# Claude-Anbindung pruefen
node -e "require('./dist/brain/claude').askClaude('Sag Hallo').then(console.log)"
```
(erst `npm run build` ausfuehren, damit `dist/` existiert.)

## Feature-Flags

`config/features.json` schaltet Module unabhaengig voneinander an/aus:

```json
{
  "memory": true,
  "presence": false,
  "messages": false,
  "calls": false
}
```

`memory`, `presence` und `messages` existieren. Nach einer Aenderung an
der Datei den Server neu starten (kein Datei-Watcher, bewusst einfach
gehalten).

## Feature 1: Gedaechtnis

Lokales Gedaechtnis in JSON-Dateien unter `data/memory/` (keine Cloud-DB,
keine native Abhaengigkeit wie SQLite, damit `npm install` auf Windows ohne
Compiler durchlaeuft):

- `facts.json` — explizite Fakten (`{ id, category, content, source,
  createdAt, lastReferencedAt, referenceCount, status, staleSince? }`)
- `conversations.json` — die letzten Interaktionen als Kurzzeit-Gedaechtnis
  (`{ id, transcript, reply, ts }`), auf `MEMORY_MAX_CONVERSATION_TURNS`
  begrenzt

**Befehle** (per Sprache, vor dem eigentlichen `claude -p` abgefangen):

- „Merk dir, dass ich Vegetarier bin" → legt einen Fakt an, Kategorie
  aktuell immer `allgemein` (keine geratene Kategorisierung)
- „Was weißt du über Vegetarier" → durchsucht aktive Fakten nach Stichwort
- „Vergiss Vegetarier" → loescht den ersten passenden Fakt vollstaendig

Jeder normale `claude -p` Aufruf bekommt automatisch einen Kontext-Block
vorangestellt: `Bekannte Fakten über den Nutzer: ...` plus die letzten
`MEMORY_CONTEXT_CONVERSATION_TURNS` Interaktionen.

**Aufraeumen**: Fakten, die laenger als `MEMORY_STALE_AFTER_MONTHS` (Default
6) nicht referenziert wurden, werden beim Start und danach einmal taeglich
als `status: "stale"` markiert — nicht geloescht. Stale Fakten fliessen
nicht mehr in den Prompt-Kontext oder in „Was weißt du über X" ein, bleiben
aber in `facts.json` einsehbar. „Vergiss X" ist die einzige echte Loeschung.

### Testen

1. `npm run build && npm run dev`, Dashboard oeffnen.
2. Sprechen: „Merk dir, dass ich Vegetarier bin." → Antwort sollte
   „Gemerkt: ..." sein, `data/memory/facts.json` sollte einen neuen Eintrag
   haben.
3. Sprechen: „Was weißt du über Vegetarier" → sollte den Fakt zurueckgeben.
4. Eine unabhaengige Frage stellen (z.B. „Wie spät ist es") und pruefen,
   ob `data/memory/conversations.json` einen neuen Eintrag bekommen hat.
5. Sprechen: „Vergiss Vegetarier" → Fakt sollte aus `facts.json`
   verschwinden.
6. Ohne Browser, isolierter Test der reinen Logik:
   ```bash
   node -e "
   const { loadMemory } = require('./dist/memory/store');
   const { handleMemoryCommand } = require('./dist/memory/commands');
   (async () => {
     await loadMemory();
     console.log(await handleMemoryCommand('Merk dir, dass ich Vegetarier bin'));
     console.log(await handleMemoryCommand('Was weißt du über Vegetarier'));
   })();
   "
   ```
7. Feature abschalten: `memory: false` in `config/features.json`, Server
   neu starten → keine Kontext-Injection mehr, Befehle wie „Merk dir..."
   werden dann ganz normal als Frage an Claude weitergereicht.

Bekannte Einschraenkung: Die Befehlserkennung ist einfaches Pattern-Matching,
keine echte Sprachverarbeitung. Der gespeicherte Fakt ist der wortwoertlich
transkribierte Nebensatz nach „dass"/„merk dir" — bei ungewoehnlichen
Formulierungen kann das grammatikalisch holprig aussehen, inhaltlich bleibt
es aber das, was gesagt wurde.

## Feature 2: Anwesenheitserkennung

Server-Seite ist fertig, braucht die Handy-App (`vality-app/`, siehe deren
README) fuer echtes Geofencing. `POST /api/presence` mit Body
`{ "event": "arrived" | "left" }` und Header `Authorization: Bearer
<PRESENCE_TOKEN>` loest die Reaktion aus:

1. Antwortet dem Aufrufer sofort mit `202 { ok: true }` — die eigentliche
   Sprachgenerierung blockiert die Handy-App nicht.
2. Baut (falls `memory` aktiv ist) den bekannten Fakten-Kontext ein und
   fragt `claude -p` nach einer kurzen Begruessung/Verabschiedung.
3. Vertont die Antwort mit Piper, loggt sie ins Gedaechtnis (Kurzzeit-
   Verlauf) und broadcastet sie ans Dashboard, das sie automatisch abspielt.

`PRESENCE_TOKEN` in `.env` setzen (leer = kein Schutz, nur zum Testen -
sonst kann jedes Geraet im selben WLAN Events schicken), `presence: true`
in `config/features.json`.

### Testen

Ohne Handy, direkt per curl:

```bash
curl -X POST http://localhost:4390/api/presence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <dein PRESENCE_TOKEN>" \
  -d '{"event":"arrived"}'
```

Dashboard sollte einen neuen Eintrag `[Ankunft zuhause]` zeigen und die
Antwort automatisch vorlesen (Browser einmal angeklickt haben, sonst
blockiert Autoplay). Mit dem Handy: siehe `vality-app/README.md`.

## Feature 3: Nachrichten vorlesen & diktieren

Erfasst eingehende SMS und WhatsApp-Benachrichtigungsvorschauen (ueber die
Handy-App, echtes natives Android-Modul, siehe `vality-app/README.md`),
liest sie vor und kann diktierte SMS-Antworten tatsaechlich verschicken.

`POST /api/messages` (gleiche Token-Pruefung wie `/api/presence`, Body
`{ source: "sms" | "whatsapp", sender, body }`):

1. Antwortet sofort `202`, Vorlesen laeuft danach im Hintergrund.
2. Liest **woertlich** vor ("Neue Nachricht von X über SMS: ...") - bewusst
   ohne `claude -p`-Umformulierung, damit die tatsaechliche Nachricht
   ankommt, nicht eine Paraphrase davon. `MESSAGES_READ_ALOUD=false`
   schaltet das Vorlesen ab (Nachricht landet dann nur im internen
   Kurzverlauf, ohne Sprachausgabe).

**Sprachbefehle** (per Mikro am PC, vor `claude -p` abgefangen, gelten
immer fuer die zuletzt empfangene Nachricht - kein Namens-Lookup, das
kommt mit Feature 4):

- „Antworte, dass ich später komme" → bei SMS: fragt (wenn
  `MESSAGES_CONFIRM_BEFORE_SEND` nicht `false` ist) erst nach, sonst
  direkt gesendet. Bei WhatsApp: liest nur einen Textvorschlag vor, da es
  keine Sende-API gibt.
- „Ja, senden" / „Bestätigen" → bestaetigt eine wartende Antwort, schickt
  einen `send_sms`-Befehl per WebSocket ans Handy.
- „Abbrechen" / „Nein" → verwirft eine wartende Antwort. Ohne wartende
  Antwort wirkungslos (faellt normal an `claude -p` durch).

`messages: true` in `config/features.json`, `PRESENCE_TOKEN` in `.env`
(gleiches Token wie fuer Presence).

### Testen

Ohne Handy, Nachricht simulieren:

```bash
curl -X POST http://localhost:4390/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <dein PRESENCE_TOKEN>" \
  -d '{"source":"sms","sender":"+491701234567","body":"Kommst du noch?"}'
```

Dashboard sollte `[SMS von +491701234567]` zeigen und vorlesen. Danach am
Mikro „Antworte, dass ich in 10 Minuten da bin" sagen → Bestaetigungs-
Rueckfrage, dann „Ja, senden" → `send_sms` wird gebroadcastet (ohne
verbundenes Handy passiert dann sichtbar nichts weiter, das ist fuer den
reinen Server-Test schon ausreichend). Voller End-to-End-Test inklusive
tatsaechlichem SMS-Versand: siehe `vality-app/README.md`.

Isolierter Logiktest ohne Server:

```bash
node -e "
const { addMessage } = require('./dist/messages/store');
const { handleMessageCommand } = require('./dist/messages/commands');
(async () => {
  addMessage({ source: 'sms', sender: '+491701234567', body: 'Kommst du noch?', ts: new Date().toISOString() });
  console.log(await handleMessageCommand('Antworte, dass ich in 10 Minuten da bin'));
  console.log(await handleMessageCommand('Ja, senden'));
})();
"
```

## Produktions-Build

```bash
npm run build
npm start
```

## Projektstruktur

```
vality-server/
  config/
    features.json     Feature-Flags (memory/presence/messages/calls)
  src/
    config/       Umgebungsvariablen, Pfade, Feature-Flag-Loader
    stt/whisper.ts    whisper.cpp Aufruf (Speech-to-Text)
    brain/claude.ts   claude -p Aufruf (Antwort-Generierung)
    tts/piper.ts      Piper Aufruf (Text-to-Speech)
    memory/           Feature 1: Gedaechtnis (siehe oben)
      types.ts        Fact, ConversationTurn
      store.ts        JSON-Persistenz (atomare Writes)
      commands.ts     "Merk dir"/"Was weißt du über"/"Vergiss"
      context.ts      Kontext-Block fuer claude -p
      cleanup.ts       Stale-Sweep
    presence/         Feature 2: Anwesenheitserkennung
      reactions.ts    Begruessung/Verabschiedung generieren + vorlesen
    messages/         Feature 3: Nachrichten
      store.ts        Kurzverlauf (nur im Speicher, siehe vality-app/README.md)
      reactions.ts    Vorlesen eingehender Nachrichten
      commands.ts     "Antworte..."/"Ja, senden"/"Abbrechen"
    routes/           Express-Routen (/api/voice, /api/status, /api/history, /api/presence, /api/messages)
    ws/hub.ts         WebSocket-Broadcast fuer das Dashboard
    util/history.ts   In-Memory-Verlauf der letzten Interaktionen (Dashboard-Anzeige)
    index.ts          Server-Einstiegspunkt
  public/         Web-Dashboard (HTML/CSS/JS, Sci-Fi-HUD)
  data/tmp/       temporaere Audio-Uploads (wird geleert)
  data/audio-out/ erzeugte TTS-Antworten (wav)
  data/memory/    facts.json, conversations.json (nicht im Git, siehe .gitignore)
```

## Geplante Ausbaustufen

- Feature 4: Anrufe & Kurznachrichten per Sprachbefehl (mit Kontakt-
  Namensaufloesung, Bestaetigung vor dem Senden/Anrufen)
- Code-/Datei-Steuerung ueber die Claude Code CLI selbst
- System-Steuerung (Apps oeffnen, Lautstaerke)
- Timer & Erinnerungen mit proaktiver Sprachausgabe (node-cron)
- Wetter (Open-Meteo) & Kalender-Integration
