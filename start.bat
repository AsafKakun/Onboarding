@echo off
rem Double-click this file to open the Onboarding dashboard in your browser.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Please install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies for the first time, this can take a minute...
  call npm install
  if errorlevel 1 (
    echo Installation failed.
    pause
    exit /b 1
  )
)

echo Starting the dashboard. Keep this window open while you use it, and close it to stop.
call npm run dev -- --open
pause
