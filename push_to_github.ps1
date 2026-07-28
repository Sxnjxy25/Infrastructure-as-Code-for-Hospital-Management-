Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Pushing Code to GitHub Repository" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot

Write-Host "[1/6] Configuring Git Author Identity..." -ForegroundColor Yellow
git config user.email "adith@example.com"
git config user.name "Adithya"

Write-Host ""
Write-Host "[2/6] Initializing Git Repository..." -ForegroundColor Yellow
git init

Write-Host ""
Write-Host "[3/6] Staging All Files..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "[4/6] Committing Code..." -ForegroundColor Yellow
git commit -m "Initial commit: Production-Grade Hospital Management System (IaC, Backend, Frontend, Docker, Docs)"

Write-Host ""
Write-Host "[5/6] Setting Main Branch & Remote Repository..." -ForegroundColor Yellow
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-.git

Write-Host ""
Write-Host "[6/6] Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Repository Successfully Pushed to GitHub!" -ForegroundColor Green
Write-Host "  URL: https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
