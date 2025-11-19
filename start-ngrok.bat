@echo off
echo ========================================
echo 🌐 DÉMARRAGE DU TUNNEL NGROK
echo ========================================
echo.

REM Vérifier que PowerShell est disponible
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo ❌ PowerShell n'est pas disponible
    pause
    exit /b 1
)

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-ngrok.ps1"

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du démarrage de ngrok
    pause
    exit /b 1
)

echo.
pause

