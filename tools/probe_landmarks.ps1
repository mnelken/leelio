$bytes = [System.IO.File]::ReadAllBytes("C:\Users\MarekNelken\avatar-app\public\crimson_153.glb")
$chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
$json = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len) | ConvertFrom-Json

$chunk1Header = 12 + 8 + $chunk0Len
$binDataStart = $chunk1Header + 8
$mesh = $json.meshes[0]
$posAcc = $json.accessors[$mesh.primitives[0].attributes.POSITION]
$bv = $json.bufferViews[$posAcc.bufferView]
$extraOffset = 0
if ($posAcc.byteOffset) { $extraOffset = $posAcc.byteOffset }
$posStart = $binDataStart + $bv.byteOffset + $extraOffset

$verts = @()
for ($i = 0; $i -lt $posAcc.count; $i++) {
    $idx = $posStart + ($i * 12)
    $x = [System.BitConverter]::ToSingle($bytes, $idx)
    $y = [System.BitConverter]::ToSingle($bytes, $idx + 4)
    $z = [System.BitConverter]::ToSingle($bytes, $idx + 8)
    $verts += [pscustomobject]@{ i = $i; x = $x; y = $y; z = $z }
}

Write-Host "Total vertices: $($verts.Count)"

# Let's inspect the facial surface (Z > 0.05, Y between 0.45 and 0.80, |X| < 0.15)
$faceVerts = $verts | Where-Object { $_.z -gt 0.05 -and $_.y -ge 0.45 -and $_.y -le 0.80 -and [Math]::Abs($_.x) -le 0.15 }
Write-Host "Face surface vertices (Z > 0.05, Y in [0.45, 0.80], |X| <= 0.15): $($faceVerts.Count)"

# Let's look at Y distribution on the face
$ySteps = @(0.48, 0.52, 0.56, 0.60, 0.64, 0.68, 0.72, 0.76)
for ($k = 0; $k -lt ($ySteps.Count - 1); $k++) {
    $yA = $ySteps[$k]
    $yB = $ySteps[$k+1]
    $slice = $faceVerts | Where-Object { $_.y -ge $yA -and $_.y -lt $yB }
    $avgZ = ($slice | Measure-Object -Property z -Average).Average
    $maxZ = ($slice | Measure-Object -Property z -Maximum).Maximum
    Write-Host ("Y [{0:N2} .. {1:N2}]: count = {2}, avgZ = {3:N3}, maxZ = {4:N3}" -f $yA, $yB, $slice.Count, $avgZ, $maxZ)
}

# The nose is typically the highest Z in [0.58 .. 0.66]
$nose = $faceVerts | Where-Object { $_.y -ge 0.58 -and $_.y -le 0.66 -and [Math]::Abs($_.x) -le 0.04 } | Sort-Object -Property z -Descending | Select-Object -First 5
Write-Host "`nNose tip candidates (highest Z in Y in [0.58, 0.66], |X| <= 0.04):"
foreach ($n in $nose) {
    Write-Host ("  idx={0}: x={1:N3}, y={2:N3}, z={3:N3}" -f $n.i, $n.x, $n.y, $n.z)
}

# The mouth is typically below the nose tip (Y in [0.52 .. 0.58], Z protruding)
$mouth = $faceVerts | Where-Object { $_.y -ge 0.52 -and $_.y -le 0.58 -and [Math]::Abs($_.x) -le 0.05 } | Sort-Object -Property z -Descending | Select-Object -First 5
Write-Host "`nMouth candidates (highest Z in Y in [0.52, 0.58], |X| <= 0.05):"
foreach ($m in $mouth) {
    Write-Host ("  idx={0}: x={1:N3}, y={2:N3}, z={3:N3}" -f $m.i, $m.x, $m.y, $m.z)
}

# The eyes are typically at Y in [0.63 .. 0.68], |X| in [0.025 .. 0.06]
$eyes = $faceVerts | Where-Object { $_.y -ge 0.63 -and $_.y -le 0.68 -and [Math]::Abs($_.x) -ge 0.025 -and [Math]::Abs($_.x) -le 0.06 } | Select-Object -First 5
Write-Host "`nEye region candidates (Y in [0.63, 0.68], |X| in [0.025, 0.06]):"
foreach ($e in $eyes) {
    Write-Host ("  idx={0}: x={1:N3}, y={2:N3}, z={3:N3}" -f $e.i, $e.x, $e.y, $e.z)
}
