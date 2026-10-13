# Lightweight local HTTP server for Avatar WebGL App
param(
    [int]$Port = 4242
)

$rootDir = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
if ($Port -ne 8080) {
    try {
        $listener.Prefixes.Add("http://localhost:8080/")
    } catch {}
}

try {
    $listener.Start()
    Write-Host "=======================================================" -ForegroundColor Magenta
    Write-Host "  ✨ Leelio Conversational Studio Running! ✨" -ForegroundColor Green
    Write-Host "  URL: http://localhost:$Port/ and http://localhost:8080/" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Magenta

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $req = $context.Request
            $res = $context.Response

            # CORS headers
            $res.Headers.Add("Access-Control-Allow-Origin", "*")
            $res.Headers.Add("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            $res.Headers.Add("Access-Control-Allow-Headers", "*")

            if ($req.HttpMethod -eq "OPTIONS") {
                $res.StatusCode = 204
                $res.Close()
                continue
            }

            $rawPath = $req.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rawPath)) {
                $rawPath = "index.html"
            }

            # Unescape URL path (e.g. %20 -> space)
            $decodedPath = [System.Uri]::UnescapeDataString($rawPath)

            # Try root dir first, then public/
            $filePath = Join-Path $rootDir $decodedPath
            if (-not (Test-Path $filePath -PathType Leaf)) {
                $filePath = Join-Path (Join-Path $rootDir "public") $decodedPath
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".png"  { "image/png" }
                    ".svg"  { "image/svg+xml" }
                    ".glb"  { "model/gltf-binary" }
                    ".gltf" { "model/gltf+json" }
                    ".json" { "application/json" }
                    ".wasm" { "application/wasm" }
                    ".mp4"  { "video/mp4" }
                    ".apk"  { "application/vnd.android.package-archive" }
                    default { "application/octet-stream" }
                }

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentType = $contentType
                $res.ContentLength64 = $bytes.Length
                if ($ext -eq ".apk") {
                    $res.Headers.Add("Content-Disposition", "attachment; filename=`"Leelio.apk`"")
                }
                $res.StatusCode = 200

                if ($req.HttpMethod -ne "HEAD") {
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $res.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $decodedPath")
                $res.ContentType = "text/plain; charset=utf-8"
                $res.ContentLength64 = $msg.Length
                if ($req.HttpMethod -ne "HEAD") {
                    $res.OutputStream.Write($msg, 0, $msg.Length)
                }
            }
            $res.Close()
        } catch {
            Write-Warning "Request error: $_"
        }
    }
}
finally {
    try {
        $listener.Stop()
        $listener.Close()
    } catch {}
}
