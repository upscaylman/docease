# Simple HTTP server for form serving in background
# Used by start.bat

$Port = 3000
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FormPath = Join-Path $ScriptDir "form.html"

# Check if port is available
$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
    $Port = $Port + 1
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
        $n8nUrl = "http://localhost:5678$Path"
        
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
            $responseBody = $response.Content
            
            if (-not $responseBody -or $responseBody.Trim() -eq "") {
                Write-Host "[PROXY] Empty response from n8n for $Path" -ForegroundColor Yellow
            } else {
                Write-Host "[PROXY] Response received: $($responseBody.Length) chars" -ForegroundColor Green
            }
            
            return @{
                StatusCode = $response.StatusCode
                Body = if ($responseBody) { $responseBody } else { "" }
                ContentType = if ($response.Headers.'Content-Type') { $response.Headers.'Content-Type' } else { "application/json" }
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
            
            if ($proxyResult.ContentType) {
                $Response.ContentType = $proxyResult.ContentType
            } else {
                $Response.ContentType = "application/json"
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
    elseif ($Path -eq "/favicon.ico") {
        $Response.StatusCode = 404
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
