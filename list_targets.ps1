$bytes = [System.IO.File]::ReadAllBytes("g:\My Drive\curotech-antigravity\avatar-app\public\operative.glb")
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonBytes = New-Object byte[] $jsonLen
[System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
$gltf = $jsonStr | ConvertFrom-Json

$head = $gltf.meshes | Where-Object { $_.name -eq "Wolf3D_Head" }
if ($head -and $head.extras.targetNames) {
    Write-Host "Wolf3D_Head morph targets ($($head.extras.targetNames.Count)):"
    for ($i = 0; $i -lt $head.extras.targetNames.Count; $i++) {
        Write-Host "  [$i] $($head.extras.targetNames[$i])"
    }
}
