@echo off
REM TravelGuardian360 - starts the API (port 8000) and the web app (port 5173).
cd /d "%~dp0"
if not exist node_modules call npm install --legacy-peer-deps
if not exist backend\.env copy backend\.env.example backend\.env >nul
pip install -r backend\requirements.txt
start "TravelGuardian360 API" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
start "TravelGuardian360 Web" cmd /k "npm run web"
timeout /t 6 >nul
start http://localhost:5173
