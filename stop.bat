@echo off
echo 🛑 Arrêt de tous les services...
echo.

REM Arrêter le serveur de formulaire (processus PowerShell)
echo 🔍 Recherche du serveur de formulaire...
powershell -ExecutionPolicy Bypass -Command "& { $procs = Get-Process powershell -ErrorAction SilentlyContinue; foreach ($p in $procs) { $cmd = (Get-WmiObject Win32_Process -Filter \"ProcessId = $($p.Id)\").CommandLine; if ($cmd -match 'serve-form-background') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Host '✅ Serveur arrêté (PID: ' $p.Id ')' } } }"
if %errorlevel% neq 0 (
    echo    Aucun serveur de formulaire trouvé ou déjà arrêté
)

echo.

REM Arrêter Docker
echo 📦 Arrêt des conteneurs Docker...
cd docker
docker-compose down
if errorlevel 1 (
    echo ❌ Erreur lors de l'arrêt de Docker
) else (
    echo ✅ Conteneurs Docker arrêtés
)
cd ..

echo.
echo ✅ Tous les services ont été arrêtés !
echo.
pause

