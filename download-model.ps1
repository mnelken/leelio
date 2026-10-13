$url = "https://models.readyplayer.me/6460d3219d050a41d9c63c1a.glb?morphTargets=ARKit,Oculus+Visemes"
$dest = "g:\My Drive\curotech-antigravity\avatar-app\public\avatar3d.glb"
Write-Host "Downloading Ready Player Me model with ARKit blendshapes..."
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 45
    $item = Get-Item $dest
    Write-Host "Downloaded successfully: $($item.Length) bytes"
} catch {
    Write-Host "Download failed: $_"
}
