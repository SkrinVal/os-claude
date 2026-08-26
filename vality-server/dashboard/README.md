# Vality Dashboard

Kontextabhängiges Sci-Fi-HUD-Web-Dashboard für Vality AI. Ersetzt das
frühere handgeschriebene `public/`-Dashboard vollständig.

Quelle hier, Build-Ausgabe landet in `../public/` (siehe `vite.config.ts`,
`outDir: "../public"`) — der Vality-Server liefert das Ergebnis unveraendert
aus, genau wie vorher.

## Architektur

- **React 19 + TypeScript + Vite** — kein zusaetzliches State-Management,
  ein Context+Reducer-Store (`src/state/store.tsx`) reicht fuer den
  zentralen `mode`-State und alle Modus-Daten.
- **Framer Motion** fuer alle Layout-Uebergaenge (Core-Ring-Bewegung,
  Karten-Ein-/Ausblenden).
- **react-globe.gl** (Globus-Modus) — Erdtextur liegt lokal unter
  `public/textures/earth-night.jpg` (aus `three-globe` kopiert), kein
  externer CDN-Abruf zur Laufzeit noetig. Als eigener Lazy-Chunk geladen
  (three.js ist schwer), Idle/Recherche bleiben davon unberuehrt.
- **WebSocket** zum selben Hub, den auch die Handy-App nutzt
  (`src/hooks/useVoiceSocket.ts`). Der Event-Typ `ui_mode` schaltet den
  Modus per Sprachbefehl um (`src/hud/commands.ts` im Server erkennt "wer
  ist X", "zeig mir X", "wetter in X", "öffne den Globus", "zurück" ...).

## Farbpalette

Cyan (siehe `src/styles/theme.css`):

```
--bg: #0a0e14         --accent: #22d3ee      --accent-dim: #0e6d80
--accent-2: #7c6cf0    (nur fuer sehr sparsame Tiefe-Akzente, kein Text)
--text: #eef0f4       --text-dim: #8890a0    --text-faint: #545e6e
--ok: #4ade80          --warn: #fbbf24        --danger: #f87171
```

Palettenwechsel: nur `theme.css` anfassen, Komponenten nutzen ausschliesslich
die CSS-Variablen.

## Installation & Entwicklung

```bash
cd vality-server/dashboard
npm install
npm run dev
```

Startet auf `http://localhost:5173` mit Hot-Module-Reload. `/api`, `/ws`
und `/audio` werden per Vite-Proxy an den echten Vality-Server auf Port
4390 weitergereicht (siehe `vite.config.ts`) — der muss parallel laufen
(`cd ../.. && npm run dev` im `vality-server`-Wurzelverzeichnis), sonst
bleibt „GETRENNT" stehen und `/api/status` liefert nichts.

## Produktions-Build

```bash
npm run build
```

Baut nach `../public/`, leert das Verzeichnis vorher (`emptyOutDir: true`).
Der Vality-Server braucht dafuer keine eigene Konfiguration - er liefert
`public/` bereits per `express.static` aus.

## Modus 1: „idle" (fertig)

Zentraler Core-Ring (Tick-Marken-Skala, innerer Ring reagiert live auf die
Mikrofon-Lautstaerke via Web-Audio-Analyser), Statuslabel im Zentrum,
deutlich sichtbarer Call-to-Action-Text im Ring selbst ("TIPPEN ZUM
SPRECHEN" / "TIPPEN ZUM STOPPEN" je nach Zustand). Seitliche Panels:
System-Status (CPU/RAM/Uptime/Mikrofon-Berechtigung), Schnellzugriff
(Vollbild, Stummschaltung der automatischen Wiedergabe, Logbuch leeren),
Logbuch (letzte Interaktionen, live per WebSocket + beim Laden per
`/api/history`).

**Bedienung**: Auf den Ring tippen (oder Leertaste, ausser man tippt
gerade in ein Textfeld) startet die Aufnahme, nochmal tippen stoppt und
schickt sie an `/api/voice`. Fehler (z.B. Mikrofon blockiert, Server-
Fehler) zeigen im Ring nur "FEHLER" - die volle Meldung erscheint als
eigenes Toast unten, damit lange Fehlertexte den Ring nicht sprengen (das
ist beim Bauen tatsaechlich passiert, siehe Commit-Historie).

### Testen

1. Vality-Server muss mit `WHISPER_MODEL`/`PIPER_MODEL`/... konfiguriert
   sein (siehe `vality-server/README.md`) - fuer einen reinen UI-Test
   reichen auch Platzhalter-Env-Variablen, dann schlaegt die eigentliche
   Transkription fehl, aber die UI-Fehlerbehandlung laesst sich damit genau
   pruefen.
2. `npm run build` hier, dann im Server-Wurzelverzeichnis `npm run dev`
   (oder `npm run build && npm start`), Browser auf `http://localhost:4390`.
3. Erwartetes Verhalten:
   - Oben rechts "VERBUNDEN" (gruen), sobald der Server laeuft.
   - System-Panel zeigt echte Werte (Hostname, Speicher, ...).
   - Ring-Tap fragt nach Mikrofon-Berechtigung, danach reagiert der innere
     Ring sichtbar auf Lautstaerke.
   - Nach dem Sprechen: Logbuch-Eintrag erscheint, Antwort wird
     automatisch vorgelesen (Browser-Autoplay-Policy: einmal auf die Seite
     geklickt haben muss man trotzdem, sonst blockiert der Browser das).
4. Ohne Mikrofon-Zugriff/echtes Whisper testen: Server mit
   `WHISPER_BIN=/bin/true` starten (liefert keine echte Transkription) und
   trotzdem eine Aufnahme senden - der Ring sollte kurz "FEHLER" zeigen,
   unten ein rotes Toast mit der Fehlermeldung, nach 3s zurueck auf
   "BEREIT". Das ist der Pfad, der beim Bauen den urspruenglichen Bug
   (Ring durch lange Fehlermeldung gesprengt) aufgedeckt hat.
5. Debug-Button oben rechts oeffnet ein Panel mit dem rohen State
   (`mode`, `voiceState`, `connected`, ...) - nuetzlich, um zu sehen, ob
   WebSocket-Events wirklich ankommen, ohne die Konsole zu oeffnen.

## Modus 2: „research" (fertig)

Ring verkleinert sich in die Ecke, Suchfeld gegen die echte deutsche
Wikipedia-REST-API (`src/services/wikipedia.ts`, mit Fallback-Suche bei
Nichttreffer). Steckbrief-Karte zeigt nie ein echtes Foto - stattdessen
einen rein geometrisch aus dem Namen generierten Avatar
(`AbstractAvatar.tsx`).

## Modus 3: „globe" (fertig)

3D-Globus mit Naechte-Textur, Sternenfeld, sanfter Auto-Rotation (haelt
an, sobald eine Stadt fokussiert ist), pulsierendem Ring am fokussierten
Ort. Feste Staedte-Liste (`src/data/cities.ts`) plus freies Suchfeld -
jeder Ort der Welt laesst sich per echter Open-Meteo-Geocoding-API
finden, nicht nur die Vorauswahl. Wetter-Overlay ueber die echte
Open-Meteo-Wetter-API.

## Sprachsteuerung

`src/hud/commands.ts` im Server erkennt (vor der allgemeinen
Claude-Antwort) u.a.:

- "wer ist X" / "was ist X" / "erzähl mir von X" → Recherche-Modus
- "zeig mir X" / "wo ist X" / "wetter in X" / "flieg nach X" → Globus-Modus
- "öffne den Globus" / "öffne die Weltkarte" → Globus ohne bestimmte Stadt
- "zurück" / "schließ den Globus" / "startbildschirm" → zurueck zur
  Uebersicht

Sendet das `ui_mode`-WebSocket-Event, das `useVoiceSocket.ts` im Frontend
entgegennimmt. Bis diese Trigger auch per Sprache getestet werden koennen
(Whisper noetig), laesst sich jeder Modus zusaetzlich ueber die
Debug-Panel-Knoepfe direkt anspringen.
