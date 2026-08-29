# Vality-App

Handy-Client fuer das Vality-AI-System. Spricht mit dem PC-Server
(`vality-server/`) im selben lokalen Netz. Enthaelt Feature 2
(Anwesenheitserkennung), Feature 3 (Nachrichten vorlesen/diktieren),
Feature 4 (Anrufe & Kontakte per Sprachbefehl), Kalender-Integration und
ein Hintergrund-Weckwort ("Hi Jarvis") - siehe `vality-server/README.md`
fuer den Gesamtzustand.

Die App ist **ein** Dashboard-Screen mit mehreren Panels
(Server-Verbindung, Anwesenheit, Nachrichten, Anrufe & Kontakte, Kalender,
Weckwort), im selben visuellen Stil wie das PC-Dashboard (dunkel,
Teal-Akzent, Eckenklammern) - nicht mehrere getrennte Screens.

## Wichtiger Hinweis zum nativen Code (Feature 3 + 4)

`modules/vality-messaging/` enthaelt selbst geschriebenen nativen
Android-Kotlin-Code: NotificationListenerService fuer WhatsApp-Vorschauen,
SMS-Empfang/-Versand, sowie Anruf-Ausloesung (`ACTION_CALL`/`ACTION_DIAL`).
Er ist gegen die tatsaechlich installierten SDK-57-Typen geschrieben und
die Modul-Registrierung/Autolinking wurde mit `expo prebuild` + der
Autolinking-Auflösung verifiziert - aber in dieser Umgebung stand kein
Android SDK zur Verfuegung, der Kotlin-Code selbst konnte nicht kompiliert
werden. Der erste `eas build`/`expo run:android` ist der echte Test. Wenn
der Build fehlschlaegt, ist das der Ort zum Nachschauen.

`modules/vality-wakeword/` enthaelt das native Weckwort-Modul: ein
Android-Foreground-Service, der ueber die Porcupine-Engine
(`ai.picovoice:porcupine-android`, direkt per Maven eingebunden - **kein**
npm-Paket noetig) offline auf "Jarvis" hoert, plus eine per Canvas
gezeichnete Einblendung (`OverlayWindow`/`OverlayView`) unten links, wenn
das Weckwort erkannt wird. Laeuft komplett nativ, unabhaengig vom
React-Native/JS-Kontext - funktioniert also auch bei geschlossener App,
solange das Handy eingeschaltet ist. **Nicht** moeglich: Erkennung bei
ausgeschaltetem Handy - dann laeuft ueberhaupt keine Software mehr, das
gilt fuer jede App.

## Wichtig: kein Expo Go

Hintergrund-Standort/Geofencing ist in Expo Go auf Android seit einigen
SDK-Versionen aus Google-Play-Policy-Gruenden **nicht mehr moeglich**.
Dieses Projekt braucht deshalb von Anfang an einen eigenen Dev-Client
(`expo-dev-client`), keine Ausnahme fuer Feature 2 allein. Zwei Wege, an
eine installierbare App zu kommen:

### Weg A: EAS Build (kein Android Studio noetig)

1. Kostenlosen Account auf https://expo.dev anlegen.
2. ```bash
   npm install -g eas-cli
   cd vality-app
   eas login
   eas build:configure
   eas build --profile development --platform android
   ```
3. EAS baut in der Cloud, du bekommst einen Link zur `.apk` zum
   Herunterladen und Installieren auf dem Handy (Einstellungen → "Unbekannte
   Quellen installieren" muss dafuer einmalig erlaubt werden).
4. Danach lokal starten: `npx expo start --dev-client`, QR-Code mit der
   installierten Dev-Client-App scannen.

### Weg B: Lokal bauen (Android Studio noetig)

```bash
npx expo run:android
```
Baut und installiert direkt auf ein per USB verbundenes/emuliertes Geraet.
Braucht Android SDK + Android Studio lokal installiert.

Bei beiden Wegen: **jedes Mal, wenn sich natives Modul-Coding aendert**
(z.B. Aenderungen an `modules/vality-messaging/android/`), muss die App
neu gebaut werden (`eas build` bzw. `expo run:android`) - reines
`expo start` reicht dann nicht mehr, weil das ein neues natives Binary
braucht. Reine JS/TSX-Aenderungen (Screens, Einstellungen) laufen dagegen
ganz normal per Fast-Refresh im schon gebauten Dev-Client.

## Wichtig: Play-Store-Richtlinien (Feature 3 + 4)

Google behandelt `READ_SMS`/`RECEIVE_SMS`/`SEND_SMS`, `CALL_PHONE`,
Kontaktzugriff und Benachrichtigungszugriff als "sensible Berechtigungen" -
eine App, die diese nutzt, OHNE die Standard-SMS- oder Anrufer-App des
Geraets zu sein, wird im Play Store in aller Regel abgelehnt oder verlangt
eine gesonderte Begruendung/Pruefung im Play Console. Fuer dieses Projekt
ist das unkritisch, weil es **nicht** ueber den Play Store verteilt wird -
EAS baut mit `distribution: "internal"` (siehe `eas.json`), die APK wird
direkt installiert. Nur relevant, falls die App irgendwann doch
veroeffentlicht werden soll: dann muessten diese Teile raus oder die App
muesste sich beim Play-Console-Deklarationsformular als
"Standard-SMS-Handler" bewerben.

## Installation

```bash
cd vality-app
npm install
```

## Einstellungen in der App

Ein Dashboard-Screen mit vier Panels:

**Server-Verbindung** (zuerst ausfuellen, gilt fuer alle Features):
1. **Server-URL**: die lokale IP deines PCs mit Port, z.B.
   `http://192.168.1.20:4390`. IP findest du auf dem PC z.B. mit
   `ipconfig` (Windows) unter "IPv4-Adresse".
2. **Geräte-Token**: muss exakt zum `PRESENCE_TOKEN` in der `.env` des
   Servers passen - ein Token fuer alle Features.

**Anwesenheit**:
3. **Breitengrad/Längengrad**: entweder von Hand eintragen oder auf
   "Aktuellen Standort als Zuhause übernehmen" tippen, waehrend du
   zuhause bist.
4. **Radius**: wie viele Meter um den Punkt als "zuhause" gelten (Start:
   150m, GPS ist nicht metergenau).
5. Schalter "Anwesenheitserkennung aktiv" umlegen.

**Nachrichten**:
6. Schalter "WhatsApp-Vorschau vorlesen" → fragt nach Benachrichtigungs-
   zugriff (Android-Einstellungen, kein normaler Dialog, siehe unten).
7. Schalter "SMS lesen & senden" → fragt die drei SMS-Laufzeit-
   Berechtigungen ab (normaler Dialog).

**Anrufe & Kontakte**:
8. "Kontaktzugriff" → "Anfragen" tippen, normaler Berechtigungs-Dialog.
   Ohne das kann kein Name in eine Telefonnummer uebersetzt werden.
9. "Direkt anrufen (ohne Wähl-Bildschirm)" → optional. Ohne diese
   Berechtigung funktionieren Anruf-Befehle trotzdem, oeffnen aber nur die
   Waehl-App - du musst noch selbst auf "Anrufen" tippen. Absichtlich als
   zusaetzliches Sicherheitsnetz so gebaut, kein Muss.

## Android-Berechtigungen, die du manuell bestätigen musst

Beim ersten Aktivieren fragt Android in zwei Schritten:

1. **Standort waehrend der Nutzung** - normaler Dialog, "Erlauben".
2. **Standort "Immer erlauben"** - Android zeigt dafuer meist NICHT mehr
   direkt einen Dialog mit der Option, sondern schickt dich in die
   System-Einstellungen der App. Dort musst du von "Nur während der
   Nutzung der App" auf **"Immer zulassen"** umstellen. Ohne diesen Schritt
   funktioniert Geofencing nur, solange die App im Vordergrund ist - der
   ganze Sinn (Ankunft erkennen, waehrend das Handy in der Tasche ist)
   entfaellt sonst.
3. Ab Android 13: **Benachrichtigungen erlauben**, falls abgefragt
   (fuer spaetere Nutzung, aktuell noch nicht zwingend fuer Feature 2).
4. Manche Hersteller (Xiaomi/Huawei/Samsung mit aggressivem Battery-
   Optimizer) killen Hintergrund-Apps trotz korrekter Berechtigung. Falls
   Geofencing nach einiger Zeit aufhoert zu reagieren: in den
   Akku-Einstellungen des Handys "Keine Einschraenkung" / "Nicht
   optimieren" fuer diese App setzen.

Fuer Feature 3 zusaetzlich:

5. **Benachrichtigungszugriff** (fuer WhatsApp-Vorschau): das ist KEINE
   normale Laufzeit-Berechtigung, Android fragt dafuer nie einen Dialog.
   Der Schalter in der App springt direkt in
   Einstellungen → Apps → Benachrichtigungszugriff (bzw. "Sonderzugriff" →
   "Benachrichtigungszugriff"), dort muss Vality AI manuell angehakt
   werden. Ohne diesen Schritt bleibt der Schalter in der App wirkungslos.
6. **SMS lesen/empfangen/senden**: normaler dreifacher Berechtigungs-
   Dialog, erscheint beim Aktivieren des Schalters.
7. Genau wie bei Feature 2: Akku-Optimierung fuer die App deaktivieren,
   sonst stellt Android den NotificationListenerService nach einiger Zeit
   im Hintergrund ein.

Fuer Feature 4 zusaetzlich:

8. **Kontakte lesen**: normaler Berechtigungs-Dialog beim Tippen auf
   "Anfragen" im Panel "Anrufe & Kontakte".
9. **Telefonanrufe tätigen** (`CALL_PHONE`, optional): normaler
   Berechtigungs-Dialog. Bewusst NICHT automatisch mitbeantragt, wenn du
   nur SMS/WhatsApp nutzt - separates Opt-in, weil es die staerkste
   Berechtigung im ganzen Projekt ist (loest echte Anrufe ohne
   Wähl-Bildschirm aus).

Fuer das Weckwort zusaetzlich:

10. **Mikrofon** (`RECORD_AUDIO`): normaler Berechtigungs-Dialog, wird
    beim Aktivieren des Schalters "Weckwort aktiv" abgefragt.
11. **Anzeige über anderen Apps** (`SYSTEM_ALERT_WINDOW`): wie bei
    Benachrichtigungszugriff KEIN normaler Dialog - springt in die
    Android-Einstellungen, dort muss Vality AI manuell erlaubt werden.
    Ohne diese Berechtigung erkennt das Weckwort trotzdem, zeigt aber
    keine Einblendung.
12. Genau wie bei Feature 2/3: Akku-Optimierung deaktivieren, sonst killt
    Android den Hintergrund-Dienst nach einiger Zeit und "Hi Jarvis"
    reagiert nicht mehr zuverlaessig. Ein per Wisch-Geste aus der
    App-Übersicht entfernter Prozess kann den Dienst je nach
    Hersteller-Android trotz `START_STICKY` beenden - das ist eine
    bekannte Android-Systemgrenze, kein Bug in diesem Projekt.

## Testen

1. Server laeuft (`vality-server`, `npm run dev`), `PRESENCE_TOKEN` in
   dessen `.env` gesetzt, `presence: true` in `vality-server/config/features.json`.
2. Handy und PC im selben WLAN.
3. App wie oben beschrieben einrichten und aktivieren.
4. Home-Radius kurz verlassen (z.B. 200m weit weg laufen/fahren, oder
   Radius testweise auf 30m stellen und im Zimmer nebenan warten) und
   wieder zurueckkommen.
5. Auf dem PC-Dashboard (`http://localhost:4390`) sollte ein neuer
   Logbuch-Eintrag mit `[Ankunft zuhause]` bzw. `[Verlassen zuhause]`
   erscheinen und automatisch vorgelesen werden.
   - Falls nichts abgespielt wird: einmal irgendwo auf die Dashboard-Seite
     klicken. Browser blockieren automatisches Audio-Abspielen, bis auf
     der Seite mindestens einmal interagiert wurde.
6. Schneller Test ohne echtes Geofencing - Event von Hand simulieren:
   ```bash
   curl -X POST http://<pc-ip>:4390/api/presence \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <dein PRESENCE_TOKEN>" \
     -d '{"event":"arrived"}'
   ```
   Das prueft Server-Reaktion + Dashboard-Anzeige unabhaengig davon, ob
   das Handy-Geofencing selbst schon zuverlaessig ausloest.

### Feature 3 testen

1. Server: `messages: true` in `config/features.json`, `.env` mit
   `PRESENCE_TOKEN` gesetzt (dasselbe Token wie in der App).
2. In der App: WhatsApp- und/oder SMS-Schalter aktivieren, Berechtigungen
   wie oben erteilen.
3. **SMS-Empfang testen**: dir selbst eine SMS von einem zweiten Handy
   schicken. PC-Dashboard sollte kurz darauf `[SMS von <Nummer>]`
   vorlesen.
4. **WhatsApp-Vorschau testen**: dir selbst eine WhatsApp-Nachricht
   schicken (Vorschau in den WhatsApp-Einstellungen muss aktiviert sein -
   "Sensible Benachrichtigungsinhalte" o.ae. NICHT verstecken, sonst ist
   der Text leer). Sollte genauso vorgelesen werden.
5. **Antworten testen**: nach einer empfangenen SMS am PC-Mikro sagen
   "Antworte, dass ich gleich zurückrufe." → PC fragt zur Bestaetigung
   (falls `MESSAGES_CONFIRM_BEFORE_SEND` nicht auf `false` steht) → "Ja,
   senden" sagen → SMS sollte auf dem Handy tatsaechlich rausgehen.
6. Ohne echtes Geofencing/SMS - Event von Hand simulieren:
   ```bash
   curl -X POST http://<pc-ip>:4390/api/messages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <dein PRESENCE_TOKEN>" \
     -d '{"source":"sms","sender":"+491701234567","body":"Kommst du noch?"}'
   ```
   Danach am PC-Mikro "Antworte, dass ich in 10 Minuten da bin" sagen, um
   den Bestaetigungs-/Sende-Ablauf ganz ohne Handy-seitiges SMS-Empfangen
   zu pruefen (der tatsaechliche Versand passiert dann trotzdem uebers
   Handy, das muss also verbunden und per WebSocket erreichbar sein).

### Feature 4 testen

1. Server: `calls: true` in `config/features.json`.
2. In der App: Kontaktzugriff erlauben. `CALL_PHONE` erstmal NICHT
   erlauben, um zuerst den sicheren Fallback zu testen.
3. Einen Testkontakt mit deinem eigenen Namen (oder einem, den du
   erkennst) in den Handy-Kontakten anlegen/nutzen.
4. Am PC-Mikro: "Ruf &lt;Kontaktname&gt; an." → PC sollte fragen "Soll ich
   ... anrufen?", dann "Ja" sagen → auf dem Handy sollte sich die
   Waehl-App mit der Nummer oeffnen (nicht automatisch anrufen, das ist
   der erwartete sichere Fallback ohne `CALL_PHONE`).
5. Jetzt `CALL_PHONE` in der App erlauben, Schritt 4 wiederholen → sollte
   diesmal direkt anrufen, ohne Waehl-Bildschirm.
6. "Schreib &lt;Kontaktname&gt;, dass ich später komme" testen, analog zu
   Feature 3s "Antworte...", nur mit Namen statt "letzte Nachricht".
7. Mehrdeutigkeit testen: zwei Kontakte mit aehnlichem Namen anlegen,
   denselben Namen per Sprache nennen → Jarvis sollte nach einem
   genaueren Namen fragen, nicht selbst waehlen.

### Weckwort testen

1. Kostenlosen AccessKey auf https://console.picovoice.ai anlegen (Konto
   erstellen, "AccessKey" kopieren - kein Training noetig, "Jarvis" ist ein
   eingebautes Stichwort).
2. In der App: AccessKey ins Feld "Picovoice AccessKey" eintragen,
   Mikrofon- und Overlay-Berechtigung erteilen, Schalter "Weckwort aktiv"
   umlegen.
3. App schliessen (nicht nur Home-Taste - wirklich schliessen). "Hi
   Jarvis" sagen. Unten links sollte eine kleine Einblendung mit Kern +
   Wellenbalken erscheinen (verschwindet nach ein paar Sekunden von
   selbst, oder antippen oeffnet die App).
4. Funktioniert es bei geschlossener App nicht: Akku-Optimierung fuer
   Vality AI deaktivieren (siehe oben) und erneut testen.

## Bekannte Grenzen

- iOS-Geofencing ist in diesem Setup nicht getestet (Android stand hier
  im Vordergrund) - `expo-location` unterstuetzt es grundsaetzlich, aber
  Berechtigungsdialoge/Verhalten unterscheiden sich von Android.
- Kein Retry/Queue, wenn der PC beim Auslösen des Events nicht erreichbar
  ist - das Event geht dann schlicht verloren (kein Store-and-forward).
- Standort wird nur ausgewertet, nie dauerhaft gespeichert oder irgendwo
  anders als an den eigenen PC-Server geschickt.
- WhatsApp-Erfassung liest ausschliesslich die System-Benachrichtigungs-
  vorschau (Absender + Textausschnitt). Kein Zugriff auf den Chatverlauf,
  Anhaenge, Gruppen-Kontext oder Nachrichten, die eintreffen wenn WhatsApp
  gerade im Vordergrund offen ist (dann zeigt Android meist keine
  Benachrichtigung). Das ist eine harte technische Grenze, keine
  Fleissaufgabe fuer spaeter - es gibt keine offizielle API dafuer.
- "Antworte, dass..." bezieht sich immer auf die zuletzt empfangene
  Nachricht. Fuer eine Antwort an einen namentlich genannten Kontakt:
  "Schreib X, dass..." (Feature 4).
- Alle Befehle vom PC ans Handy (`send_sms`, `place_call`,
  `resolve_contact`) laufen ueber dieselbe offene WebSocket-Verbindung der
  App - ist die App vollstaendig beendet (nicht nur im Hintergrund), kommt
  nichts mehr an. Kein Push-Service angebunden, der das umgehen wuerde.
- Nachrichtenverlauf auf dem Server ist nur im Arbeitsspeicher (letzte 50),
  nicht persistiert - ein Server-Neustart loescht ihn.
- Kontakt-Suche ist ein einfacher Namens-Abgleich (kein Fuzzy-Match,
  keine Tippfehler-Toleranz) - "Ruf Max an" findet nur Kontakte, deren
  Name "Max" tatsaechlich enthaelt.
- "Schreib X, dass Y" verlangt zwingend das Wort "dass" als Trenner
  zwischen Name und Nachricht (einfaches Pattern-Matching, keine echte
  Sprachverarbeitung, wie schon bei Feature 1 und 3).
- Bei mehreren Treffern fragt Jarvis nach einem genaueren Namen, bietet
  aber keine nummerierte Auswahl ("1, 2, 3") an - bewusste Vereinfachung,
  um fragiles Zahlwort-Parsing zu vermeiden.
- Das Weckwort funktioniert nur, solange das Handy eingeschaltet ist -
  bei ausgeschaltetem Geraet laeuft keine Software, das ist eine harte
  physikalische Grenze, keine technische Einschraenkung dieses Projekts.
- Nach Erkennung des Weckworts oeffnet sich die App noch nicht automatisch
  in einen "Zuhoer"-Modus - die Einblendung ist reines visuelles Feedback,
  Antippen bringt die App in den Vordergrund, der eigentliche Sprachbefehl
  muss dort wie gewohnt gestartet werden. Direktes Zuhoeren direkt aus der
  Einblendung heraus ist ein moeglicher naechster Ausbauschritt.
- Manche Hersteller-Android-Varianten (aggressive Akku-Optimierer) stoppen
  den Weckwort-Dienst nach einer Weile trotz `START_STICKY` - Akku-
  Optimierung deaktivieren hilft, ist aber keine hundertprozentige
  Garantie ueber alle Hersteller hinweg.
