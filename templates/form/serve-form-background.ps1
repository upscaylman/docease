# Simple HTTP server for form serving in background
# Used by start.bat

$Port = 3000
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FormPath = Join-Path $ScriptDir "index.html"
$ConfigPath = Join-Path $ScriptDir "..\config\variables.json"

# Check if port is available
$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
    $Port = $Port + 1
}

# Function to get ngrok URL if available
function Get-NgrokUrl {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction SilentlyContinue -TimeoutSec 2
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                return $httpsTunnel.public_url
            } else {
                return $response.tunnels[0].public_url
            }
        }
    } catch {
        # ngrok not available or not running
    }
    return $null
}

# Function to proxy to n8n
function Proxy-ToN8n {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers,
        [string]$Body
    )
    
    try {
        # Try to get ngrok URL first
        $ngrokUrl = Get-NgrokUrl
        if ($ngrokUrl) {
            $n8nUrl = "$ngrokUrl$Path"
            Write-Host "[PROXY] Using ngrok: $n8nUrl" -ForegroundColor Cyan
        } else {
            $n8nUrl = "http://localhost:5678$Path"
            Write-Host "[PROXY] Using local n8n: $n8nUrl" -ForegroundColor Gray
        }
        
        $params = @{
            Uri = $n8nUrl
            Method = $Method
            ContentType = "application/json; charset=utf-8"
            UseBasicParsing = $true
            ErrorAction = "Stop"
            TimeoutSec = 300
        }
        
        if ($Body -and ($Method -eq "POST" -or $Method -eq "PUT")) {
            # Convert body to UTF-8 bytes to preserve accents
            $params.Body = [System.Text.Encoding]::UTF8.GetBytes($Body)
        }
        
        $headerDict = @{}
        foreach ($key in $Headers.Keys) {
            $headerDict[$key] = $Headers[$key]
        }
        if ($headerDict.Count -gt 0) {
            $params.Headers = $headerDict
        }
        
        try {
            $response = Invoke-WebRequest @params

            # Decode response as UTF-8 to preserve accents
            if ($response.RawContentStream) {
                $reader = [System.IO.StreamReader]::new($response.RawContentStream, [System.Text.Encoding]::UTF8)
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
            } else {
                $responseBody = $response.Content
            }

            if (-not $responseBody -or $responseBody.Trim() -eq "") {
                Write-Host "[PROXY] Empty response from n8n for $Path" -ForegroundColor Yellow
            } else {
                Write-Host "[PROXY] Response received: $($responseBody.Length) chars" -ForegroundColor Green
            }

            return @{
                StatusCode = $response.StatusCode
                Body = if ($responseBody) { $responseBody } else { "" }
                ContentType = if ($response.Headers.'Content-Type') { $response.Headers.'Content-Type' } else { "application/json; charset=utf-8" }
            }
        }
        catch {
            Write-Host "[PROXY] Error with Invoke-WebRequest, trying alternative method" -ForegroundColor Yellow
            $params.ErrorAction = "SilentlyContinue"
            $restResponse = Invoke-RestMethod @params
            
            if ($restResponse) {
                $bodyContent = if ($restResponse -is [string]) { $restResponse } else { ($restResponse | ConvertTo-Json -Depth 10) }
                Write-Host "[PROXY] Response via RestMethod: $($bodyContent.Length) chars" -ForegroundColor Green
                
                return @{
                    StatusCode = 200
                    Body = $bodyContent
                    ContentType = "application/json"
                }
            }
            throw
        }
    }
    catch {
        $statusCode = 500
        $errorBody = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $errorReader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $errorReader.ReadToEnd()
                $errorReader.Close()
            }
            catch {
                if (-not $errorBody) {
                    $errorBody = "HTTP Error $statusCode - Webhook not found or workflow not active"
                }
            }
        }
        
        if ($statusCode -eq 404) {
            $errorBody = "Webhook not found. Check that workflow is active in n8n and URL is correct: $Path"
        }
        
        return @{
            StatusCode = $statusCode
            Body = if ($errorBody) { $errorBody } else { "Internal Server Error" }
            ContentType = "application/json"
        }
    }
}

# Function to handle requests
function Handle-Request {
    param(
        [System.Net.HttpListenerContext]$Context
    )
    
    $Request = $Context.Request
    $Response = $Context.Response
    $Path = $Request.Url.AbsolutePath
    
    # CORS headers
    $Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    $Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    
    # Handle OPTIONS preflight
    if ($Request.HttpMethod -eq "OPTIONS") {
        $Response.StatusCode = 204
        $Response.Close()
        return
    }
    
    # Proxy to n8n for webhook routes
    if ($Path.StartsWith("/webhook/") -or $Path.StartsWith("/webhook-test/")) {
        try {
            $body = ""
            if (($Request.HttpMethod -eq "POST" -or $Request.HttpMethod -eq "PUT") -and $Request.ContentLength64 -gt 0) {
                $bytes = New-Object byte[] $Request.ContentLength64
                $bytesRead = $Request.InputStream.Read($bytes, 0, $Request.ContentLength64)
                if ($bytesRead -gt 0) {
                    # Force UTF-8 encoding for accented characters
                    $body = [System.Text.Encoding]::UTF8.GetString($bytes, 0, $bytesRead)
                }
            }
            
            $headers = @{}
            foreach ($key in $Request.Headers.AllKeys) {
                if ($key -match "^X-|^Authorization") {
                    $headers[$key] = $Request.Headers[$key]
                }
            }
            
            $proxyResult = Proxy-ToN8n -Method $Request.HttpMethod -Path $Path -Headers $headers -Body $body
            
            $Response.StatusCode = $proxyResult.StatusCode

            # Force UTF-8 charset in Content-Type
            if ($proxyResult.ContentType) {
                $contentType = $proxyResult.ContentType
                if ($contentType -notmatch 'charset=') {
                    $contentType = "$contentType; charset=utf-8"
                }
                $Response.ContentType = $contentType
            } else {
                $Response.ContentType = "application/json; charset=utf-8"
            }
            
            $bodyContent = if ($null -eq $proxyResult.Body) { "" } else { $proxyResult.Body }
            
            Write-Host "[PROXY] Transmission: Status=$($proxyResult.StatusCode), BodyLength=$($bodyContent.Length)" -ForegroundColor Cyan
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($bodyContent)
            $Response.ContentLength64 = $buffer.Length
            
            if ($buffer.Length -gt 0) {
                $Response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                Write-Host "[PROXY] WARNING: Empty body sent to client" -ForegroundColor Red
                $Response.OutputStream.Write([byte[]]@(), 0, 0)
            }
        }
        catch {
            $Response.StatusCode = 500
            $errorMsg = $_.Exception.Message
            $errorJson = (@{error = $errorMsg; details = "Error during proxy to n8n"} | ConvertTo-Json -Compress)
            $errorBuffer = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
            $Response.ContentType = "application/json"
            $Response.ContentLength64 = $errorBuffer.Length
            $Response.OutputStream.Write($errorBuffer, 0, $errorBuffer.Length)
        }
        
        $Response.Close()
        return
    }
    
    # Serve static files
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
    # Serve CSS files
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
    # Serve design-system CSS files
    elseif ($Path -match "^/assets/design-system/(.+\.css)$") {
        $cssPath = $Matches[1] -replace "/", "\"
        $cssFile = Join-Path $ScriptDir "assets\design-system\$cssPath"
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
    # Serve JS files
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
    elseif ($Path -eq "/config/variables.json") {
        Write-Host "[REQUEST] Loading variables.json from: $ConfigPath" -ForegroundColor Cyan
        
        if (Test-Path $ConfigPath) {
            try {
                $Content = Get-Content $ConfigPath -Raw -Encoding UTF8
                
                if (-not $Content -or $Content.Trim() -eq "") {
                    Write-Host "[ERROR] variables.json is empty!" -ForegroundColor Red
                    $Response.StatusCode = 500
                } else {
                    $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)
                    
                    $Response.ContentType = "application/json; charset=utf-8"
                    $Response.ContentLength64 = $Buffer.Length
                    $Response.StatusCode = 200
                    
                    $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                    Write-Host "[SUCCESS] Sent variables.json ($($Buffer.Length) bytes)" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "[ERROR] Failed to read variables.json: $($_.Exception.Message)" -ForegroundColor Red
                $Response.StatusCode = 500
                $errorMsg = @{error = "Failed to read variables.json"; details = $_.Exception.Message} | ConvertTo-Json
                $errorBuffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
                $Response.ContentType = "application/json"
                $Response.ContentLength64 = $errorBuffer.Length
                $Response.OutputStream.Write($errorBuffer, 0, $errorBuffer.Length)
            }
        } else {
            Write-Host "[ERROR] variables.json not found at: $ConfigPath" -ForegroundColor Red
            $Response.StatusCode = 404
            $errorMsg = @{error = "variables.json not found"; path = $ConfigPath} | ConvertTo-Json
            $errorBuffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
            $Response.ContentType = "application/json"
            $Response.ContentLength64 = $errorBuffer.Length
            $Response.OutputStream.Write($errorBuffer, 0, $errorBuffer.Length)
        }
    }
    # Serve preview.html
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
            Write-Host "[SUCCESS] Sent preview.html ($($Buffer.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] preview.html not found at: $PreviewPath" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Serve template-custom.html
    elseif ($Path -eq "/html/template-custom/template-custom.html" -or $Path -match "^/html/template-custom/template-custom\.html$") {
        $TemplatePath = Join-Path $ScriptDir "..\html\template-custom\template-custom.html"
        $TemplatePath = [System.IO.Path]::GetFullPath($TemplatePath)
        Write-Host "[REQUEST] template-custom.html requested: $Path -> $TemplatePath" -ForegroundColor Cyan
        
        if (Test-Path $TemplatePath) {
            $Content = Get-Content $TemplatePath -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "text/html; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Sent template-custom.html ($($Buffer.Length) bytes)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] template-custom.html not found at: $TemplatePath" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Serve template-custom CSS files
    elseif ($Path -match "^/html/template-custom/(.+\.css)$") {
        $cssRelativePath = $Matches[1]
        $cssFile = Join-Path $ScriptDir "..\html\template-custom\$cssRelativePath"
        $cssFile = [System.IO.Path]::GetFullPath($cssFile)
        Write-Host "[REQUEST] template-custom CSS requested: $Path -> $cssFile" -ForegroundColor Cyan

        if (Test-Path $cssFile) {
            $Content = Get-Content $cssFile -Raw -Encoding UTF8
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content)

            $Response.ContentType = "text/css; charset=utf-8"
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Sent template-custom CSS: $($Buffer.Length) bytes" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] template-custom CSS not found: $cssFile" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Serve template-custom SVG and images
    elseif ($Path -match "^/html/template-custom/(.+\.(svg|png|jpg|jpeg|gif|woff|woff2))$") {
        $fileRelativePath = $Matches[1]
        $filePath = Join-Path $ScriptDir "..\html\template-custom\$fileRelativePath"
        $filePath = [System.IO.Path]::GetFullPath($filePath)
        Write-Host "[REQUEST] template-custom resource requested: $Path -> $filePath" -ForegroundColor Cyan

        if (Test-Path $filePath) {
            $Buffer = [System.IO.File]::ReadAllBytes($filePath)

            # Determine Content-Type based on extension
            $extension = $Matches[2].ToLower()
            $contentType = switch ($extension) {
                "svg"  { "image/svg+xml" }
                "png"  { "image/png" }
                "jpg"  { "image/jpeg" }
                "jpeg" { "image/jpeg" }
                "gif"  { "image/gif" }
                "woff" { "font/woff" }
                "woff2" { "font/woff2" }
                default { "application/octet-stream" }
            }

            $Response.ContentType = $contentType
            $Response.ContentLength64 = $Buffer.Length
            $Response.StatusCode = 200

            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
            Write-Host "[SUCCESS] Sent template-custom resource: $($Buffer.Length) bytes" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] template-custom resource not found: $filePath" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    # Serve image files (PNG, JPG, JPEG, GIF, SVG)
    elseif ($Path -match "^/assets/img/(.+\.(png|jpg|jpeg|gif|svg))$") {
        $imgFile = Join-Path $ScriptDir "assets\img\$($Matches[1])"
        Write-Host "[REQUEST] Image requested: $imgFile" -ForegroundColor Cyan

        if (Test-Path $imgFile) {
            $Buffer = [System.IO.File]::ReadAllBytes($imgFile)

            # Determine Content-Type based on extension
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
            Write-Host "[SUCCESS] Image served: $($Buffer.Length) bytes" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Image not found: $imgFile" -ForegroundColor Red
            $Response.StatusCode = 404
        }
    }
    elseif ($Path -eq "/favicon.ico") {
        # Retourner un favicon vide pour éviter l'erreur 404
        $Response.StatusCode = 204
        $Response.Close()
        return
    }
    else {
        $Response.StatusCode = 404
    }
    
    $Response.Close()
}

# Create HTTP listener
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

try {
    $Listener.Start()
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Server started on http://localhost:$Port" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Main loop to handle requests
    while ($Listener.IsListening) {
        try {
            $Context = $Listener.GetContext()
            Handle-Request -Context $Context
        }
        catch {
            # Ignore individual request errors
        }
    }
}
catch {
    # Silent error in background
}
finally {
    if ($Listener.IsListening) {
        $Listener.Stop()
    }
}
