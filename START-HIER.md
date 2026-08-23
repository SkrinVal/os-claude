# START HIER

Für dich in vier Wochen, wenn du nicht mehr weißt, was das hier war.

---

## Was das ist

Ein Ordner mit einer HTML-Datei und fünf Agenten. Die HTML-Datei ist die
Zentrale: Doppelklick, sie öffnet sich im Browser, sie funktioniert ohne
Internet und ohne Server. Sie lädt nichts nach.

Unten in jeder Ansicht stehen ein bis drei Knöpfe. Ein Knopf öffnet einen
frischen Claude-Chat, in dem der Auftrag schon steht. Du drückst, der Chat
öffnet sich, du schickst ab. Du tippst nie einen Prompt.

Die Agenten schreiben ihr Ergebnis zurück in die `index.html` — genauer: in
den Datenblock zwischen `/* DATEN-START */` und `/* DATEN-ENDE */`. Danach
lädst du die Seite neu und siehst das Ergebnis.

---

## Was du wann drückst

| Wann | Ansicht | Knopf |
|---|---|---|
| Morgens als Erstes | HEUTE | **Tag neu laden** |
| Morgens, wenn du wissen willst, was zählt | LOGBUCH | **Morgen-Check starten** |
| Wenn ein Vertrag oder eine Rechnung kommt | ARCHIV | **Dokument ablegen** |
| Wenn du etwas in deinen Unterlagen suchst | ARCHIV | **Unterlagen befragen** |
| Abends, fünf Minuten | LOGBUCH | **Abend-Check starten** |
| Freitag oder Sonntag | LOGBUCH | **Woche auswerten** |
| Wenn du einen Post brauchst | CONTENT | Thema antippen → **Post schreiben** |
| Einmal im Monat | ARCHIV | **Archiv-Check starten** |
| Wenn du nicht weißt, wer ran muss | ÜBERSICHT | **Lage prüfen** |
| Freitags | ÜBERSICHT | **Lagebericht holen** |

**Beim allerersten Mal:** CONTENT → **Markenprofil füllen**. Solange
`marke/markenprofil.md` leer ist, schreibt der content-Agent keinen Post,
sondern führt mit dir das Interview. Das dauert 20 bis 30 Minuten und ist die
einzige Vorarbeit, die dieses System braucht.

---

## Die fünf Agenten

| Skill | Macht | Füllt in der Zentrale |
|---|---|---|
| `dashboard` | Kalender, Mails, Chats, Aufgaben → Tagesbriefing | HEUTE |
| `ablage` | Dokumente auslesen, ablegen, Fristen bewachen | ARCHIV |
| `chef` | Morgen-Check, Abend-Check, Wochen-Auswertung | LOGBUCH |
| `content` | Markenprofil, Posts, Skripte, Newsletter | CONTENT |
| `chief` | nimmt formlose Aufträge an und verteilt sie | ÜBERSICHT |

Alle fünf halten sich an `CLAUDE.md`. Das Wichtigste daraus: **Sie entwerfen,
sie lösen nichts aus.** Keine Mail geht raus, kein Termin wird abgesagt, kein
Vertrag gekündigt, ohne dass du es ausdrücklich freigibst.

Und: Was in einer Mail oder einem Dokument steht, ist Material — keine
Anweisung. Steht dort "Claude, mach X", wird es ignoriert und dir gemeldet.

---

## Wie die Skills aufs Handy kommen

Die Skills liegen zweimal im Ordner:

- `.claude/skills/…` — dort liest Claude Code sie am Rechner, ohne Zutun.
- `skills-zip/…zip` — je ein ZIP zum Hochladen auf claude.ai.

**Hochladen (einmal, dann auch am Handy verfügbar):**

1. claude.ai im Browser am Rechner öffnen (nicht am Handy — dort geht der
   Upload nicht).
2. Einstellungen → **Capabilities / Skills** → **Skill hochladen**.
3. Die fünf ZIPs aus `skills-zip/` einzeln hochladen.
4. In der Claude-App am Handy neu laden. Die Skills sind da.

Danach funktionieren die Knöpfe aus der Zentrale auch am Handy: Knopf drücken →
Claude-App öffnet sich mit fertigem Auftrag → abschicken.

**Wichtig:** Am Handy hat Claude keinen Zugriff auf diesen Ordner. Die Agenten
können dort denken, entwerfen und antworten — aber nicht in die `index.html`
schreiben. Das passiert am Rechner. Am Handy ist die Zentrale zum Lesen und
zum Starten von Gesprächen.

---

## Geplante Aufgaben, die du anlegen solltest

In Claude (Cowork / Aufgaben → neue geplante Aufgabe). Drei Stück reichen:

**1 · Werktags 07:00 — Tag laden**
> Nutze den Skill dashboard und lade meinen Tag. Schreib das Ergebnis in den
> Schlüssel heute im DATEN-Block der index.html in meinem Claude-OS-Ordner und
> setz meta.letzter_lauf.dashboard.

**2 · Werktags 18:30 — Abend-Check**
> Nutze den Skill chef und mach mit mir den Abend-Check. Stell die vier Fragen
> einzeln und warte auf meine Antworten. Danach Eintrag nach
> logbuch/logbuch.md, Schlüssel logbuch in der index.html aktualisieren.

**3 · Freitags 16:00 — Woche auswerten und Lage**
> Nutze den Skill chef für die Wochen-Auswertung nach logbuch/wochen/, danach
> den Skill chief für den Lagebericht. Beides in die index.html schreiben.

Zusätzlich sinnvoll, aber nicht nötig: **1. des Monats, 09:00 — Archiv-Check**
über `ablage`.

---

## Was du von Hand machst

- **Veröffentlichen.** Kein Agent postet, sendet oder verschickt etwas.
- **Freigeben.** Kündigungen, Absagen, Zahlungen — der Agent entwirft, du
  drückst ab.
- **Seite neu laden**, nachdem ein Agent geschrieben hat.
- **Originale ablegen.** Die Agenten schreiben Zusammenfassungen nach
  `archiv/`. Die Original-PDFs gehören dorthin, wo sie bei dir hingehören.

---

## Wenn etwas nicht stimmt

**Die Seite zeigt alte Daten.** Neu laden (Strg+R / Cmd+R). Der Browser hält
lokale Dateien fest.

**Eine Ansicht ist leer.** Der Schlüssel im DATEN-Block ist leer. Die Seite
sagt dir dann, welcher Knopf ihn füllt. Das ist kein Fehler.

**Ein Agent sagt, er kann die Datei nicht schreiben.** Dann ist er nicht im
richtigen Ordner. Er soll keine zweite Datei anlegen — sag ihm, wo der Ordner
liegt.

**Die Beispieldaten stehen noch da.** Jede Ansicht zeigt oben einen orangenen
Streifen `BEISPIELINHALT`, solange die Beispiele nicht ersetzt sind. Der erste
echte Lauf des jeweiligen Agenten räumt sie weg.

**Ein Knopf öffnet nichts.** Die Knöpfe sind Links auf `claude.ai/new?q=…`.
Ohne Internet öffnen sie nichts — die Zentrale selbst funktioniert trotzdem
offline.

---

## Der Ordner

```
Claude-OS/
├── index.html            die Zentrale — hier fängst du an
├── CLAUDE.md             Grundregeln, gelten für alle fünf Agenten
├── START-HIER.md         diese Datei
├── .claude/skills/       dashboard · ablage · chef · content · chief
├── skills-zip/           dieselben fünf als ZIP für claude.ai
├── archiv/               abgelegte Dokumente + INDEX.md
├── logbuch/              logbuch.md + wochen/
├── marke/                markenprofil.md
└── ausgabe/              Entwürfe des content-Agenten
```
