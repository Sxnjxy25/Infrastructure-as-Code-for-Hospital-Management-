@echo off
title Push CarePulse HMS to GitHub
echo ====================================================================
echo  Pushing Hospital Management System to GitHub
echo  Target: https://github.com/71382502145sanjaykumar-24/hospital-management-system
echo ====================================================================
echo.
echo Make sure you have created the empty repository on GitHub:
echo https://github.com/new (Name: hospital-management-system)
echo.
git branch -M main
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------------------
    echo If access was denied due to a cached account, you can push with a
    echo GitHub Personal Access Token (PAT) by running:
    echo.
    echo git push https://YOUR_TOKEN@github.com/71382502145sanjaykumar-24/hospital-management-system.git main
    echo ----------------------------------------------------------------
)
pause
