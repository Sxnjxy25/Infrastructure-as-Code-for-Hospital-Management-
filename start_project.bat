@echo off
echo ===================================================
echo   Hospital Management System - Quick Startup Script
echo ===================================================
echo.

echo [1/4] Starting PostgreSQL Database...
cd docker
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo Docker compose failed or docker is not running.
)

echo.
echo [2/4] Setting up Backend Database Schema & Seeding Data...
cd ..\backend
call npm install
call npx prisma generate
call npx prisma db push
call npm run seed

echo.
echo [3/4] Starting Backend REST API Server (Port 5000)...
start "HMS Backend API" cmd /k "npm run dev"

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
echo ===================================================
pause
