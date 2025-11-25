# Serveur HTTP simple pour servir le formulaire HTML
# Résout le problème CORS avec l'origine 'null'

Write-Host "Demarrage du serveur de formulaire..." -ForegroundColor Cyan

# Vérifier si on a les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ATTENTION: Le serveur n'est pas lance en tant qu'administrateur" -ForegroundColor Yellow
    Write-Host "Pour accepter les connexions depuis Docker/n8n, vous devez:" -ForegroundColor Yellow
    Write-Host "1. Executer cette commande UNE FOIS en tant qu'admin:" -ForegroundColor Cyan
    Write-Host "   netsh http add urlacl url=http://+:8080/ user=EVERYONE" -ForegroundColor White
    Write-Host "2. OU relancer ce script en tant qu'administrateur" -ForegroundColor Cyan
    Write-Host ""
}

$Port = 8080
$N8nUrl = "http://localhost:5678"
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
    $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning")
    
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
    # Servir template-custom.html
    elseif ($Path -match "^/html/template-custom/template-custom\.html$") {
        $TemplatePath = Join-Path $ScriptDir "html\template-custom\template-custom.html"
        Write-Host "[REQUEST] Template-custom.html requested: $Path -> $TemplatePath" -ForegroundColor Cyan
        
        if (Test-Path $TemplatePath) {
            $Content = Get-Content $TemplatePath -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Template-custom.html sent ($($Buffer.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Template-custom.html non trouve: $TemplatePath" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Servir les ressources du template-custom (CSS, SVG, etc.)
    elseif ($Path -match "^/html/template-custom/1763822792_template-custom/(.+)$") {
        $ResourceFile = Join-Path $ScriptDir "html\template-custom\1763822792_template-custom\$($Matches[1])"
        Write-Host "[REQUEST] Template resource: $Path -> $ResourceFile" -ForegroundColor Cyan
        
        if (Test-Path $ResourceFile) {
            $Buffer = [System.IO.File]::ReadAllBytes($ResourceFile)
            
            # Déterminer le Content-Type
            $extension = [System.IO.Path]::GetExtension($ResourceFile).ToLower()
            $contentType = switch ($extension) {
                ".css"  { "text/css; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif"  { "image/gif" }
                ".woff" { "font/woff" }
                ".woff2" { "font/woff2" }
                ".ttf"  { "font/ttf" }
                default { "application/octet-stream" }
            }
            
            $Response.ContentType = $contentType
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200
            
            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Resource sent: $($Matches[1]) ($($Buffer.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Resource non trouvee: $ResourceFile" -ForegroundColor Red
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
    # ============================================
    # PROXY VERS N8N (tous les /webhook/*)
    # ============================================
    elseif ($Path -like "/webhook/*") {
        Write-Host "" -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Magenta
        Write-Host "[PROXY] Redirection vers n8n: $Path" -ForegroundColor Magenta
        Write-Host "[PROXY] Client: $($Request.RemoteEndPoint)" -ForegroundColor Gray
        Write-Host "========================================" -ForegroundColor Magenta

        try {
            # Lire le body de la requête
            $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
            $RequestBody = $reader.ReadToEnd()
            $reader.Close()

            Write-Host "[PROXY] Taille body: $($RequestBody.Length) caractères" -ForegroundColor Gray

            # Construire l'URL n8n
            $proxyUrl = "$N8nUrl$Path"
            Write-Host "[PROXY] Appel n8n: $proxyUrl" -ForegroundColor Gray

            # Préparer les headers
            $headers = @{
                "Content-Type" = "application/json"
            }

            # Appeler n8n
            $proxyResponse = Invoke-RestMethod -Uri $proxyUrl `
                -Method POST `
                -Body $RequestBody `
                -Headers $headers `
                -TimeoutSec 120

            # Renvoyer la réponse de n8n
            $result = $proxyResponse | ConvertTo-Json -Depth 10 -Compress
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($result)

            $Response.ContentType = "application/json; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200
            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            $Response.OutputStream.Flush()

            Write-Host "[PROXY] Réponse envoyée ($($Buffer.Length) bytes)" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "" -ForegroundColor White

        } catch {
            Write-Host "" -ForegroundColor White
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "[ERROR] Erreur proxy n8n: $_" -ForegroundColor Red
            Write-Host "[ERROR] Exception: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red

            $errorJson = @{
                error = "Erreur proxy n8n: $($_.Exception.Message)"
                success = $false
            } | ConvertTo-Json

            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
            $Response.ContentType = "application/json; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 500
            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            $Response.OutputStream.Flush()

            Write-Host "" -ForegroundColor White
        }
    }
    # ============================================
    # CONVERSION PDF (route directe)
    # ============================================
    elseif ($Path -eq "/api/convert-pdf" -and $Request.HttpMethod -eq "POST") {
        try {
            Write-Host "" -ForegroundColor White
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "[INFO] Réception requête conversion PDF" -ForegroundColor Cyan
            Write-Host "[INFO] Client: $($Request.RemoteEndPoint)" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Cyan

            # Lire le body de la requête
            $reader = New-Object System.IO.StreamReader($Request.InputStream)
            $jsonBody = $reader.ReadToEnd()
            $reader.Close()

            Write-Host "[DEBUG] Body reçu, taille: $($jsonBody.Length) caractères" -ForegroundColor Yellow

            $data = $jsonBody | ConvertFrom-Json
            $wordBase64 = $data.wordBase64
            $filename = if ($data.filename) { $data.filename } else { "document" }

            Write-Host "[INFO] Fichier: $filename.docx" -ForegroundColor Cyan
            Write-Host "[INFO] Taille wordBase64: $($wordBase64.Length) caractères" -ForegroundColor Cyan
            
            # Convertir base64 en bytes
            $wordBytes = [System.Convert]::FromBase64String($wordBase64)
            Write-Host "[INFO] Taille fichier Word: $($wordBytes.Length) bytes" -ForegroundColor Cyan
            
            # Sauvegarder temporairement le fichier Word
            $tempWordFile = [System.IO.Path]::GetTempFileName() + ".docx"
            [System.IO.File]::WriteAllBytes($tempWordFile, $wordBytes)
            Write-Host "[INFO] Fichier temporaire créé: $tempWordFile" -ForegroundColor Cyan
            
            # Convertir Word en PDF avec Word COM Object
            $tempPdfFile = [System.IO.Path]::GetTempFileName() + ".pdf"
            Write-Host "[INFO] Conversion Word -> PDF avec Microsoft Word..." -ForegroundColor Cyan
            
            try {
                # Créer l'instance Word
                $Word = New-Object -ComObject Word.Application
                $Word.Visible = $false
                $Word.DisplayAlerts = 0
                
                Write-Host "[INFO] Ouverture du document Word..." -ForegroundColor Cyan
                $Doc = $Word.Documents.Open($tempWordFile)

                # Délai pour les documents longs
                Start-Sleep -Seconds 5
                
                Write-Host "[INFO] Export en PDF..." -ForegroundColor Cyan
                # ExportAsFixedFormat: (OutputFileName, ExportFormat, OpenAfterExport, OptimizeFor, Range, From, To, Item, IncludeDocProps)
                # ExportFormat: 17 = wdExportFormatPDF
                # OptimizeFor: 0 = wdExportOptimizeForPrint (meilleure qualité)
                $Doc.ExportAsFixedFormat($tempPdfFile, 17, $false, 0, 0, 0, 0, 0, $true)
                
                Write-Host "[SUCCESS] PDF exporté avec succès" -ForegroundColor Green
                
                # Fermer Word
                $Doc.Close($false)
                $Word.Quit()
                
                # Libérer les objets COM
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Doc) | Out-Null
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Word) | Out-Null
                [System.GC]::Collect()
                [System.GC]::WaitForPendingFinalizers()
                
            } catch {
                Write-Host "[ERROR] Erreur conversion Word COM: $_" -ForegroundColor Red
                
                # Nettoyer en cas d'erreur
                if ($Doc) { $Doc.Close($false) }
                if ($Word) { $Word.Quit() }
                
                throw "Erreur lors de la conversion avec Word: $($_.Exception.Message)"
            }
            
            # Lire le PDF généré
            if (Test-Path $tempPdfFile) {
                $pdfBytes = [System.IO.File]::ReadAllBytes($tempPdfFile)
                Write-Host "[SUCCESS] PDF généré: $($pdfBytes.Length) bytes" -ForegroundColor Green
                
                # Nettoyer les fichiers temporaires
                Remove-Item $tempWordFile -Force -ErrorAction SilentlyContinue
                Remove-Item $tempPdfFile -Force -ErrorAction SilentlyContinue
                
                # Convertir PDF en base64
                $pdfBase64 = [System.Convert]::ToBase64String($pdfBytes)
                Write-Host "[DEBUG] Taille pdfBase64: $($pdfBase64.Length) caractères" -ForegroundColor Magenta

                # Créer le JSON
                $result = @{
                    pdfBase64 = $pdfBase64
                } | ConvertTo-Json

                Write-Host "[DEBUG] JSON créé, taille: $($result.Length) caractères" -ForegroundColor Magenta
                Write-Host "[DEBUG] Début JSON (100 car): $($result.Substring(0, [Math]::Min(100, $result.Length)))" -ForegroundColor Magenta

                # Encoder en UTF8
                $Buffer = [System.Text.Encoding]::UTF8.GetBytes($result)
                Write-Host "[DEBUG] Buffer créé, taille: $($Buffer.Length) bytes" -ForegroundColor Magenta

                # Définir les headers
                $Response.ContentType = "application/json; charset=utf-8"
                $Response.ContentLength64 = $Buffer.Length
                $Response.StatusCode = 200

                Write-Host "[DEBUG] Headers définis - ContentType: $($Response.ContentType)" -ForegroundColor Cyan
                Write-Host "[DEBUG] ContentLength64: $($Response.ContentLength64)" -ForegroundColor Cyan
                Write-Host "[DEBUG] Status code: $($Response.StatusCode)" -ForegroundColor Cyan
                Write-Host "[DEBUG] Envoi de la réponse..." -ForegroundColor Cyan

                # Envoyer
                $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                $Response.OutputStream.Flush()

                Write-Host "[SUCCESS] Réponse envoyée avec succès" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "" -ForegroundColor White
            } else {
                throw "Fichier PDF non généré"
            }
        }
        catch {
            Write-Host "" -ForegroundColor White
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "[ERROR] Erreur conversion PDF: $_" -ForegroundColor Red
            Write-Host "[ERROR] Exception: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "[ERROR] Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red

            $errorResult = @{
                error = $_.Exception.Message
            } | ConvertTo-Json

            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($errorResult)
            $Response.ContentType = "application/json; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 500

            Write-Host "[DEBUG] Envoi erreur, taille: $($Buffer.Length) bytes" -ForegroundColor Yellow

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            $Response.OutputStream.Flush()
            Write-Host "[DEBUG] Erreur envoyée et flushée" -ForegroundColor Yellow
            Write-Host "" -ForegroundColor White
        }
    }
    else {
        $Response.StatusCode = 404
    }
    
    $Response.Close()
}

# Créer le listener HTTP
$Listener = New-Object System.Net.HttpListener

# Écouter sur toutes les interfaces pour permettre l'accès depuis Docker/n8n
try {
    # Essayer d'écouter sur toutes les interfaces (nécessite admin ou urlacl)
    $Listener.Prefixes.Add("http://+:$Port/")
    Write-Host "Configuration: Ecoute sur toutes les interfaces (http://+:$Port/)" -ForegroundColor Cyan
} catch {
    # Fallback sur localhost uniquement si pas les droits
    Write-Host "Impossible d'ecouter sur toutes les interfaces, fallback sur localhost" -ForegroundColor Yellow
    $Listener.Prefixes.Clear()
    $Listener.Prefixes.Add("http://localhost:$Port/")
}

try {
    $Listener.Start()

    # Afficher les adresses d'écoute
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  SERVEUR POWERSHELL MULTI-SERVICES" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Adresses d'acces:" -ForegroundColor Cyan
    Write-Host "  - Local:        http://localhost:$Port/" -ForegroundColor White

    # Obtenir l'IP locale
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
    if ($localIP) {
        Write-Host "  - Reseau local: http://${localIP}:$Port/" -ForegroundColor White
        Write-Host "  - Docker/n8n:   http://host.docker.internal:$Port/" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "Services disponibles:" -ForegroundColor Cyan
    Write-Host "  - /api/convert-pdf     -> Conversion Word -> PDF" -ForegroundColor White
    Write-Host "  - /webhook/*           -> Proxy vers n8n ($N8nUrl)" -ForegroundColor White
    Write-Host ""
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

