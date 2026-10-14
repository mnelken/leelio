$files = Get-ChildItem -Path "G:\My Drive\curotech-antigravity" -Filter "Meshy_*.glb"
foreach ($f in $files) {
    Write-Host "========================================="
    Write-Host "File: $($f.Name)"
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
    $jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len)
    $json = $jsonStr | ConvertFrom-Json
    
    Write-Host "Accessors count: $($json.accessors.Count)"
    Write-Host "BufferViews count: $($json.bufferViews.Count)"
    Write-Host "Images count: $($json.images.Count)"
    foreach ($img in $json.images) {
        Write-Host "  Image: $($img.name) mimeType: $($img.mimeType) bufferView: $($img.bufferView)"
    }
    foreach ($mesh in $json.meshes) {
        Write-Host "  Mesh: $($mesh.name)"
        foreach ($p in $mesh.primitives) {
            $posAcc = $json.accessors[$p.attributes.POSITION]
            Write-Host "    Vertices count: $($posAcc.count) min: $($posAcc.min -join ',') max: $($posAcc.max -join ',')"
            if ($p.indices -ne $null) {
                $idxAcc = $json.accessors[$p.indices]
                Write-Host "    Indices count: $($idxAcc.count) (triangles: $($idxAcc.count / 3))"
            }
        }
    }
}
