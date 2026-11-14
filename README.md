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


## Piano Studio (experimenteel)

De nieuwe interactieve pianomodus is beschikbaar via de knop **Piano Studio** in de bibliotheek, of direct op `/piano.html`.

- Vallende noten, visueel klavier, afspeelsnelheid 50–125%, pauze, herstart en tijdlijn.
- **Wacht op mij** pauzeert bij de volgende noot tot je deze zelf speelt. Schakel dit uit om de oefening in eigen tempo af te spelen (eenvoudig synthesizergeluid).
- Speel via een USB/Bluetooth MIDI-keyboard (op ondersteunde browsers), via de toetsen A S D F G H J K L, of via de virtuele toetsen op het scherm.
- De microfoonfunctie probeert **één toon tegelijk** te herkennen (experimenteel). Complexe pianoakkoorden worden hiermee niet betrouwbaar herkend.
- Importeer een `.mid` of `.midi`-bestand. Het bestand wordt lokaal in de browser geanalyseerd, met ondersteuning voor meerdere MIDI-sporen en tempoveranderingen. Bij meerdere sporen kies je een instrument-/pianospoor. Er is geen account, server of handmatige noteninvoer nodig.
- Probeer vooraf ingevulde oefeningen, zoals *Ode aan de vreugde*.

**Beperkingen van deze eerste versie:** de notenbaan toont C3 tot en met B5 (noten buiten dat bereik worden niet weergegeven); één MIDI-spoor kan handmatig worden gekozen wanneer meerdere sporen aanwezig zijn; microfoondetectie is niet geschikt voor complete opnames of polyfone stukken; automatische audio-naar-MIDI-analyse, publieke liedjescatalogus en leerlevels moeten nog worden toegevoegd. Spotify-streams worden **niet** gelezen, gedownload of gesynchroniseerd; dat past niet bij de Spotify API/developer rules. Voor automatische audioherkenning is de latere route een audio-bestand met toestemming verwerken via bijvoorbeeld het open-source **Basic Pitch** of een gespecialiseerde pianotranscriptie-engine.

De oorspronkelijke Chordroom-bibliotheek blijft beschikbaar en de nieuwe pagina is onafhankelijk van de onofficiële Ultimate Guitar API.


## Automatische audioherkenning met Basic Pitch (Piano Studio)

Gebruik **Audio → noten (AI)** in `piano.html`. Selecteer een eigen MP3, WAV, OGG of andere browser-ondersteunde geluidsopname. Chordroom decodeert de audio, zet deze lokaal om naar mono 22.050 Hz, draait het open-source **Spotify Basic Pitch TypeScript**-model en toont de herkende noten direct op de piano roll. Geen handmatige noteninvoer, API-sleutel, account of eigen server nodig. De audio wordt **niet geüpload**; de benodigde JavaScript-bundel en modelbestanden worden vanaf je eigen GitHub Pages-site gedownload.

- Analysebereik instelbaar: eerste 30, 60, 120 of 180 seconden. Om browsergeheugen en accuverbruik te beschermen, is 180 seconden voorlopig het maximum.
- Voortgang en foutmelding worden in de interface getoond. Op mobiel kan analyse relatief zwaar zijn.
- **Basic Pitch is geen Spotify-streamingkoppeling**. Audio en MIDI uit een Spotify-afspeelsessie worden niet gelezen of gesynchroniseerd.
- Polyfone herkende noten worden in de pianoroll geplaatst. Audio-transcriptie is een *schatting*, geen perfecte partituur. Solo-piano of een geïsoleerd pianospeler levert meestal betere resultaten op dan een volledige mix met zang en drums. De roll toont een venster van vier octaven; sommige voorspelde noten vallen mogelijk buiten dit bereik.
- Selecteren van een eigen bestand is nodig; automatisch publieke liedjes zoeken of liedjes rechtstreeks streamen is nog niet toegevoegd.
- Verwerk alleen opnames waarvoor je toestemming hebt of die je zelf mag gebruiken. De AI-resultaten worden niet in een gedeelde online catalogus gepubliceerd.

### Lokaal ontwikkelen / bouwen

De AI-code is ondergebracht in `src/basic-pitch-client.js` en `src/transcription-utils.mjs`, met automatische build in GitHub Actions. Alleen het AI-gedeelte vereist npm:

```sh
npm install
npm run build:piano-ai
node server.mjs
```

De build maakt `public/basic-pitch.bundle.js` en `public/models/basic-pitch/{model.json,group1-shard1of1.bin}`. Dit zijn gegenereerde bestanden; voeg ze niet handmatig toe aan Git. De gewone Chordroom-pagina werkt ook zonder deze build. Bij GitHub Pages worden de bestanden vóór publicatie automatisch gegenereerd.

Basic Pitch © Spotify AB, [Apache-2.0](https://github.com/spotify/basic-pitch-ts/blob/main/LICENSE). De library- en modelassets worden rechtstreeks uit `@spotify/basic-pitch@1.0.1` opgebouwd.
