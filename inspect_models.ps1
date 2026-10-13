$paths = @(
    "g:\My Drive\curotech-antigravity\avatar-app\public\test_model.glb",
    "g:\My Drive\curotech-antigravity\avatar-app\public\xbot.glb",
    "g:\My Drive\curotech-antigravity\avatar-app\public\facecap.glb"
)

foreach ($path in $paths) {
    Write-Host "===================================="
    Write-Host "Checking: $path"
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
    $jsonBytes = New-Object byte[] $jsonLen
    [System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
    $jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
    $gltf = $jsonStr | ConvertFrom-Json
    
    Write-Host "Nodes count: $($gltf.nodes.Count)"
    Write-Host "Meshes count: $($gltf.meshes.Count)"
    if ($gltf.animations) {
        Write-Host "Animations: $($gltf.animations.name -join ', ')"
    }
    
    foreach ($m in $gltf.meshes) {
        Write-Host "  Mesh: $($m.name)"
        if ($m.extras -and $m.extras.targetNames) {
            Write-Host "    Morph target names: $($m.extras.targetNames -join ', ')"
        }
        foreach ($p in $m.primitives) {
            if ($p.targets) {
                Write-Host "    Primitive has $($p.targets.Count) morph targets"
            }
        }
    }
}
