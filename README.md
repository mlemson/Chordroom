# Chordroom — piano, akkoorden en Ultimate Guitar-proef

Chordroom voor piano en gitaar, met GitHub Pages en een optionele lokale Node.js-server.

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


## Automatisch online akkoorden zoeken

Chordroom kan artiest en nummer automatisch zoeken, de beste akkoordenschema's ophalen en meteen op piano of gitaar tonen. Het werkt na eenmalige activering van de online zoekserver op GitHub Pages. Ook directe Ultimate Guitar-tablinks worden ondersteund.

### Eenmalig activeren: vier repository secrets

GitHub Pages kan geen geheime sleutels bewaren. Chordroom heeft daarom een kleine Cloudflare Worker. De app wordt automatisch gekoppeld na een geslaagde GitHub Actions-run.

1. Maak een persoonlijke API-sleutel op https://parse.bot/marketplace/79815618-69fa-404a-a63a-5b743e000b07/ultimate-guitar-com-api . Deze onofficiële dienst heeft beperkte gratis credits.
2. Maak een Cloudflare-account op https://dash.cloudflare.com/sign-up en activeer indien nodig het workers.dev-subdomein.
3. Zoek je Cloudflare Account ID en maak onder API Tokens een token met de template Edit Cloudflare Workers, beperkt tot je eigen account.
4. Open https://github.com/mlemson/Chordroom/settings/secrets/actions en voeg de volgende **vier repository secrets** toe:

| Secretnaam | Waarde |
| --- | --- |
| PARSE_API_KEY | Je persoonlijke Parse API-sleutel |
| CLOUDFLARE_ACCOUNT_ID | Je Cloudflare Account ID |
| CLOUDFLARE_API_TOKEN | Cloudflare API-token met Workers-rechten |
| CHORDROOM_ACCESS_CODE | Zelfgekozen persoonlijke code van minimaal 8 tekens |

5. Open https://github.com/mlemson/Chordroom/actions/workflows/static.yml en kies **Run workflow** op **main**. De workflow test de app, publiceert de Worker en schrijft uitsluitend de **publieke backend-URL** in de GitHub Pages-site. De sleutels blijven geheim.
6. Ga naar https://mlemson.github.io/Chordroom/ . Kies **Nummer zoeken**, vul bijvoorbeeld **Coldplay Yellow** en je **persoonlijke toegangscode** in. Laat **Beste akkoordenversie direct openen** aangevinkt om het gevonden akkoordenschema meteen automatisch te laden.

De persoonlijke toegangscode wordt in de browser alleen gedurende de sessie bewaard. Bij gebruik op een ander apparaat vul je de code opnieuw in. Zonder de vier secrets blijft online zoeken inactief. Deel **nooit** de geheimen of schermafbeeldingen ervan.

### Als automatisch zoeken niet werkt

- **Automatisch zoeken: nog instellen**: de Worker is niet gekoppeld; controleer of alle secrets bestaan en voer de workflow opnieuw uit.
- **Toegangscode onjuist**: controleer de waarde van CHORDROOM_ACCESS_CODE.
- **Geen credits / 429**: Parse heeft onvoldoende tegoed of een tijdelijke limiet.
- **Netwerkfout**: Cloudflare, Parse of Ultimate Guitar kan tijdelijk niet bereikbaar zijn. Kijk in GitHub Actions naar de deploymentstatus.
- Bij **alternatieve uitvoeringen** kun je het automatisch openen uitvinken en één van de resultaten kiezen.
- Voor **lokaal gebruik** volstaat nog steeds de bestaande Node-server met PARSE_API_KEY in een privé .env-bestand.

Deze toepassing gebruikt een experimentele, onofficiële Ultimate Guitar-bron. Toegang, voorwaarden en beschikbaarheid kunnen veranderen. Het gebruiken of herpubliceren van songteksten en arrangementen kan auteursrechtelijk beperkt zijn. Gebruik materiaal waarvoor je rechten hebt en publiceer het niet zomaar door.

## Nieuwe functies v2
- Standaard dark mode met wissel naar licht en onthouden voorkeur.
- Gitaar-/pianomodus, 1e/2e/3e akkoordinversies afhankelijk van de tonen, formaat van de songtekst instellen.
- Bibliotheek-JSON-backup downloaden (voor handmatige bewaring).
- Server start op automatisch vrije poort; `PORT=...` blijft mogelijk voor experts.
- De bibliotheek is browsergebonden en niet gesynchroniseerd.
