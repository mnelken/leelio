$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\public\facecap.glb")
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonBytes = New-Object byte[] $jsonLen
[System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
$gltf = $jsonStr | ConvertFrom-Json

Write-Host "NODES:"
for ($i = 0; $i -lt $gltf.nodes.Count; $i++) {
    $n = $gltf.nodes[$i]
    Write-Host "  Node $i : $($n.name) (mesh: $($n.mesh), children: $($n.children -join ', '))"
}

Write-Host "`nMESHES:"
for ($i = 0; $i -lt $gltf.meshes.Count; $i++) {
    $m = $gltf.meshes[$i]
    Write-Host "  Mesh $i : $($m.name)"
    if ($m.extras -and $m.extras.targetNames) {
        Write-Host "    Morph targets count: $($m.extras.targetNames.Count)"
        Write-Host "    Sample targets: $(($m.extras.targetNames | Select-Object -First 8) -join ', ')"
    }
}
