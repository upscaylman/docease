# Serveur HTTP simple pour servir le formulaire HTML
# Résout le problème CORS avec l'origine 'null'

Write-Host "Demarrage du serveur de formulaire..." -ForegroundColor Cyan

$Port = 3000
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FormPath = Join-Path $ScriptDir "index.html"

# Vérifier si le port est disponible
$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "ATTENTION: Le port $Port est deja utilise. Tentative avec le port $($Port+1)..." -ForegroundColor Yellow
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
    
    $Path = $Request.Url.AbsolutePath

    # Servir le fichier HTML
    if ($Path -eq "/" -or $Path -eq "/form.html" -or $Path -eq "/index.html") {
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
    }
    # Servir les fichiers CSS
    elseif ($Path -match "^/assets/css/(.+\.css)$") {
        $cssFile = Join-Path $ScriptDir "assets\css\$($Matches[1])"
        if (Test-Path $cssFile) {
            $Content = Get-Content $cssFile -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "text/css; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        } else {
            $Response.StatusCode = 404
        }
    }
    # Servir les fichiers JS
    elseif ($Path -match "^/assets/js/(.+\.js)$") {
        $jsPath = $Matches[1] -replace "/", "\"
        $jsFile = Join-Path $ScriptDir "assets\js\$jsPath"
        if (Test-Path $jsFile) {
            $Content = Get-Content $jsFile -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "application/javascript; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        } else {
            $Response.StatusCode = 404
        }
    }
    # Servir variables.json
    elseif ($Path -eq "/config/variables.json") {
        $ConfigPath = Join-Path $ScriptDir "..\config\variables.json"
        if (Test-Path $ConfigPath) {
            $Content = Get-Content $ConfigPath -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "application/json; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        } else {
            $Response.StatusCode = 404
        }
    }
    # Servir preview.html
    elseif ($Path -eq "/html/preview.html" -or $Path -eq "/../html/preview.html" -or $Path -match "^/html/preview\.html$") {
        $PreviewPath = Join-Path $ScriptDir "..\html\preview.html"
        $PreviewPath = [System.IO.Path]::GetFullPath($PreviewPath)
        Write-Host "[REQUEST] Preview.html requested: $Path -> $PreviewPath" -ForegroundColor Cyan
        
        if (Test-Path $PreviewPath) {
            $Content = Get-Content $PreviewPath -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Preview.html sent ($($Buffer.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Preview.html non trouve: $PreviewPath" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Servir les fichiers images (PNG, JPG, JPEG, GIF, SVG)
    elseif ($Path -match "^/assets/img/(.+\.(png|jpg|jpeg|gif|svg))$") {
        $imgFile = Join-Path $ScriptDir "assets\img\$($Matches[1])"
        if (Test-Path $imgFile) {
            $Buffer = [System.IO.File]::ReadAllBytes($imgFile)

            # Déterminer le Content-Type selon l'extension
            $extension = $Matches[2].ToLower()
            $contentType = switch ($extension) {
                "png"  { "image/png" }
                "jpg"  { "image/jpeg" }
                "jpeg" { "image/jpeg" }
                "gif"  { "image/gif" }
                "svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $Response.ContentType = $contentType
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        } else {
            Write-Host "Image non trouvee: $imgFile" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    else {
        $Response.StatusCode = 404
    }
    
    $Response.Close()
}

# Créer le listener HTTP
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

try {
    $Listener.Start()
    Write-Host "Serveur demarre sur http://localhost:$Port" -ForegroundColor Green
    Write-Host "Formulaire accessible sur: http://localhost:$Port/" -ForegroundColor Cyan
    Write-Host "Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Yellow
    Write-Host ""
    
    # Boucle principale pour gérer les requêtes
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        Handle-Request -Context $Context
    }
}
catch {
    Write-Host "ERREUR: $_" -ForegroundColor Red
}
finally {
    if ($Listener.IsListening) {
        $Listener.Stop()
    }
    Write-Host "Serveur arrete" -ForegroundColor Yellow
}

