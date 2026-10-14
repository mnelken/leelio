$bytes = [System.IO.File]::ReadAllBytes("C:\Users\MarekNelken\avatar-app\public\crimson_153.glb")
$chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes, 20, $chunk0Len)
$json = $jsonStr | ConvertFrom-Json

$binStart = 20 + $chunk0Len + 8

# Find POSITION accessor and bufferView
$mesh = $json.meshes[0]
$posAccIdx = $mesh.primitives[0].attributes.POSITION
$posAcc = $json.accessors[$posAccIdx]
$bv = $json.bufferViews[$posAcc.bufferView]
$byteOffset = $binStart + $bv.byteOffset + (if ($posAcc.byteOffset) { $posAcc.byteOffset } else { 0 })
$count = $posAcc.count

Write-Host "Vertex count: $count"

# Read vertex positions
$yValues = New-Object System.Collections.Generic.List[float]
$positions = New-Object System.Collections.Generic.List[object]

for ($i = 0; $i -lt $count; $i++) {
    $idx = $byteOffset + ($i * 12)
    $x = [System.BitConverter]::ToSingle($bytes, $idx)
    $y = [System.BitConverter]::ToSingle($bytes, $idx + 4)
    $z = [System.BitConverter]::ToSingle($bytes, $idx + 8)
    $yValues.Add($y)
    $positions.Add(@{ x = $x; y = $y; z = $z })
}

# Histogram of Y
$minY = ($yValues | Measure-Object -Minimum).Minimum
$maxY = ($yValues | Measure-Object -Maximum).Maximum
Write-Host "Y Range: $minY to $maxY"

$bins = 10
$step = ($maxY - $minY) / $bins
for ($b = 0; $b -lt $bins; $b++) {
    $y0 = $minY + ($b * $step)
    $y1 = $y0 + $step
    $inBin = ($positions | Where-Object { $_.y -ge $y0 -and $_.y -lt $y1 }).Count
    Write-Host ("Y [{0:F2} .. {1:F2}]: {2} vertices" -f $y0, $y1, $inBin)
}

# Look at top 20% (Head and Face)
$headY0 = $maxY - 0.40
$headVerts = $positions | Where-Object { $_.y -ge $headY0 }
$headMinZ = ($headVerts | Measure-Object -Property z -Minimum).Minimum
$headMaxZ = ($headVerts | Measure-Object -Property z -Maximum).Maximum
$headMinX = ($headVerts | Measure-Object -Property x -Minimum).Minimum
$headMaxX = ($headVerts | Measure-Object -Property x -Maximum).Maximum
Write-Host "Head region (Y >= $headY0): count = $($headVerts.Count)"
Write-Host "Head X range: $headMinX to $headMaxX"
Write-Host "Head Z range: $headMinZ to $headMaxZ"
