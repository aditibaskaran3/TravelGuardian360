@echo off
REM ============================================================
REM  TravelGuardian360 - full build + install + launch
REM  Double-click this file, or run:  run-app
REM  Use this the FIRST time, or after adding a NATIVE package
REM  (e.g. geolocation, maps). Slower - it recompiles native code.
REM  Keep the phone plugged in until it says "Installed on 1 device".
REM ============================================================

cd /d "%~dp0"

REM Fix this machine's env quirk so gradlew.bat is found.
set "NoDefaultCurrentDirectoryInExePath="

echo.
echo Checking for a connected device...
adb devices

echo.
echo Building, installing and launching the app (this can take a few minutes)...
call npx react-native run-android
