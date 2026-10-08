# Chordroom — piano, akkoorden en Ultimate Guitar-proef

Een zelfstandige, lokaal draaiende demonstratie van Chordroom. **Niet** de bestaande Chordroom-website en nog **geen** productieversie. Alles werkt met Node.js 18+ zonder npm-installatie.

## Direct starten (Windows)
1. Pak de ZIP volledig uit in een map.
2. Installeer [Node.js LTS](https://nodejs.org/) als je dat nog niet hebt. Open daarna opnieuw de map.
3. Dubbelklik `start-chordroom.bat` (niet `index.html`). Je browser opent een automatisch gekozen vrije poort zoals `http://127.0.0.1:49152/`.
4. Zonder API-sleutel werken demonstratienummer, importeren, transponeren, piano, afspelen en exporteren.

## API instellen (optioneel)
1. Maak een API-sleutel aan op https://parse.bot/marketplace/79815618-69fa-404a-a63a-5b743e000b07/ultimate-guitar-com-api
2. Open `.env` (deze wordt na de eerste start gemaakt). Vul `PARSE_API_KEY=jouw_echte_sleutel` in, zonder aanhalingstekens.
3. Sluit het zwarte terminalvenster en start `start-chordroom.bat` opnieuw.
4. Gebruik **Nummer zoeken**, bijvoorbeeld `coldplay yellow`.

**Foutmeldingen** zoals `API-sleutel wordt geweigerd (401/403)`, `limiet bereikt (429)` of `geen JSON` worden weergegeven bij het zoekveld. De sleutel wordt uitsluitend door de lokale backend gebruikt. Zet `.env` nooit online en zet de server niet publiek toegankelijk.

## Handmatig importeren en Fretlist
- Open een akkoordenschema op Ultimate Guitar; probeer `Ctrl+A`, `Ctrl+C`, plak in Chordroom. Bij een volledige UG-pagina kan dit rommelige regels opleveren: automatische opschoning is *best-effort*.
- Betrouwbaarder: gebruik Fretlist's gratis https://fretlist.com/tools/ultimate-guitar-to-chordpro , kopieer het ChordPro-resultaat en plak of upload het `.cho`-bestand in Chordroom.
- ChordPro `[G]tekst [C]tekst` en eenvoudige regels met akkoorden boven de tekst worden herkend. Er is nog geen geavanceerde PDF/OCR-import.

## Functies
- Eigen songbibliotheek in de **lokale browseropslag**; andere browsers/apparaten hebben geen gedeelde bibliotheek. Geen login, cloud-backup of sync. Exporteer `.cho` als backup.
- Twee instrumentmodi: **piano** (klinkende akkoorden, capo meegeteld) en **gitaar** (gitaarvormen zonder capo-offset).
- Transponeren, capo instellen, aangeklikte akkoorden op een SVG-piano en een eenvoudige synthetische akkoordklank.
- Bewerk de songtekst en metadata; exporteer naar `.cho`.
- Donker/licht, responsive weergave en speelmodus.

## Beperkingen
- On-officiële Ultimate Guitar API is experimenteel; er kunnen kosten/credits, storingen en gebruiksrechtelijke beperkingen gelden. Live toegang is niet door deze demo gegarandeerd.
- Transpositie/akkoordtheorie dekt gangbare akkoorden, maar niet elke jazznotatie, enharmonische spelling of complexe voicing.
- Import uit volledige websitekopieën kan rommelig zijn; ChordPro is de voorkeursvorm.
- Piano speelt vereenvoudigde akkoordtonen, geen begeleiding met realistische samples, geen tijdsynchronisatie met audio of automatische akkoordherkenning.
- Gebruik voor eigen muziek of materiaal waarvoor je toestemming/rechten hebt; het importeren maakt externe teksten niet rechtenvrij.

## Ontwikkelaar
`node server.mjs` start de app. `node server.mjs --self-test` voert de routevalidatie-smoketest uit; `node test/test.mjs` voert offline regressietests uit.

API-routes: `GET /api/config`, `GET /api/search?q=...`, `GET /api/chart?url=...`. Sleutels komen niet in frontendbestanden. De server luistert uitsluitend op `127.0.0.1`.

## API-fout onderzoeken
Dubbelklik `diagnose-api.bat`. Dit controleert Node.js, of de sleutel is ingesteld, een zoekopdracht en vervolgens het ophalen van een akkoordenschema. Een succesvolle diagnose bevestigt daadwerkelijke toegang vanaf jouw pc; de offline tests doen dat niet. **Let op:** bij een aanwezige sleutel kunnen beide testverzoeken API-credits verbruiken. Deel nooit je sleutel in een foutmelding of screenshot.

## GitHub Pages / zonder server
Open `public/index.html` direct of plaats de inhoud van de map `public/` op GitHub Pages (bijvoorbeeld in `docs/`). Import, pianoweergave, transponeren en opslag blijven werken. De Ultimate Guitar API is bewust niet beschikbaar op een openbare statische website: een API-sleutel mag nooit in JavaScript aan bezoekers worden gestuurd. Gebruik voor automatische API-import een lokale of aparte private backend.

## Nieuwe functies v2
- Standaard dark mode met wissel naar licht en onthouden voorkeur.
- Gitaar-/pianomodus, 1e/2e/3e akkoordinversies afhankelijk van de tonen, formaat van de songtekst instellen.
- Bibliotheek-JSON-backup downloaden (voor handmatige bewaring).
- Server start op automatisch vrije poort; `PORT=...` blijft mogelijk voor experts.
- De bibliotheek is browsergebonden en niet gesynchroniseerd.
