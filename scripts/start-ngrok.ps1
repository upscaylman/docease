# Script pour démarrer ngrok et mettre à jour les URLs dans l'application
# Usage: .\scripts\start-ngrok.ps1

param(
    [int]$Port = 5678,
    [string]$NgrokPath = "ngrok"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🌐 DÉMARRAGE DU TUNNEL NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si ngrok est installé
$ngrokCheck = Get-Command $NgrokPath -ErrorAction SilentlyContinue
if (-not $ngrokCheck) {
    # Essayer de trouver ngrok dans les emplacements courants
    $commonPaths = @(
        "$env:LOCALAPPDATA\Microsoft\WindowsApps\ngrok.exe",
        "$env:ProgramFiles\ngrok\ngrok.exe",
        "$env:ProgramFiles(x86)\ngrok\ngrok.exe",
        "C:\ngrok\ngrok.exe"
    )
    
    $ngrokFound = $false
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $NgrokPath = $path
            $ngrokFound = $true
            Write-Host "✅ ngrok trouvé: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $ngrokFound) {
        Write-Host "❌ ngrok n'est pas installé ou non trouvé dans le PATH" -ForegroundColor Red
        Write-Host "   Installez ngrok depuis: https://ngrok.com/download" -ForegroundColor Yellow
        Write-Host "   Ou spécifiez le chemin avec: -NgrokPath 'C:\chemin\vers\ngrok.exe'" -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier si ngrok est déjà en cours d'exécution
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "⚠️  ngrok est déjà en cours d'exécution" -ForegroundColor Yellow
    Write-Host "   Arrêt de l'instance existante..." -ForegroundColor Yellow
    Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Vérifier si le port est utilisé
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Write-Host "⚠️  Aucun service n'écoute sur le port $Port" -ForegroundColor Yellow
    Write-Host "   Assurez-vous que n8n est démarré sur le port $Port" -ForegroundColor Yellow
}

# Démarrer ngrok en arrière-plan
Write-Host "🚀 Démarrage de ngrok sur le port $Port..." -ForegroundColor Cyan
$ngrokProcess = Start-Process -FilePath $NgrokPath -ArgumentList "http", $Port -PassThru -WindowStyle Hidden

if (-not $ngrokProcess) {
    Write-Host "❌ Impossible de démarrer ngrok" -ForegroundColor Red
    exit 1
}

# Attendre que ngrok soit prêt
Write-Host "⏳ Attente du démarrage de ngrok..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Récupérer l'URL ngrok depuis l'API locale
$maxRetries = 10
$retryCount = 0
$ngrokUrl = $null

while ($retryCount -lt $maxRetries -and -not $ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
        
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            # Prendre le premier tunnel HTTPS
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                $ngrokUrl = $httpsTunnel.public_url
            } else {
                # Sinon prendre le premier tunnel disponible
                $ngrokUrl = $response.tunnels[0].public_url
            }
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $ngrokUrl) {
    Write-Host "❌ Impossible de récupérer l'URL ngrok" -ForegroundColor Red
    Write-Host "   Vérifiez que ngrok est bien démarré: http://localhost:4040" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok démarré avec succès!" -ForegroundColor Green
Write-Host "   URL publique: $ngrokUrl" -ForegroundColor Cyan
Write-Host ""

# Mettre à jour les URLs dans index.html
$indexHtmlPath = Join-Path $PSScriptRoot "..\templates\form\index.html"
if (Test-Path $indexHtmlPath) {
    Write-Host "📝 Mise à jour des URLs dans index.html..." -ForegroundColor Cyan
    
    $content = Get-Content $indexHtmlPath -Raw -Encoding UTF8
    
    # Extraire les IDs des webhooks depuis le contenu actuel
    $webhookId = $null
    $webhookEmailId = $null
    
    if ($content -match "WEBHOOK_URL:\s*'[^']*/webhook/([^']+)'") {
        $webhookId = $matches[1]
    }
    if ($content -match "WEBHOOK_EMAIL_URL:\s*'[^']*/webhook/([^']+)'") {
        $webhookEmailId = $matches[1]
    }
    
    if (-not $webhookId -or -not $webhookEmailId) {
        Write-Host "⚠️  Impossible d'extraire les IDs des webhooks depuis index.html" -ForegroundColor Yellow
        Write-Host "   Utilisation des IDs par défaut..." -ForegroundColor Yellow
        $webhookId = "7f72ac69-35b7-4771-a5c6-7acb18947254"
        $webhookEmailId = "1ee6e745-fc31-4fd8-bc59-531bd4a69997"
    }
    
    # Construire les nouvelles URLs
    $newWebhookUrl = "$ngrokUrl/webhook/$webhookId"
    $newWebhookEmailUrl = "$ngrokUrl/webhook/$webhookEmailId"
    
    # Remplacer les URLs dans window.ENV (gère localhost:3000, localhost:5678, ou ngrok)
    $content = $content -replace "(WEBHOOK_URL:\s*')[^']*'", "`$1$newWebhookUrl'"
    $content = $content -replace "(WEBHOOK_EMAIL_URL:\s*')[^']*'", "`$1$newWebhookEmailUrl'"
    
    # Sauvegarder le fichier
    Set-Content -Path $indexHtmlPath -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "✅ URLs mises à jour dans index.html" -ForegroundColor Green
    Write-Host "   WEBHOOK_URL: $newWebhookUrl" -ForegroundColor Gray
    Write-Host "   WEBHOOK_EMAIL_URL: $newWebhookEmailUrl" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Fichier index.html non trouvé: $indexHtmlPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ NGROK CONFIGURÉ ET PRÊT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informations:" -ForegroundColor Cyan
Write-Host "   - URL ngrok: $ngrokUrl" -ForegroundColor White
Write-Host "   - Interface ngrok: http://localhost:4040" -ForegroundColor White
Write-Host "   - n8n local: http://localhost:$Port" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pour arrêter ngrok:" -ForegroundColor Yellow
Write-Host "   Stop-Process -Name 'ngrok' -Force" -ForegroundColor Gray
Write-Host "   Ou utilisez: .\scripts\stop-ngrok.ps1" -ForegroundColor Gray
Write-Host ""

# Retourner l'URL pour utilisation dans d'autres scripts
return $ngrokUrl

