# Mathebattle-Eingabefeld

Ein Lesezeichen (Bookmarklet), das auf Aufgabenseiten von [Mathebattle](https://mathebattle.de) ein Tastenfeld mit Formel-Eingabe einblendet.

- Brüche, Hochzahlen, e-Funktionen, Wurzeln und Klammern als Bausteine, die Eingabe wird als Formel angezeigt
- Der Term wird im Mathebattle-Format in das Eingabefeld geschrieben, Vorschau und Wertung bleiben bei Mathebattle
- Das Tastenfeld bleibt über die ganze Sitzung erhalten
- Bei Ableitungsaufgaben gibt es drei Versuche: Falsche Antworten werden vorher abgefangen, nicht vereinfachte Antworten bekommen einen Hinweis

## Dateien

- `index.html`: Anleitung zum Einrichten mit Testfeld
- `tastenfeld.js`: der eigentliche Code. Das Lesezeichen lädt ihn bei jedem Antippen von GitHub Pages.
- `loader.txt`: der Code für das Lesezeichen

Die Zahl der erlaubten Versuche steht oben im Abschnitt „Prüfung bei Ableitungsaufgaben“ in `tastenfeld.js` (`MAX_TRIES`).

Das Lesezeichen sendet keine Daten an Dritte. Es läuft nur im Browser und spricht ausschließlich mit Mathebattle.
