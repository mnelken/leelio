$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\public\facecap.glb")
$jsonLen = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonBytes = New-Object byte[] $jsonLen
[System.Array]::Copy($bytes, 20, $jsonBytes, 0, $jsonLen)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
$gltf = $jsonStr | ConvertFrom-Json

Write-Host "extensionsUsed: $($gltf.extensionsUsed -join ', ')"
Write-Host "extensionsRequired: $($gltf.extensionsRequired -join ', ')"
Write-Host "materials count: $($gltf.materials.Count)"
foreach ($mat in $gltf.materials) {
    Write-Host "  Material: $($mat.name)"
}
