$files = Get-ChildItem -Path "G:\My Drive\curotech-antigravity" -Filter "*.glb"
foreach ($f in $files) {
    Write-Host "========================================="
    Write-Host "File: $($f.Name) Size: $($f.Length)"
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    if ($bytes.Length -lt 20) { Write-Host "Too small"; continue }
    $magic = [System.Text.Encoding]::ASCII.GetString($bytes, 0, 4)
    $version = [System.BitConverter]::ToUInt32($bytes, 4)
    $totalLen = [System.BitConverter]::ToUInt32($bytes, 8)
    $chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
    $chunk0Type = [System.Text.Encoding]::ASCII.GetString($bytes, 16, 4)
    Write-Host "glTF magic: $magic version: $version totalLen: $totalLen JSON len: $chunk0Len Type: $chunk0Type"
    if ($chunk0Type -eq "JSON") {
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len)
        $json = $jsonStr | ConvertFrom-Json
        Write-Host "Nodes count: $($json.nodes.Count)"
        Write-Host "Meshes count: $($json.meshes.Count)"
        Write-Host "Skins count: $(if ($json.skins) { $json.skins.Count } else { 0 })"
        Write-Host "Animations count: $(if ($json.animations) { $json.animations.Count } else { 0 })"
        Write-Host "Materials count: $(if ($json.materials) { $json.materials.Count } else { 0 })"
        if ($json.skins) {
            foreach ($skin in $json.skins) {
                Write-Host "  Skin: $($skin.name) Joints: $($skin.joints.Count)"
            }
        }
        if ($json.meshes) {
            foreach ($mesh in $json.meshes) {
                Write-Host "  Mesh: $($mesh.name)"
                foreach ($prim in $mesh.primitives) {
                    $props = ($prim.attributes | Get-Member -MemberType NoteProperty).Name
                    Write-Host "    Attributes: $($props -join ', ')"
                    if ($prim.targets) {
                        Write-Host "    Morph targets count: $($prim.targets.Count)"
                    }
                }
                if ($mesh.extras -and $mesh.extras.targetNames) {
                    Write-Host "    Target names: $($mesh.extras.targetNames -join ', ')"
                }
            }
        }
        if ($json.animations) {
            foreach ($anim in $json.animations) {
                Write-Host "  Animation: $($anim.name) Channels: $($anim.channels.Count)"
            }
        }
    }
}
