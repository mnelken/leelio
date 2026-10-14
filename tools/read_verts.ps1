$bytes = [System.IO.File]::ReadAllBytes("C:\Users\MarekNelken\avatar-app\public\crimson_153.glb")
$chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len)
$json = $jsonStr | ConvertFrom-Json

$chunk1Header = 12 + 8 + $chunk0Len
$chunk1Len = [System.BitConverter]::ToUInt32($bytes, $chunk1Header)
$chunk1Type = [System.Text.Encoding]::ASCII.GetString($bytes, $chunk1Header + 4, 4)
Write-Host "Chunk1: len = $chunk1Len type = $chunk1Type"

$binDataStart = $chunk1Header + 8

$mesh = $json.meshes[0]
$posAccIdx = $mesh.primitives[0].attributes.POSITION
$posAcc = $json.accessors[$posAccIdx]
$bv = $json.bufferViews[$posAcc.bufferView]
$accByteOffset = 0
if ($posAcc.byteOffset) { $accByteOffset = $posAcc.byteOffset }
$posStart = $binDataStart + $bv.byteOffset + $accByteOffset

Write-Host "BufferView byteOffset: $($bv.byteOffset) accOffset: $accByteOffset posStart: $posStart count: $($posAcc.count)"

$xMin = 999999.0; $xMax = -999999.0
$yMin = 999999.0; $yMax = -999999.0
$zMin = 999999.0; $zMax = -999999.0

$allVerts = @()
for ($i = 0; $i -lt $posAcc.count; $i++) {
    $idx = $posStart + ($i * 12)
    $x = [System.BitConverter]::ToSingle($bytes, $idx)
    $y = [System.BitConverter]::ToSingle($bytes, $idx + 4)
    $z = [System.BitConverter]::ToSingle($bytes, $idx + 8)
    if ($x -lt $xMin) { $xMin = $x }; if ($x -gt $xMax) { $xMax = $x }
    if ($y -lt $yMin) { $yMin = $y }; if ($y -gt $yMax) { $yMax = $y }
    if ($z -lt $zMin) { $zMin = $z }; if ($z -gt $zMax) { $zMax = $z }
    $allVerts += [pscustomobject]@{ x = $x; y = $y; z = $z }
}

Write-Host "Calculated X range: $xMin to $xMax"
Write-Host "Calculated Y range: $yMin to $yMax"
Write-Host "Calculated Z range: $zMin to $zMax"

# Histogram of Y
$bins = 10
$step = ($yMax - $yMin) / $bins
for ($b = 0; $b -lt $bins; $b++) {
    $y0 = $yMin + ($b * $step)
    $y1 = $y0 + $step
    $cnt = ($allVerts | Where-Object { $_.y -ge $y0 -and $_.y -lt $y1 }).Count
    Write-Host ("Y [{0:N2} .. {1:N2}]: {2} vertices" -f $y0, $y1, $cnt)
}

# Head vertices (Y >= 0.50)
$head = $allVerts | Where-Object { $_.y -ge 0.50 }
Write-Host "Head & Cap vertices (Y >= 0.50): $($head.Count)"
$hxMin = ($head | Measure-Object -Property x -Minimum).Minimum
$hxMax = ($head | Measure-Object -Property x -Maximum).Maximum
$hzMin = ($head | Measure-Object -Property z -Minimum).Minimum
$hzMax = ($head | Measure-Object -Property z -Maximum).Maximum
Write-Host "Head X: $hxMin to $hxMax, Z: $hzMin to $hzMax"
