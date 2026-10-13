$bytes = [System.IO.File]::ReadAllBytes("g:\My Drive\curotech-antigravity\avatar-app\public\animations.glb")
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonBytes = New-Object byte[] $jsonLen
[System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
$gltf = $jsonStr | ConvertFrom-Json

Write-Host "ANIMATIONS count: $($gltf.animations.Count)"
foreach ($a in $gltf.animations) {
    Write-Host "  Animation: $($a.name)"
}
