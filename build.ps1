param(
    [switch]$ApkOnly,
    [switch]$ServerOnly,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Leelio AI Avatar Studio - Master Build" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Java JDK
$jdkBin = $null
if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\javac.exe"))) {
    $jdkBin = Join-Path $env:JAVA_HOME "bin"
} elseif (Get-Command javac.exe -ErrorAction SilentlyContinue) {
    $jdkBin = Split-Path (Get-Command javac.exe).Source -Parent
} elseif (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot\bin\javac.exe") {
    $jdkBin = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot\bin"
} else {
    $found = Get-ChildItem "C:\Program Files\Eclipse Adoptium", "C:\Program Files\Java" -Filter "javac.exe" -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $jdkBin = $found.DirectoryName }
    else { throw "Java JDK (javac.exe) not found. Please install JDK or set JAVA_HOME." }
}
$javac = Join-Path $jdkBin "javac.exe"
Write-Host "[1/4] Found Java JDK at: $jdkBin" -ForegroundColor Green

# 2. Compile Local Java Server
if (-not $ApkOnly) {
    Write-Host "[2/4] Compiling Server.java..." -ForegroundColor Cyan
    & $javac (Join-Path $rootDir "Server.java")
    if ($LASTEXITCODE -ne 0) { throw "Server.java compilation failed." }
    Write-Host "      Server.class compiled successfully." -ForegroundColor Green
} else {
    Write-Host "[2/4] Skipping Server.java compile (-ApkOnly specified)" -ForegroundColor Gray
}

# 3. Android APK Tools Setup
if (-not $ServerOnly) {
    Write-Host "[3/4] Ensuring Android SDK tools are present..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $rootDir "android-build\setup-tools.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Android tools setup failed." }

    # 4. Build Android APK
    Write-Host "[4/4] Building Leelio Android APK..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $rootDir "android-build\build-apk.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Android APK build failed." }
} else {
    Write-Host "[3/4] Skipping Android SDK tools (-ServerOnly specified)" -ForegroundColor Gray
    Write-Host "[4/4] Skipping Android APK build (-ServerOnly specified)" -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🎉 BUILD COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To run the local studio web app:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File .\start-server.ps1" -ForegroundColor White
Write-Host "Or with Java server:" -ForegroundColor Yellow
Write-Host "  java Server" -ForegroundColor White
if (-not $ServerOnly) {
    $apkPath = Join-Path $rootDir "Leelio.apk"
    if (Test-Path $apkPath) {
        $apkSize = [Math]::Round(((Get-Item $apkPath).Length / 1MB), 2)
        Write-Host "Android APK ready at: $apkPath ($apkSize MB)" -ForegroundColor Yellow
    }
}
Write-Host "==========================================================" -ForegroundColor Green
