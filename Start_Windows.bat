@echo off
echo Starting Allerion Digital Twin...
cd /d "%~dp0"
start "Allerion Web Server" python -m http.server 8000
timeout 1 > NUL
start http://localhost:8000
