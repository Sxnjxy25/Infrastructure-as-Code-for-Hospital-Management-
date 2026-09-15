@echo off
title Push CarePulse HMS to GitHub
echo ====================================================================
echo  Target: https://github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-
echo ====================================================================
echo.
echo Removing old cached credentials for github.com...
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
cmdkey /delete:git:https://github.com >nul 2>&1

echo.
echo Pushing to GitHub (will open browser login for Sxnjxy25 if prompted)...
git branch -M main
git push -u origin main --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------------------
    echo If push failed, you can push directly using a Personal Access Token:
    echo git push https://YOUR_TOKEN@github.com/Sxnjxy25/Infrastructure-as-Code-for-Hospital-Management-.git main --force
    echo ----------------------------------------------------------------
)
pause
