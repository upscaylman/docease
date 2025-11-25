# Script pour démarrer ngrok sur le port 8080 (serveur PowerShell)
# Ce tunnel expose le serveur serve-form.ps1 pour la conversion PDF

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE DU TUNNEL NGROK (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$Port = 8080

# Vérifier que le service est accessible
Write-Host "Verification que le serveur PowerShell est accessible sur le port $Port..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "Serveur local accessible sur http://localhost:$Port" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERREUR: Le serveur PowerShell n'est pas accessible sur le port $Port" -ForegroundColor Red
    Write-Host "Assurez-vous que serve-form.ps1 est demarré avant de lancer ngrok." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour demarrer le serveur:" -ForegroundColor White
    Write-Host "  cd templates\form" -ForegroundColor Gray
    Write-Host "  .\serve-form.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Vérifier si ngrok est déjà en cours d'exécution sur ce port
$existingNgrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmdLine -match "http.*$Port"
}

if ($existingNgrok) {
    Write-Host ""
    Write-Host "Un tunnel ngrok est deja actif sur le port $Port" -ForegroundColor Yellow
    Write-Host "Arret du tunnel existant..." -ForegroundColor Yellow
    Stop-Process -Id $existingNgrok.Id -Force
    Start-Sleep -Seconds 2
}

# Démarrer ngrok
Write-Host "Demarrage de ngrok sur le port $Port..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "$Port" -WindowStyle Normal

# Attendre que ngrok démarre
Write-Host "Attente du demarrage de ngrok..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Récupérer l'URL publique via l'API ngrok
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET
    $tunnel = $ngrokApi.tunnels | Where-Object { $_.config.addr -match ":$Port" } | Select-Object -First 1
    
    if ($tunnel) {
        $publicUrl = $tunnel.public_url
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "NGROK DEMARRE (PowerShell Server)" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "URL publique ngrok: $publicUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Informations:" -ForegroundColor White
        Write-Host "  - Interface ngrok: http://localhost:4040" -ForegroundColor Gray
        Write-Host "  - Serveur local: http://localhost:$Port" -ForegroundColor Gray
        Write-Host "  - URL publique: $publicUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Endpoint conversion PDF:" -ForegroundColor Yellow
        Write-Host "  $publicUrl/api/convert-pdf" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IMPORTANT: Mettez a jour la variable d'environnement Netlify:" -ForegroundColor Yellow
        Write-Host "  WEBHOOK_PDF_CONVERT_URL=$publicUrl/api/convert-pdf" -ForegroundColor White
        Write-Host ""
        Write-Host "Pour arreter ngrok: Stop-Process -Name 'ngrok' -Force" -ForegroundColor Gray
        Write-Host ""
        
        # Copier l'URL dans le presse-papiers
        Set-Clipboard -Value "$publicUrl/api/convert-pdf"
        Write-Host "URL copiee dans le presse-papiers!" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "Impossible de recuperer l'URL ngrok automatiquement" -ForegroundColor Yellow
        Write-Host "Consultez l'interface ngrok: http://localhost:4040" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "Erreur lors de la recuperation de l'URL ngrok: $_" -ForegroundColor Red
    Write-Host "Consultez l'interface ngrok: http://localhost:4040" -ForegroundColor Yellow
    Write-Host ""
}

