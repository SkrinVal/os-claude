# Vality-App

Handy-Client fuer das Vality-AI-System. Spricht mit dem PC-Server
(`vality-server/`) im selben lokalen Netz. Bisher nur Feature 2
(Anwesenheitserkennung) - siehe `vality-server/README.md` fuer den
Gesamtzustand.

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

Bei beiden Wegen: **jedes Mal, wenn ein natives Modul dazukommt** (Feature
3 mit NotificationListenerService z.B.), muss die App neu gebaut werden
(`eas build` bzw. `expo run:android`) - reines `expo start` reicht dann
nicht mehr, weil das ein neues natives Binary braucht.

## Installation

```bash
cd vality-app
npm install
```

## Einstellungen in der App

Beim ersten Start (Bildschirm "Anwesenheitserkennung"):

1. **Server-URL**: die lokale IP deines PCs mit Port, z.B.
   `http://192.168.1.20:4390`. IP findest du auf dem PC z.B. mit
   `ipconfig` (Windows) unter "IPv4-Adresse".
2. **Zugriffs-Token**: muss exakt zum `PRESENCE_TOKEN` in der `.env` des
   Servers passen.
3. **Breitengrad/Längengrad**: entweder von Hand eintragen oder auf
   "Aktuellen Standort als Zuhause übernehmen" tippen, waehrend du
   zuhause bist.
4. **Radius**: wie viele Meter um den Punkt als "zuhause" gelten (Start:
   150m, GPS ist nicht metergenau).
5. Schalter "Anwesenheitserkennung aktiv" umlegen.

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

## Bekannte Grenzen

- iOS-Geofencing ist in diesem Setup nicht getestet (Android stand hier
  im Vordergrund) - `expo-location` unterstuetzt es grundsaetzlich, aber
  Berechtigungsdialoge/Verhalten unterscheiden sich von Android.
- Kein Retry/Queue, wenn der PC beim Auslösen des Events nicht erreichbar
  ist - das Event geht dann schlicht verloren (kein Store-and-forward).
- Standort wird nur ausgewertet, nie dauerhaft gespeichert oder irgendwo
  anders als an den eigenen PC-Server geschickt.
