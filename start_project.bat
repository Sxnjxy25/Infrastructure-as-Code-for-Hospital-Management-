@echo off
echo ===================================================
echo   Hospital Management System - Quick Startup Script
echo ===================================================
echo.

echo [1/4] Ensuring PostgreSQL Database / Service...
cd docker
docker compose up -d postgres 2>nul
if %errorlevel% neq 0 (
    echo Docker not found or not running. Using local / SQLite database.
)

echo.
echo [2/4] Setting up Python Backend Dependencies & Seeding Data...
cd ..\backend
py -m pip install -r requirements.txt
py -m app.seed

echo.
echo [3/4] Starting Python FastAPI REST API Server (Port 5000)...
start "HMS Python Backend API" cmd /k "py run.py"

echo.
echo [4/4] Starting Frontend React UI App (Port 3000)...
cd ..\frontend
call npm install
start "HMS Frontend UI" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Hospital Management System Stack Started!
echo   Frontend Web UI : http://localhost:3000
echo   Backend REST API: http://localhost:5000/api/health
echo   API Docs (Swagger): http://localhost:5000/docs
echo ===================================================
pause
