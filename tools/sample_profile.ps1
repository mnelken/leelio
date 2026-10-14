$bytes = [System.IO.File]::ReadAllBytes("C:\Users\MarekNelken\avatar-app\public\crimson_153.glb")
$chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
$binDataStart = 12 + 8 + $chunk0Len + 8
$posStart = $binDataStart

$all = @()
for ($i = 0; $i -lt 16375; $i++) {
    $idx = $posStart + ($i * 12)
    $x = [System.BitConverter]::ToSingle($bytes, $idx)
    $y = [System.BitConverter]::ToSingle($bytes, $idx + 4)
    $z = [System.BitConverter]::ToSingle($bytes, $idx + 8)
    if ($y -ge 0.45 -and $y -le 0.80 -and [Math]::Abs($x) -le 0.08 -and $z -gt 0.0) {
        $all += [pscustomobject]@{ i = $i; x = $x; y = $y; z = $z }
    }
}

Write-Host "Front central facial profile vertices: $($all.Count)"

$ySlices = @(0.50, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77)
for ($k = 0; $k -lt ($ySlices.Count - 1); $k++) {
    $y0 = $ySlices[$k]; $y1 = $ySlices[$k+1]
    $sl = $all | Where-Object { $_.y -ge $y0 -and $_.y -lt $y1 }
    if ($sl.Count -gt 0) {
        $maxZ = ($sl | Measure-Object -Property z -Maximum).Maximum
        $avgZ = ($sl | Measure-Object -Property z -Average).Average
        Write-Host ("Y [{0:N2} .. {1:N2}]: count={2,-4} maxZ={3:N3} avgZ={4:N3}" -f $y0, $y1, $sl.Count, $maxZ, $avgZ)
    }
}
