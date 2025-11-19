@echo off
echo ========================================
echo 🚀 PRÉPARATION PRODUCTION AVEC NGROK
echo ========================================
echo.

REM Vérifier que ngrok est en cours d'exécution
tasklist /FI "IMAGENAME eq ngrok.exe" 2>NUL | find /I /N "ngrok.exe">NUL
if errorlevel 1 (
    echo ❌ ngrok n'est pas en cours d'exécution
    echo    Démarrez ngrok d'abord avec: start-ngrok.bat
    pause
    exit /b 1
)

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\prepare-production-ngrok.ps1"

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de la préparation
    pause
    exit /b 1
)

echo.
pause

