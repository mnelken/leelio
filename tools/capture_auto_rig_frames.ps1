$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\MarekNelken\avatar-app\tools"

$frames = @(
    @{ name = "auto_rig_synced_t00.png"; t = "0.0" },
    @{ name = "auto_rig_synced_t05.png"; t = "0.5" },
    @{ name = "auto_rig_synced_t125.png"; t = "1.25" }
)

foreach ($f in $frames) {
    $outPath = Join-Path $outDir $f.name
    if (Test-Path $outPath) { Remove-Item $outPath -Force }
    $tempBase = Join-Path $env:TEMP ("chrome_rig_" + [System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempBase | Out-Null

    $url = "http://localhost:4242/tools/compare_auto_rig_side_by_side.html?t=$($f.t)&snap=$($f.name)"
    Write-Host "Capturing t=$($f.t) to $($f.name)..."

    $proc = Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--user-data-dir=$tempBase",
        "--window-size=1600,900",
        $url
    ) -PassThru

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $timeoutSec = 30
    while (!(Test-Path $outPath) -and ($sw.Elapsed.TotalSeconds -lt $timeoutSec)) {
        Start-Sleep -Milliseconds 250
    }

    Write-Host "Frame $($f.name) created: $(Test-Path $outPath) in $($sw.Elapsed.TotalSeconds)s"
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $tempBase -ErrorAction SilentlyContinue
}

Get-ChildItem (Join-Path $outDir "auto_rig_synced_*.png") | Select-Object Name, Length, LastWriteTime
