$script = Get-Content "tools/test_new_triangulation.ps1" -Raw

# Extract triangles
$triMatches = [regex]::Matches($script, '@\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)')
$tris = @()
foreach ($m in $triMatches) {
    $tris += ,@([int]$m.Groups[1].Value, [int]$m.Groups[2].Value, [int]$m.Groups[3].Value)
}

# Parse LANDMARK_UVS from model
$content = Get-Content "src/facialSkeletonModel.js" -Raw
$uvMatches = [regex]::Matches($content, '\[\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*\]')
$uvs = @()
foreach ($m in $uvMatches) {
    $uvs += ,@([double]$m.Groups[1].Value, [double]$m.Groups[2].Value)
}

$flippedCount = 0
$correctedTris = @()
for ($i = 0; $i -lt $tris.Count; $i++) {
    $t = $tris[$i]
    $p1 = $uvs[$t[0]]
    $p2 = $uvs[$t[1]]
    $p3 = $uvs[$t[2]]
    # Signed area in UV space (u right, v up)
    $sa = (($p2[0] - $p1[0])*($p3[1] - $p1[1]) - ($p3[0] - $p1[0])*($p2[1] - $p1[1])) / 2.0
    if ($sa -lt 0) {
        $flippedCount++
        # Swap vertex 1 and 2 to make it CCW (counter-clockwise)
        $correctedTris += ,@($t[0], $t[2], $t[1])
    } else {
        $correctedTris += ,@($t[0], $t[1], $t[2])
    }
}

Write-Host "Original tris: $($tris.Count), Flipped (CW): $flippedCount, Corrected CCW: $($correctedTris.Count)"

# Export clean JS array string
$sb = New-Object System.Text.StringBuilder
$sb.AppendLine("export const MESH_TRIANGLES = [") | Out-Null
for ($i = 0; $i -lt $correctedTris.Count; $i++) {
    $t = $correctedTris[$i]
    $line = "  [" + $t[0] + ", " + $t[1] + ", " + $t[2] + "]" + $(if ($i -lt $correctedTris.Count - 1) { "," } else { "" })
    $sb.AppendLine($line) | Out-Null
}
$sb.AppendLine("];") | Out-Null
$sb.ToString() | Set-Content "tools/clean_mesh_triangles.js"
Write-Host "Written tools/clean_mesh_triangles.js"
