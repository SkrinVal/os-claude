# Vality-Server

PC-"Brain" fuer das Vality AI Sprachassistenz-System. Nimmt Sprache per
Push-to-Talk entgegen, transkribiert lokal mit whisper.cpp, schickt den Text
an die Claude Code CLI (`claude -p`) und liest die Antwort per Piper (lokal,
offline) vor. Ein kontextabhaengiges Sci-Fi-HUD-Dashboard (React, siehe
`dashboard/`) zeigt Mikrofon-Status, Logbuch und System-Stats - Details
und Farbpalette in `dashboard/README.md`.

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

**Dashboard einmalig bauen** (siehe auch `dashboard/README.md`):

```bash
cd dashboard
npm install
npm run build
cd ..
```

Baut nach `public/` - das ist jetzt reine Build-Ausgabe, keine Handarbeit
mehr. Ohne diesen Schritt liefert der Server unter `/` nichts aus.

## Starten (Entwicklung)

```bash
npm run dev
```

Der Server startet auf `http://localhost:4390` (Port in `.env` aenderbar)
und bindet auf `0.0.0.0`, damit die geplante Handy-App im selben WLAN
zugreifen kann.

## Testen

1. Browser oeffnen: `http://localhost:4390`
2. Auf den Core-Ring in der Mitte tippen (Maus/Touch) oder Leertaste
   druecken, sprechen, nochmal tippen/Leertaste zum Beenden.
3. Ablauf: Aufnahme → Upload an `/api/voice` → whisper.cpp transkribiert →
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
  "calls": false,
  "news": true
}
```

Alle fuenf Module existieren. Nach einer Aenderung an der Datei den Server
neu starten (kein Datei-Watcher, bewusst einfach gehalten).

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
immer fuer die zuletzt empfangene Nachricht - fuer eine Antwort an einen
namentlich genannten Kontakt siehe Feature 4, „Schreib X, dass..."):

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
const { handleConfirmCommand } = require('./dist/shared/confirmCommands');
(async () => {
  addMessage({ source: 'sms', sender: '+491701234567', body: 'Kommst du noch?', ts: new Date().toISOString() });
  console.log(await handleMessageCommand('Antworte, dass ich in 10 Minuten da bin'));
  console.log(await handleConfirmCommand('Ja, senden'));
})();
"
```

## Feature 4: Anrufe & Kurznachrichten per Sprachbefehl

Baut auf Feature 3 auf. Loest Kontaktnamen ueber die Handy-App auf (echte
Kontakte, `expo-contacts`) statt sich nur auf „die letzte Nachricht" zu
beziehen.

**Ablauf einer Namensaufloesung**: Server broadcastet `{ type:
"resolve_contact", requestId, name }` per WebSocket ans Handy → Handy
durchsucht seine Kontakte, schickt `POST /api/contacts/resolve` mit den
Treffern zurueck → Server wartet darauf bis zu `CALLS_CONTACT_RESOLVE_TIMEOUT_MS`
(Default 6s). Kein verbundenes Handy oder Timeout = „nicht gefunden", nicht
„niemand mit dem Namen existiert" - der Unterschied steht auch so in der
Antwort, um nichts vorzutaeuschen.

**Sprachbefehle**:

- „Ruf Max an" → loest „Max" auf. Genau ein Treffer + `CALLS_CONFIRM_BEFORE_CALL`
  nicht `false` → Rueckfrage „Soll ich Max Mustermann anrufen?“, dann „Ja"
  oder „Abbrechen". Mehrere Treffer → Jarvis fragt nach einem genaueren
  Namen, rät nicht.
- „Schreib Max, dass ich später komme" → wie „Antworte...", nur mit
  Namensaufloesung statt „letzte Nachricht". Nur fuer SMS - fuer WhatsApp
  gibt es keine Sende-API (wie bei Feature 3).
- „Ja" / „Abbrechen" bestaetigen bzw. verwerfen sowohl wartende Anrufe als
  auch wartende SMS-Antworten (ein gemeinsamer Bestaetigungs-Mechanismus,
  siehe `src/shared/`).

Die eigentliche Sicherheitsgrenze liegt auf dem Handy: ohne die
`CALL_PHONE`-Berechtigung oeffnet ein Anruf-Befehl dort nur die Waehl-App
mit vorausgefuellter Nummer, es wird nie automatisch angerufen. Details in
`vality-app/README.md`.

`calls: true` in `config/features.json`.

### Testen

Ohne Handy, Kontakt-Antwort von Hand simulieren:

```bash
node -e "
const hub = require('./dist/ws/hub');
const orig = hub.broadcast;
hub.broadcast = (event) => {
  orig(event);
  if (event.type === 'resolve_contact') {
    require('./dist/contacts/resolve').deliverContactResolution(event.requestId, [
      { name: 'Max Mustermann', phoneNumber: '+491701112233' },
    ]);
  }
};
const { handleCallCommand } = require('./dist/calls/commands');
const { handleConfirmCommand } = require('./dist/shared/confirmCommands');
(async () => {
  console.log(await handleCallCommand('Ruf Max an'));
  console.log(await handleConfirmCommand('Ja'));
})();
"
```

Voller Test mit echtem Handy: siehe `vality-app/README.md`.

## Feature 5: Nachrichten-Feed & Dashboard-Sprachsteuerung

`GET /api/news` liefert den Tagesschau-RSS-Feed serverseitig geholt und
geparst (`src/news/fetchNews.ts`, `fast-xml-parser`), damit das Dashboard
ihn ohne CORS-Probleme anzeigen kann - 5 Minuten In-Memory-Cache. Zeigt
ausschliesslich, was der Feed tatsaechlich liefert; ist er nicht
erreichbar, zeigt das Dashboard das ehrlich als Fehler statt leerer
Kacheln.

`src/hud/commands.ts` erkennt Sprachbefehle, die nur die Dashboard-Ansicht
umschalten (keine Bestaetigung noetig, reine Navigation, kein
Datenzugriff): "wer ist X" / "was ist X" öffnet den Recherche-Modus mit
X als Suchbegriff, "zeig mir X" / "wetter in X" / "flieg nach X" öffnet
den Globus-Modus und zentriert auf X, "öffne den Globus" ohne Ziel, sowie
"zurück" / "schließ das" zur Übersicht. Sendet dafuer das `ui_mode`-Event
ueber den bestehenden WebSocket-Hub (`src/ws/hub.ts`) - das Dashboard
loest Ortsnamen selbst per Geocoding auf, der Server schickt nur den
rohen Namen, keine Koordinaten.

**Testen**:

```bash
node -e "
const { handleHudCommand } = require('./dist/hud/commands');
(async () => {
  console.log(await handleHudCommand('wer ist Albert Einstein'));
  console.log(await handleHudCommand('zeig mir Paris'));
  console.log(await handleHudCommand('zurück'));
})();
"
```

Jeder Aufruf gibt `{ reply }` zurueck und sendet nebenbei das `ui_mode`-
WebSocket-Event - mit offenem Dashboard im Browser sollte der Modus
sofort umschalten.

## Produktions-Build

```bash
npm run build
(cd dashboard && npm run build)
npm start
```

## Projektstruktur

```
vality-server/
  config/
    features.json     Feature-Flags (memory/presence/messages/calls/news)
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
      commands.ts     "Antworte, dass..." (letzte Nachricht)
    calls/            Feature 4: Anrufe & Kontakte
      commands.ts     "Ruf X an" / "Schreib X, dass..." (mit Namensaufloesung)
    contacts/
      resolve.ts      Kontakt-Anfrage/-Antwort per WebSocket ans Handy
    news/             Feature 5: Nachrichten-Feed
      fetchNews.ts    Tagesschau-RSS holen + parsen, 5-Min-Cache
    hud/              Feature 5: Dashboard-Sprachsteuerung
      commands.ts     "wer ist X"/"zeig mir X"/"öffne den Globus"/"zurück"
    shared/
      pendingAction.ts    Ein Bestaetigungs-Platz fuer SMS und Anrufe
      confirmCommands.ts  "Ja"/"Abbrechen" fuer beides
    routes/           Express-Routen (/api/voice, /api/status, /api/history,
                      /api/presence, /api/messages, /api/contacts/resolve,
                      /api/news)
    ws/hub.ts         WebSocket-Broadcast fuer das Dashboard (inkl. ui_mode)
    util/history.ts   In-Memory-Verlauf der letzten Interaktionen (Dashboard-Anzeige)
    index.ts          Server-Einstiegspunkt
  dashboard/      Web-Dashboard, React-Quelle (siehe dashboard/README.md)
  public/         Build-Ausgabe von dashboard/ (nicht im Git, wird gebaut)
  data/tmp/       temporaere Audio-Uploads (wird geleert)
  data/audio-out/ erzeugte TTS-Antworten (wav)
  data/memory/    facts.json, conversations.json (nicht im Git, siehe .gitignore)
```

## Geplante Ausbaustufen

Alle fuenf urspruenglich geplanten Features (Gedaechtnis, Anwesenheit,
Nachrichten, Anrufe, Nachrichten-Feed/Dashboard-Sprachsteuerung) sind
gebaut. Weiteres, noch nicht begonnen:

- Code-/Datei-Steuerung ueber die Claude Code CLI selbst
- System-Steuerung (Apps oeffnen, Lautstaerke)

**Kalender-Integration**: gebaut. "Erinnere mich morgen um neun an X" legt
per `hud/nlIntent.ts` einen echten Termin an - nicht in einer eigenen
Vality-Datei, sondern direkt im Android-Kalender der Handy-App
(`vality-app/src/features/calendar/write.ts`, `expo-calendar`). Server und
Handy-App sprechen dabei ueber denselben WebSocket-Hub wie
`resolve_contact` (Anfrage/Antwort-Muster, siehe `calendar/bridge.ts`).
"Was steht an" fragt live bei der Handy-App nach; Bearbeiten/Loeschen
passiert direkt in der Kalender-App auf dem Handy, nicht per Sprachbefehl.
