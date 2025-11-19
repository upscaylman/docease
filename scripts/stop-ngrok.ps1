# Script pour arrêter ngrok
# Usage: .\scripts\stop-ngrok.ps1

Write-Host "🛑 Arrêt de ngrok..." -ForegroundColor Cyan

$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

if ($ngrokProcess) {
    Stop-Process -Name "ngrok" -Force
    Write-Host "✅ ngrok arrêté avec succès" -ForegroundColor Green
} else {
    Write-Host "ℹ️  ngrok n'est pas en cours d'exécution" -ForegroundColor Yellow
}

