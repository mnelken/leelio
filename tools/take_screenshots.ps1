$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$tests = @(
    @{ name = "clean_decoupled_textured"; url = "http://localhost:4242/tools/compare_sync_side_by_side.html?mode=textured&t=0.0" },
    @{ name = "clean_decoupled_wireframe"; url = "http://localhost:4242/tools/compare_sync_side_by_side.html?mode=wireframe&t=0.0" },
    @{ name = "speech_mouth_open_t05"; url = "http://localhost:4242/tools/compare_sync_side_by_side.html?mode=textured&t=0.5" },
    @{ name = "head_tilt_smile_t125"; url = "http://localhost:4242/tools/compare_sync_side_by_side.html?mode=textured&t=1.25" },
    @{ name = "hybrid_speech_t05"; url = "http://localhost:4242/tools/compare_sync_side_by_side.html?mode=hybrid&t=0.5" }
)

foreach ($t in $tests) {
    $outPng = "C:\Users\MarekNelken\avatar-app\tools\$($t.name).png"
    Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1600,900",
        "--virtual-time-budget=8000",
        "--screenshot=$outPng",
        $t.url
    ) -Wait
}

Get-ChildItem "C:\Users\MarekNelken\avatar-app\tools\*_t*.png" | Select-Object Name, Length, LastWriteTime
