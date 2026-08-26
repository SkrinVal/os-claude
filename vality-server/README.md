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

## Produktions-Build

```bash
npm run build
npm start
```

## Projektstruktur

```
vality-server/
  src/
    config/       Umgebungsvariablen, Pfade
    stt/whisper.ts    whisper.cpp Aufruf (Speech-to-Text)
    brain/claude.ts   claude -p Aufruf (Antwort-Generierung)
    tts/piper.ts      Piper Aufruf (Text-to-Speech)
    routes/           Express-Routen (/api/voice, /api/status, /api/history)
    ws/hub.ts         WebSocket-Broadcast fuer das Dashboard
    util/history.ts   In-Memory-Verlauf der letzten Interaktionen
    index.ts          Server-Einstiegspunkt
  public/         Web-Dashboard (HTML/CSS/JS, Sci-Fi-HUD)
  data/tmp/       temporaere Audio-Uploads (wird geleert)
  data/audio-out/ erzeugte TTS-Antworten (wav)
```

## Geplante Ausbaustufen (noch nicht umgesetzt)

- Handy-App (Expo/React Native) als Client fuer den Server
- Code-/Datei-Steuerung ueber die Claude Code CLI selbst
- System-Steuerung (Apps oeffnen, Lautstaerke)
- Timer & Erinnerungen mit proaktiver Sprachausgabe (node-cron)
- Wetter (Open-Meteo) & Kalender-Integration
