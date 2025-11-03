# Script pour démarrer n8n en mode développement local
# Usage: .\start.ps1

Write-Host "🚀 Démarrage de n8n (développement local)..." -ForegroundColor Cyan

# Aller dans le répertoire docker
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerDir = Join-Path $ScriptDir "docker"

Set-Location $DockerDir

# Vérifier si Docker est en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Cyan
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur: Docker n'est pas en cours d'exécution" -ForegroundColor Red
        Write-Host "   Veuillez démarrer Docker Desktop et réessayer" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ Erreur: Docker n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop et réessayer" -ForegroundColor Yellow
    exit 1
}

# Vérifier si le fichier .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Le fichier .env n'existe pas" -ForegroundColor Yellow
    Write-Host "   Création d'un fichier .env à partir de env.example..." -ForegroundColor Cyan
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "   ✅ Fichier .env créé. Veuillez le modifier selon vos besoins." -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Le fichier env.example n'existe pas non plus" -ForegroundColor Red
        exit 1
    }
}

# Démarrer les services
Write-Host "📦 Démarrage des conteneurs Docker..." -ForegroundColor Cyan
docker-compose up -d

# Attendre quelques secondes pour que n8n démarre
Write-Host "⏳ Attente du démarrage de n8n..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Vérifier que le conteneur est en cours d'exécution
if (docker ps | Select-String -Pattern "n8n-local") {
    Write-Host "✅ n8n démarré avec succès!" -ForegroundColor Green
    
    # Démarrer le serveur de formulaire en arrière-plan
    $FormServerScript = Join-Path $ScriptDir "..\templates\form\serve-form-background.ps1"
    if (Test-Path $FormServerScript) {
        Write-Host "🌐 Démarrage du serveur de formulaire..." -ForegroundColor Cyan
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", "`"$FormServerScript`"" -WindowStyle Hidden
        Start-Sleep -Seconds 1
        Write-Host "✅ Serveur de formulaire démarré!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📋 Informations:" -ForegroundColor Cyan
    Write-Host "   - Interface n8n: http://localhost:5678"
    Write-Host "   - Formulaire: http://localhost:3000"
    Write-Host "   - Documentation: Voir docs/INSTALLATION.md"
    Write-Host ""
    Write-Host "📊 Statut des conteneurs:" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
    Write-Host "💡 Commandes utiles:" -ForegroundColor Cyan
    Write-Host "   - Voir les logs: docker-compose logs -f"
    Write-Host "   - Arrêter n8n: docker-compose down"
    Write-Host "   - Statut: docker ps"
    Write-Host ""
    Write-Host "⚠️  Pour arrêter le serveur de formulaire:" -ForegroundColor Yellow
    Write-Host "   Fermez la fenêtre PowerShell ou arrêtez le processus"
}
else {
    Write-Host "❌ Erreur: n8n n'a pas démarré correctement" -ForegroundColor Red
    Write-Host "   Consultez les logs avec: docker-compose logs" -ForegroundColor Yellow
    exit 1
}
