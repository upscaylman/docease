@echo off
echo ========================================
echo   ARRET DE NGROK
echo ========================================
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\stop-ngrok.ps1"
pause

