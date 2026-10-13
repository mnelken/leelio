Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("C:\Users\MarekNelken\avatar-app\public\avatar.jpg")
$bg = New-Object System.Drawing.Bitmap $src.Width, $src.Height

# Copy the entire original image first
$g = [System.Drawing.Graphics]::FromImage($bg)
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)
$g.Dispose()

# Reconstruct the doorway background behind Jessica's head and collar:
# Left boundary: xL = 380
# Right boundary: xR = 670
# Center seam of doors: xC = 548
# Top arch: y varies with x as an ellipse/parabola

# Lock bits for fast pixel manipulation
$rect = New-Object System.Drawing.Rectangle 0, 0, $bg.Width, $bg.Height
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bgData = $bg.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytesPerPixel = 4
$stride = $srcData.Stride
$totalBytes = $stride * $bg.Height

$srcBytes = New-Object byte[] $totalBytes
$bgBytes = New-Object byte[] $totalBytes

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $totalBytes)
[System.Runtime.InteropServices.Marshal]::Copy($bgData.Scan0, $bgBytes, 0, $totalBytes)

# Arch top curve: center at x=540, peak at y=10, base at y=60 at x=380 and x=670
# Head & neck region to inpaint: x from 385 to 665, y from 10 to 330
for ($y = 0; $y -lt 340; $y++) {
    # Sample Left column (x=375) and Right column (x=675)
    $idxL = ($y * $stride) + (375 * 4)
    $bL = $srcBytes[$idxL]
    $gL = $srcBytes[$idxL + 1]
    $rL = $srcBytes[$idxL + 2]

    $idxR = ($y * $stride) + (675 * 4)
    $bR = $srcBytes[$idxR]
    $gR = $srcBytes[$idxR + 1]
    $rR = $srcBytes[$idxR + 2]

    # For y < 60, top arch is stone archway
    for ($x = 380; $x -le 670; $x++) {
        # Check if point is inside Jessica's head/cap silhouette
        # Elliptical mask centered at (535, 160), rx=145, ry=155
        $dx = ($x - 535.0) / 148.0
        $dy = ($y - 165.0) / 160.0
        $dist = ($dx * $dx) + ($dy * $dy)

        # If inside silhouette or near it:
        if ($dist -le 1.15) {
            # Weight across door: t from 0 (left) to 1 (right)
            $t = ($x - 375.0) / (675.0 - 375.0)
            
            # Interpolate background color
            $r = [byte][Math]::Round((1.0 - $t) * $rL + $t * $rR)
            $gCol = [byte][Math]::Round((1.0 - $t) * $gL + $t * $gR)
            $b = [byte][Math]::Round((1.0 - $t) * $bL + $t * $bR)

            # Center door vertical seam shade (subtle dark line at x=540..548)
            $seamDist = [Math]::Abs($x - 544.0)
            if ($seamDist -lt 6.0) {
                $darken = 1.0 - (0.15 * (1.0 - ($seamDist / 6.0)))
                $r = [byte][Math]::Round($r * $darken)
                $gCol = [byte][Math]::Round($gCol * $darken)
                $b = [byte][Math]::Round($b * $darken)
            }

            # Arch moulding at top (y: 0..45)
            if ($y -lt 45) {
                # Blend with top arch stone color (R:95, G:85, B:75)
                $archWeight = (45.0 - $y) / 45.0
                $r = [byte][Math]::Round($r * (1.0 - $archWeight) + 95.0 * $archWeight)
                $gCol = [byte][Math]::Round($gCol * (1.0 - $archWeight) + 88.0 * $archWeight)
                $b = [byte][Math]::Round($b * (1.0 - $archWeight) + 78.0 * $archWeight)
            }

            # If near border (1.0 < dist <= 1.15), feather blend with existing background
            if ($dist -gt 1.0) {
                $alpha = (1.15 - $dist) / 0.15
                $idxPix = ($y * $stride) + ($x * 4)
                $rOld = $srcBytes[$idxPix + 2]
                $gOld = $srcBytes[$idxPix + 1]
                $bOld = $srcBytes[$idxPix]

                $r = [byte][Math]::Round($r * $alpha + $rOld * (1.0 - $alpha))
                $gCol = [byte][Math]::Round($gCol * $alpha + $gOld * (1.0 - $alpha))
                $b = [byte][Math]::Round($b * $alpha + $bOld * (1.0 - $alpha))
            }

            $idxOut = ($y * $stride) + ($x * 4)
            $bgBytes[$idxOut] = $b
            $bgBytes[$idxOut + 1] = $gCol
            $bgBytes[$idxOut + 2] = $r
            $bgBytes[$idxOut + 3] = 255
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($bgBytes, 0, $bgData.Scan0, $totalBytes)
$src.UnlockBits($srcData)
$bg.UnlockBits($bgData)

$bg.Save("C:\Users\MarekNelken\avatar-app\public\background_plate.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bg.Save("C:\Users\MarekNelken\avatar-app\tools\background_plate.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

$src.Dispose()
$bg.Dispose()
Write-Output "Successfully generated photorealistic background plate!"
