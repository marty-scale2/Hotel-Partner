# HOTELFREUNDE

Website von Hotelfreunde (Katrin Göschl und Martin Thun) unter `www.hotelfreunde.com`.

## Aufbau (seit 24.09.2026)

Die Startseite ist das Website-Angebot für Hotels (Website as a Service, drei Pakete). Vorher lag es als Unterseite unter `/website`, die Startseite war die Schatzkarten-Seite. Die steht nur noch in der Git-Historie, letzter Stand Commit `1458eb1`.

- `index.html`: die Startseite
- `assets/`: CSS, JavaScript und Bilder der Startseite. CSS und JS werden mit `?v=` eingebunden, bei jeder Änderung hochzählen
- `impressum.html`, `datenschutz.html`
- `fonts/`: Archivo und Fraunces, lokal, kein Aufruf an Google Fonts
- `archiv/`: frühere Unterseiten (`ki/`, `hotel-beispielseite/`), werden nicht hochgeladen und leiten per `.htaccess` auf die Startseite
- `motive-archiv/`: Motive der Schatzkarte, werden nicht hochgeladen
- `og-image-erzeugen.py`: erzeugt `og-image.png`, das Vorschaubild für geteilte Links

Kein Framework, kein Build-Schritt. Öffnen per Doppelklick genügt.

## Veröffentlichen

Gehostet bei All-Inkl. Hochgeladen wird mit `..\deploy-hotelfreunde.py`, und zwar nur der committete Stand. Also erst committen, dann das Skript starten.
