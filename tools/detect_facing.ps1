$bytes = [System.IO.File]::ReadAllBytes("C:\Users\MarekNelken\avatar-app\public\crimson_153.glb")
$chunk0Len = [System.BitConverter]::ToUInt32($bytes, 12)
$binDataStart = 12 + 8 + $chunk0Len + 8
$posStart = $binDataStart

$headVerts = @()
for ($i = 0; $i -lt 16375; $i++) {
    $idx = $posStart + ($i * 12)
    $x = [System.BitConverter]::ToSingle($bytes, $idx)
    $y = [System.BitConverter]::ToSingle($bytes, $idx + 4)
    $z = [System.BitConverter]::ToSingle($bytes, $idx + 8)
    if ($y -ge 0.50 -and $y -le 0.80) {
        $headVerts += [pscustomobject]@{ i = $i; x = $x; y = $y; z = $z }
    }
}

Write-Host "Head vertices: $($headVerts.Count)"
$zMin = ($headVerts | Measure-Object -Property z -Minimum).Minimum
$zMax = ($headVerts | Measure-Object -Property z -Maximum).Maximum
$zAvg = ($headVerts | Measure-Object -Property z -Average).Average
Write-Host "Z min: $zMin, max: $zMax, avg: $zAvg"

# Count in front (Z > 0) vs back (Z < 0)
$posZ = ($headVerts | Where-Object { $_.z -gt 0 }).Count
$negZ = ($headVerts | Where-Object { $_.z -lt 0 }).Count
Write-Host "Z > 0 count: $posZ, Z < 0 count: $negZ"

# Let's see extreme Z points near X = 0
Write-Host "`nTop 5 max +Z near X=0:"
$headVerts | Where-Object { [Math]::Abs($_.x) -le 0.05 } | Sort-Object -Property z -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host ("  y={0:N3}, z={1:N3}" -f $_.y, $_.z)
}

Write-Host "`nTop 5 min -Z near X=0:"
$headVerts | Where-Object { [Math]::Abs($_.x) -le 0.05 } | Sort-Object -Property z | Select-Object -First 5 | ForEach-Object {
    Write-Host ("  y={0:N3}, z={1:N3}" -f $_.y, $_.z)
}
