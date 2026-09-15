@echo off
echo ===================================================
echo   Pushing Code to GitHub Repository
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/6] Configuring Git Author Identity...
git config user.email "adith@example.com"
git config user.name "Adithya"

echo.
echo [2/6] Initializing Git Repository...
git init

echo.
echo [3/6] Staging All Files...
git add .

echo.
echo [4/6] Committing Code...
git commit -m "Initial commit: Production-Grade Hospital Management System (IaC, Backend, Frontend, Docker, Docs)"

echo.
echo [5/6] Setting Main Branch & Remote Repository...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-.git

echo.
echo [6/6] Pushing to GitHub (Force Push)...
git push -u origin main --force

echo.
echo ===================================================
echo   Repository Successfully Pushed to GitHub!
echo   URL: https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-
echo ===================================================
pause
