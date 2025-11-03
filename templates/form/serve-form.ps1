# Serveur HTTP simple pour servir le formulaire HTML
# Résout le problème CORS avec l'origine 'null'

Write-Host "🌐 Démarrage du serveur de formulaire..." -ForegroundColor Cyan

$Port = 3000
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FormPath = Join-Path $ScriptDir "form.html"

# Vérifier si le port est disponible
$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "⚠️  Le port $Port est déjà utilisé. Tentative avec le port $($Port+1)..." -ForegroundColor Yellow
    $Port = $Port + 1
}

# Fonction pour servir le fichier HTML
function Handle-Request {
    param(
        [System.Net.HttpListenerContext]$Context
    )
    
    $Request = $Context.Request
    $Response = $Context.Response
    
    Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] $($Request.HttpMethod) $($Request.Url.PathAndQuery)" -ForegroundColor Gray
    
    # Headers CORS
    $Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    
    # Gérer les requêtes OPTIONS (preflight)
    if ($Request.HttpMethod -eq "OPTIONS") {
        $Response.StatusCode = 204
        $Response.Close()
        return
    }
    
    # Servir le fichier HTML
    if ($Request.Url.AbsolutePath -eq "/" -or $Request.Url.AbsolutePath -eq "/form.html") {
        if (Test-Path $FormPath) {
            $Content = Get-Content $FormPath -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)
            
            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200
            
            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        } else {
            $Response.StatusCode = 404
            $Response.Close()
            return
        }
    } else {
        $Response.StatusCode = 404
    }
    
    $Response.Close()
}

# Créer le listener HTTP
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

try {
    $Listener.Start()
    Write-Host "✅ Serveur démarré sur http://localhost:$Port" -ForegroundColor Green
    Write-Host "📋 Formulaire accessible sur: http://localhost:$Port/" -ForegroundColor Cyan
    Write-Host "🛑 Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
    Write-Host ""
    
    # Boucle principale pour gérer les requêtes
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        Handle-Request -Context $Context
    }
}
catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
finally {
    if ($Listener.IsListening) {
        $Listener.Stop()
    }
    Write-Host "🛑 Serveur arrêté" -ForegroundColor Yellow
}

