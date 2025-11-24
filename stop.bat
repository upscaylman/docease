@echo off
echo ========================================
echo 🛑 ARRÊT DE TOUS LES SERVICES
echo ========================================
echo.

REM Arrêter le serveur de formulaire (processus PowerShell)
echo 🔍 Recherche du serveur de formulaire...
powershell -ExecutionPolicy Bypass -Command "Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { (Get-WmiObject Win32_Process -Filter \"ProcessId = $($_.Id)\").CommandLine -match 'serve-form' } | ForEach-Object { Stop-Process -Id $_.Id -Force; Write-Host '✅ Serveur formulaire arrêté (PID:' $_.Id ')' -ForegroundColor Green }"
if errorlevel 1 (
    echo    Aucun serveur de formulaire trouvé ou déjà arrêté
)

echo.

REM Vérifier que Docker est disponible
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker n'est pas accessible, impossible d'arrêter les conteneurs
    echo    Les conteneurs peuvent toujours être en cours d'exécution
    goto :end
)

REM Aller dans le dossier docker
cd /d "%~dp0docker"
if not exist "docker-compose.yml" (
    echo ❌ Fichier docker-compose.yml introuvable dans le dossier docker
    cd /d "%~dp0"
    goto :end
)

REM Arrêter Docker (mode développement par défaut)
echo 📦 Arrêt des conteneurs Docker...
echo    - n8n
echo    - PostgreSQL
echo    - Ollama
echo.
docker compose down
if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de l'arrêt de Docker
    echo    Certains conteneurs peuvent encore être en cours d'exécution
) else (
    echo.
    echo ✅ Conteneurs Docker arrêtés avec succès
)

REM Retour au répertoire racine
cd /d "%~dp0"

:end
echo.
echo ========================================
echo ✅ ARRÊT TERMINÉ
echo ========================================
echo.
echo 💡 Pour redémarrer: start.bat
echo.
pause

