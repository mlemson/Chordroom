@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js ontbreekt. Installeer Node.js LTS van https://nodejs.org/
 pause
 exit /b 1
)
if not exist .env (
 copy /Y .env.example .env >nul
 echo Optioneel: vul PARSE_API_KEY in het bestand .env in.
)
echo Chordroom kiest zelf een vrije poort. Geen andere lokale app wordt geopend.
node server.mjs --open
if errorlevel 1 pause
