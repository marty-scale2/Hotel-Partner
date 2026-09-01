# Kartenmotive, stillgelegt am 01.09.2026

Berge, Kompass, Anker und Schatztruhe. Sie waren als Kupferstich-Illustrationen
im Hintergrund der Seite und leuchteten auf, sobald die Fußspur an ihnen
vorbeilief. Raus, weil der Stich-Stil sich mit dem flächigen Rest der Seite und
dem Logo gebissen hat.

**Nichts davon ist verloren.** Hier liegt alles, was zum Zurückholen nötig ist.

## Was hier liegt

| Datei | Inhalt |
|---|---|
| `motive.css` | Sämtliche CSS-Regeln, unverändert aus `index.html` herausgeschnitten |
| `motive.html` | Die vier `<span>`-Elemente mit ihrer Einbaustelle |
| `kartenmotive.webp` | Das Sprite, 4×2 Felder, 533 KB |
| `kartenmotive-mobile.webp` | Dasselbe kleiner für schmale Fenster, 150 KB |

## Das Sprite

Vier Spalten, zwei Zeilen. Angesteuert wird über `background-size:400% 200%`
und `background-position`.

| | Spalte 1 | Spalte 2 | Spalte 3 | Spalte 4 |
|---|---|---|---|---|
| **Zeile 1** | Totenkopf *(ungenutzt)* | Kompass | Anker | Schatztruhe |
| **Zeile 2** | Segelschiff *(ungenutzt)* | Palmeninsel *(ungenutzt)* | Berge | Poseidon *(ungenutzt)* |

Vier der acht Felder wurden nie benutzt. Wer das Sprite neu baut, kann es also
auf die Hälfte eindampfen. Zum Totenkopf: Piratenromantik passt nicht zu einem
Gasthof-Inhaber, der sich über Provision ärgert. Die Karte als Weg zum Ziel
passt schon.

## Zurückholen, drei Schritte

1. **Bilder** hoch ins Hauptverzeichnis, neben `index.html`:
   `kartenmotive.webp` und `kartenmotive-mobile.webp`.
2. **CSS** aus `motive.css` in den `<style>`-Block von `index.html`. Der obere,
   große Teil kam direkt vor den Kommentar „Sektionsraster". Der kleine Rest am
   Dateiende gehört in den vorhandenen Block `@media (max-width:700px)` unter
   „Mobile Performance".
3. **HTML** aus `motive.html`: Jedes `<span>` als erstes Kind in seine Sektion,
   direkt hinter das `<section>`-Tag und vor `<div class="sec-head">`.

**Das JavaScript muss nicht angefasst werden.** Es ist absichtlich in
`index.html` geblieben. Alle Zugriffe sind abgesichert (`if(schatz)`,
`if(truhe && …)`, `if(anker && letzte)`), laufen ohne Motive einfach ins Leere
und greifen wieder, sobald die Elemente da sind. Betrifft `baueMotive()`,
`setzeMotive()`, den Zielpunkt der Route und den Umweg in „Über uns".

## Was sich durch das Entfernen geändert hat

Zwei Dinge, die beim Zurückholen von selbst wiederkommen:

**Die Fußspur schwenkt auf dem Handy in „Über uns" nicht mehr nach rechts.**
Der Anker trug diesen Seitenwechsel, sein Abstand nach unten (158px) war der
Platz dafür. Ohne ihn läuft die Spur dort gerade durch die linke Bahn. Kollidiert
mit nichts, ist nur weniger verspielt.

**Die Spur endet nicht mehr auf der Truhe**, sondern am normalen Haltepunkt der
Kontakt-Sektion. Der Zielpunkt ist noch da, er sitzt nur nicht mehr auf einem
Bild.

## Falls sie zurückkommen, vorher lesen

Die Leuchtfarben waren nicht in der Palette. Gemessen ergaben sie:

| Motiv | Farbton beim Leuchten | |
|---|---|---|
| Anker | 210° | Blau |
| Berge | 205° | Blau |
| Kompass | ~37° | passt |
| Truhe | Gold | passt |

Die Seite kennt nur Flame (14°), Sun (43°), Tinte und Papier. Ein Blau bei 207°
gibt es sonst nirgends, und das war ein guter Teil des Fremdkörper-Gefühls.
Kalibrierte Werte, die exakt auf die Marke treffen, falls sie gebraucht werden:

```css
.motiv-kompass{--fund-hue:350deg;--fund-sat:4.6;--fund-glow:rgba(255,197,49,.6)}   /* 35°, Bernstein */
.motiv-anker  {--fund-hue:320deg;--fund-sat:4;  --fund-glow:rgba(238,61,14,.45)}   /* 14°, exakt Flame */
.motiv-berge  {--fund-hue:356deg;--fund-sat:3.4;--fund-glow:rgba(255,197,49,.5)}   /* 42°, exakt Sun */
```

Das löst allerdings nur die Farbe, nicht die Detaildichte. Die Schraffuren
bleiben Kupferstich, der Rest der Seite bleibt flächig. Wer den Bruch ganz
loswerden will, baut die vier Motive als Holzschnitt neu: kräftige, leicht
unruhige Konturen, kaum Schraffur, eine Tintenfarbe plus Orange.
