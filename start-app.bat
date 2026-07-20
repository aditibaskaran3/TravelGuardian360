@echo off
REM ============================================================
REM  TravelGuardian360 - daily start (JS changes only)
REM  Double-click this file, or run:  start-app
REM  Use this when the app is ALREADY installed on the phone
REM  and you only changed JavaScript/TypeScript code.
REM ============================================================

cd /d "%~dp0"

REM Fix this machine's env quirk so RN/gradle commands work.
set "NoDefaultCurrentDirectoryInExePath="

echo.
echo [1/3] Checking for a connected device...
adb devices

echo.
echo [2/3] Linking phone to Metro (fixes "Unable to load script")...
adb reverse tcp:8081 tcp:8081
adb shell monkey -p com.travelguardian360 -c android.intent.category.LAUNCHER 1 >nul 2>&1

echo.
echo [3/3] Starting Metro. Leave this window OPEN while you work.
echo   - Press  r  to reload the app
echo   - Press  Ctrl+C  to stop
echo.
call npx react-native start
