@echo off
echo 🚀 Démarrage de n8n et du serveur de formulaire...
echo.

REM Démarrer Docker
cd docker
docker-compose up -d
if errorlevel 1 (
    echo ❌ Erreur lors du démarrage de Docker
    pause
    exit /b 1
)

REM Retour au répertoire racine
cd ..

REM Démarrer le serveur de formulaire en arrière-plan
echo 🌐 Démarrage du serveur de formulaire...
start /B powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0templates\form\serve-form-background.ps1"

REM Attendre un peu pour que tout démarre
timeout /t 3 /nobreak >nul

echo.
echo ✅ Tout est démarré !
echo.
echo 📋 Accès aux services:
echo    - n8n Interface: http://localhost:5678
echo    - Formulaire: http://localhost:3000
echo.
echo 💡 Pour arrêter:
echo    - Docker: cd docker && docker-compose down
echo    - Serveur formulaire: Fermez cette fenêtre
echo.
pause
