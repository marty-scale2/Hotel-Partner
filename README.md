# Thun Hotel Partner

Onepager für `hotel-partner.martinthun.com`.

Direktbuchungen für inhabergeführte Hotels mit 20 bis 35 Zimmern im deutschsprachigen Raum. Katrin und Martin Thun.

## Aufbau

Eine einzige statische Datei, `index.html`. Kein Framework, kein Build-Schritt, keine Abhängigkeiten außer zwei Schriften von Google Fonts (Fraunces und Archivo). Öffnen per Doppelklick genügt.

Acht Sektionen: Hero, Zahlenband, Problem, Unser Weg, Provisionsrechner, Über uns, Vergleich, Kontakt, Fußzeile.

## Offene Punkte vor dem Livegang

- `FORM_ENDPOINT` im Script ist leer. Solange dort nichts steht, zeigt das Formular einen Hinweis auf die direkte E-Mail-Adresse statt zu senden.
- Impressum und Datenschutzerklärung sind Platzhalter-Links (`#impressum`, `#datenschutz`). Beide sind in Deutschland Pflicht.
- Die Bilder von Katrin und Martin fehlen, dort stehen Platzhalterflächen.
- Die Zahlen im Band (7+ Jahre, 1.000+ Kunden, 2+ Jahre OTA) stammen aus der Agenturzeit und aus Katrins Booking-Zeit, nicht aus der Hotellerie.

## Rechenlogik im Provisionsrechner

Basis sind 15 Prozent Provision auf den Portalumsatz, ohne Zahlungsgebühr und ohne Programme. Als realistisch verlagerbar gelten 10 bis 25 Prozent davon. Drei Testfälle stehen als Kommentar über der Funktion `rechnen`.
