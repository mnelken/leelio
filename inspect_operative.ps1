$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\public\operative.glb")
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonBytes = New-Object byte[] $jsonLen
[System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
$gltf = $jsonStr | ConvertFrom-Json

Write-Host "NODES count: $($gltf.nodes.Count)"
Write-Host "MESHES count: $($gltf.meshes.Count)"
foreach ($m in $gltf.meshes) {
    Write-Host "Mesh: $($m.name)"
    if ($m.extras -and $m.extras.targetNames) {
        Write-Host "  Targets ($($m.extras.targetNames.Count)): $(($m.extras.targetNames | Select-Object -First 15) -join ', ')..."
    }
}
