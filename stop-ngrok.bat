@echo off
echo 🛑 Arrêt de ngrok...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\stop-ngrok.ps1"
pause

