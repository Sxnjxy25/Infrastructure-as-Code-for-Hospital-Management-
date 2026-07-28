Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Hospital Management System - Quick Startup Script" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Path $PSScriptRoot -Parent

Write-Host "[1/3] Setting up Backend Database Schema & Seeding Data..." -ForegroundColor Yellow
Set-Location -Path "$rootDir\backend"
npm install
npx prisma generate
npx prisma db push
npm run seed

Write-Host ""
Write-Host "[2/3] Starting Backend REST API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; npm run dev"

Write-Host ""
Write-Host "[3/3] Starting Frontend React UI App (Port 3000)..." -ForegroundColor Yellow
Set-Location -Path "$rootDir\frontend"
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Hospital Management System Stack Started!" -ForegroundColor Green
Write-Host "  Frontend Web UI : http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend REST API: http://localhost:5000/api/health" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
