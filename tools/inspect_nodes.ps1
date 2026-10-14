$files = Get-ChildItem -Path "G:\My Drive\curotech-antigravity" -Filter "Meshy_*.glb"
foreach ($f in $files) {
    Write-Host "========================================="
    Write-Host "File: $($f.Name)"
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
    $jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len)
    $json = $jsonStr | ConvertFrom-Json
    Write-Host "Nodes ($($json.nodes.Count)):"
    foreach ($node in $json.nodes) {
        Write-Host "  Node: $($node.name) mesh: $($node.mesh) skin: $($node.skin) children: $($node.children -join ',')"
    }
    if ($json.skins) {
        Write-Host "Skins ($($json.skins.Count)):"
        foreach ($s in $json.skins) {
            Write-Host "  Skin: $($s.name) joints: $($s.joints -join ',')"
        }
    } else {
        Write-Host "No skins array"
    }
    if ($json.animations) {
        Write-Host "Animations ($($json.animations.Count)):"
        foreach ($a in $json.animations) {
            Write-Host "  Anim: $($a.name)"
        }
    } else {
        Write-Host "No animations array"
    }
}
