$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\MarekNelken\avatar-app\tools"
$snapPath = Join-Path $outDir "index_page_3d_preview.png"
if (Test-Path $snapPath) { Remove-Item $snapPath -Force }

$tempBase = Join-Path $env:TEMP ("chrome_index_" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempBase | Out-Null

$url = "http://localhost:4242/index.html?snap=index_page_3d_preview.png"
Write-Host "Launching Chrome headless on $url..."

$proc = Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempBase",
    "--window-size=1280,800",
    $url
) -PassThru

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$timeoutSec = 30
while (!(Test-Path $snapPath) -and ($sw.Elapsed.TotalSeconds -lt $timeoutSec)) {
    Start-Sleep -Milliseconds 250
}

Write-Host "Screenshot created: $(Test-Path $snapPath) in $($sw.Elapsed.TotalSeconds)s"
if (Test-Path $snapPath) {
    Get-Item $snapPath | Select-Object Name, Length, LastWriteTime
}

Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $tempBase -ErrorAction SilentlyContinue
