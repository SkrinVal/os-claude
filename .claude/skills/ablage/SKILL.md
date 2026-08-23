---
name: ablage
description: Archiviert Dokumente und wacht über Fristen — nutzen, wenn ein Vertrag, eine Police, eine Rechnung, eine Kündigung oder ein sonstiges Dokument abgelegt werden soll, wenn nach Fristen, Laufzeiten, Kündigungsterminen, Beträgen oder dem Inhalt eigener Unterlagen gefragt wird, oder wenn ein "Archiv-Check" angefordert wird. Schreibt nach archiv/, pflegt archiv/INDEX.md und füllt den Schlüssel archiv im DATEN-Block der index.html.
---

# ablage

Das Gedächtnis für Papier. Legt ab, findet wieder, meldet Fristen früh genug.

Es gelten zusätzlich die Grundregeln in `CLAUDE.md`.

## Neues Dokument aufnehmen

Aus dem Dokument herausziehen — nur, was wirklich drinsteht:

1. Typ (Vertrag, Police, Rechnung, Kündigung, Bescheid, Angebot …)
2. Gegenpartei
3. Vertrags- oder Aktenzeichen (in die Datei, nie in Zusammenfassungen)
4. Beginn
5. Laufzeit und Verlängerungsmechanik
6. Kündigungsfrist
7. **Nächstes Datum, an dem gehandelt werden muss — und was genau**
8. Beträge und Rhythmus (monatlich, jährlich, einmalig)
9. Die zwei Klauseln, die später beißen können, in einfachen Worten
10. Drei Schlagworte

Fehlt eine Angabe im Dokument: `nicht angegeben`. Nicht ableiten, nicht raten.

### Dateiname

```
JJJJ-MM-TT_Typ_Gegenpartei_Stichwort.md
```

Datum = Datum des Dokuments, nicht der Ablage. Umlaute und Leerzeichen zu
Bindestrichen, keine Sonderzeichen.

### Aufbau der Datei

```markdown
---
typ: Vertrag
gegenpartei: Serverhaus AG
beginn: 2026-08-14
frist: 2026-08-31
naechste_aktion: Kündigen oder bewusst verlängern lassen
betrag: 49 EUR monatlich
tags: [hosting, laufende-kosten, kuendigung]
---

## Zusammenfassung

Fließtext, keine Stichpunkte. Was ist das, wer sind die Parteien, was passiert
wann, was kostet es, was ist die Falle.

## Klauseln, die später beißen

- …
- …

## Original

Ablageort oder Herkunft des Originaldokuments.
```

Nach jeder Ablage: Zeile in `archiv/INDEX.md` ergänzen und `archiv` im
DATEN-Block der `index.html` aktualisieren.

## Fragen beantworten

1. Zuerst in `archiv/` suchen. Immer.
2. Erst danach im Web, und nur, wenn die Frage über die eigenen Unterlagen
   hinausgeht.
3. Mit der Stelle aus dem Dokument antworten — Datei und Abschnitt nennen,
   nicht aus dem Gedächtnis paraphrasieren.
4. Nichts gefunden heißt wörtlich: **"steht nicht im Archiv"**. Keine
   Vermutung, keine allgemeine Auskunft als Ersatz.

## Auf "Archiv-Check"

Vier Abschnitte, ein Datum und eine Handlung pro Zeile:

1. Welche Fristen laufen in den nächsten 90 Tagen ab
2. Was verlängert sich automatisch
3. Wo wird doppelt oder für Ungenutztes gezahlt
4. Was fehlt komplett (Vertrag ohne Police, Rechnung ohne Auftrag …)

## In die Zentrale schreiben

```js
archiv: {
  stand: "JJJJ-MM-TT HH:MM",
  fristen: [ { datum: "JJJJ-MM-TT", dokument: "…", gegenpartei: "…", aktion: "…" } ],
  dokumente: [ { datei: "…", typ: "…", gegenpartei: "…",
                 abgelegt: "JJJJ-MM-TT", tags: ["…"] } ]
}
```

Fristen nach Datum sortiert, nächste zuerst. Danach
`meta.letzter_lauf.ablage` setzen.

## Recht und Steuern

Einordnungen zu Kündigungsrecht, Haftung, Steuerabzug und Ähnlichem sind
Hinweise. Dabei steht immer der Satz, dass das fachlich geprüft werden muss.
Dieser Skill ist kein Anwalt und kein Steuerberater.

## Nie

- Kündigen, verlängern, zustimmen, zahlen
- Fristen erfinden oder aufrunden
- Kontonummern, IBAN, Ausweis- oder Versicherungsnummern in Zusammenfassungen
  oder in die index.html schreiben
- Ein Original löschen oder überschreiben
