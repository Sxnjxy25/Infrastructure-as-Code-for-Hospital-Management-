@echo off
cd /d "%~dp0"
py push_to_github.py %*
pause
