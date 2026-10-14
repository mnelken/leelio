$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$tests = @(
    @{ name = "meshy_153_portrait"; url = "http://localhost:4242/tools/preview_meshy.html?model=crimson_153.glb&view=portrait" },
    @{ name = "meshy_153_full";     url = "http://localhost:4242/tools/preview_meshy.html?model=crimson_153.glb&view=full" },
    @{ name = "meshy_144_portrait"; url = "http://localhost:4242/tools/preview_meshy.html?model=crimson_144.glb&view=portrait" }
)

foreach ($t in $tests) {
    $outPng = "C:\Users\MarekNelken\avatar-app\tools\$($t.name).png"
    Write-Host "Capturing $($t.url) -> $outPng"
    Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1024,1024",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=12000",
        "--screenshot=$outPng",
        $t.url
    ) -Wait
}

Get-ChildItem "C:\Users\MarekNelken\avatar-app\tools\meshy_*.png" | Select-Object Name, Length, LastWriteTime
