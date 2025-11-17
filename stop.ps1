# Script pour arrêter tous les services (Docker et serveur de formulaire)
# Usage: .\stop.ps1

Write-Host "🛑 Arrêt de tous les services..." -ForegroundColor Cyan
Write-Host ""

# Arrêter le serveur de formulaire
Write-Host "🔍 Recherche du serveur de formulaire..." -ForegroundColor Cyan
$formServerProcesses = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmdLine -match "serve-form-background"
}

if ($formServerProcesses) {
    $count = 0
    foreach ($proc in $formServerProcesses) {
        Write-Host "   Arrêt du processus serveur (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $count++
    }
    Write-Host "✅ Serveur de formulaire arrêté ($count processus)" -ForegroundColor Green
} else {
    Write-Host "   Aucun serveur de formulaire trouvé" -ForegroundColor Gray
}

Write-Host ""

# Arrêter Docker
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerDir = Join-Path $ScriptDir "docker"

if (Test-Path $DockerDir) {
    Set-Location $DockerDir
    
    Write-Host "📦 Arrêt des conteneurs Docker (n8n, PostgreSQL, Ollama)..." -ForegroundColor Cyan
    docker compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conteneurs Docker arrêtés" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erreur lors de l'arrêt de Docker" -ForegroundColor Yellow
    }
    
    Set-Location $ScriptDir
} else {
    Write-Host "⚠️  Répertoire docker non trouvé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Tous les services ont été arrêtés !" -ForegroundColor Green
Write-Host ""

