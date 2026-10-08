@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js ontbreekt. Installeer eerst Node.js LTS vanaf https://nodejs.org/
  pause
  exit /b 1
)
node diagnose.mjs
pause
