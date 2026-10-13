param()

$ErrorActionPreference = "Stop"
$toolsDir = Join-Path $PSScriptRoot "tools"
if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

$aapt2Exe = Join-Path $toolsDir "aapt2.exe"
$androidJar = Join-Path $toolsDir "android.jar"
$r8Jar = Join-Path $toolsDir "r8.jar"

# 1. Download & Extract aapt2
if (-not (Test-Path $aapt2Exe)) {
    Write-Host "Downloading AAPT2 using curl..." -ForegroundColor Cyan
    $aapt2JarUrl = "https://dl.google.com/dl/android/maven2/com/android/tools/build/aapt2/8.2.2-10154469/aapt2-8.2.2-10154469-windows.jar"
    $tempZip = Join-Path $toolsDir "aapt2_temp.zip"
    $tempExtract = Join-Path $toolsDir "aapt2_extract"
    
    & curl.exe -sSL -o $tempZip $aapt2JarUrl
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    
    $extractedExe = Get-ChildItem -Path $tempExtract -Filter "aapt2.exe" -Recurse | Select-Object -First 1
    if ($extractedExe) {
        Move-Item -Path $extractedExe.FullName -Destination $aapt2Exe -Force
        Write-Host "AAPT2 installed: $aapt2Exe" -ForegroundColor Green
    } else {
        throw "aapt2.exe not found in extracted jar archive"
    }
    
    Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "AAPT2 already exists: $aapt2Exe" -ForegroundColor Green
}

# 2. Download android.jar (Android 30)
if (-not (Test-Path $androidJar)) {
    Write-Host "Downloading android.jar using curl..." -ForegroundColor Cyan
    $androidJarUrl = "https://raw.githubusercontent.com/Sable/android-platforms/master/android-30/android.jar"
    & curl.exe -sSL -o $androidJar $androidJarUrl
    Write-Host "android.jar downloaded: $androidJar" -ForegroundColor Green
} else {
    Write-Host "android.jar already exists: $androidJar" -ForegroundColor Green
}

# 3. Download R8 / D8 jar
if (-not (Test-Path $r8Jar)) {
    Write-Host "Downloading R8 / D8 Dex Compiler using curl..." -ForegroundColor Cyan
    $r8JarUrl = "https://dl.google.com/dl/android/maven2/com/android/tools/r8/8.2.42/r8-8.2.42.jar"
    & curl.exe -sSL -o $r8Jar $r8JarUrl
    Write-Host "r8.jar downloaded: $r8Jar" -ForegroundColor Green
} else {
    Write-Host "r8.jar already exists: $r8Jar" -ForegroundColor Green
}

# 4. Verify AAPT2
Write-Host "Testing AAPT2 version..." -ForegroundColor Yellow
& $aapt2Exe version

Write-Host "All Android build tools ready!" -ForegroundColor Green
