param()

$ErrorActionPreference = "Stop"

$androidBuildDir = $PSScriptRoot
$rootDir = Split-Path -Parent $androidBuildDir
$toolsDir = Join-Path $androidBuildDir "tools"
$appDir = Join-Path $androidBuildDir "app"
$srcMain = Join-Path $appDir "src\main"
$assetsDir = Join-Path $srcMain "assets"
$resDir = Join-Path $srcMain "res"
$manifestPath = Join-Path $srcMain "AndroidManifest.xml"
$javaSrcDir = Join-Path $srcMain "java"

$aapt2 = Join-Path $toolsDir "aapt2.exe"
$androidJar = Join-Path $toolsDir "android.jar"
$r8Jar = Join-Path $toolsDir "r8.jar"

# Dynamically locate Java JDK
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
$java = Join-Path $jdkBin "java.exe"
$jar = Join-Path $jdkBin "jar.exe"
$keytool = Join-Path $jdkBin "keytool.exe"
$jarsigner = Join-Path $jdkBin "jarsigner.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Leelio Android APK Build Script" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Using JDK: $jdkBin" -ForegroundColor Gray

# 1. Prepare build directories
$buildDir = Join-Path $androidBuildDir "build"
$genDir = Join-Path $buildDir "gen"
$classesDir = Join-Path $buildDir "classes"
$dexDir = Join-Path $buildDir "dex"
$compiledResZip = Join-Path $buildDir "compiled_res.zip"
$unalignedApk = Join-Path $buildDir "app_unaligned.apk"
$finalApk = Join-Path $rootDir "Leelio.apk"
$publicApk = Join-Path (Join-Path $rootDir "public") "Leelio.apk"
$keystore = Join-Path $androidBuildDir "leelio.keystore"

if (Test-Path $buildDir) {
    Remove-Item -Path $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
New-Item -ItemType Directory -Path $genDir -Force | Out-Null
New-Item -ItemType Directory -Path $classesDir -Force | Out-Null
New-Item -ItemType Directory -Path $dexDir -Force | Out-Null

# Always cleanly recreate the assets directory to prevent stale/duplicate file accumulation
if (Test-Path $assetsDir) {
    Remove-Item -Path $assetsDir -Recurse -Force
}
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

# 2. Copy Web App Assets into Android assets/
Write-Host "[1/7] Copying Web App & 3D Assets to assets/..." -ForegroundColor Cyan

# index.html
Copy-Item -Path (Join-Path $rootDir "index.html") -Destination (Join-Path $assetsDir "index.html") -Force

# public/ assets (exclude any existing APK to prevent recursive bloating)
$publicDir = Join-Path $rootDir "public"
Get-ChildItem -Path $publicDir -File | Where-Object { $_.Extension -ne ".apk" } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $assetsDir $_.Name) -Force
}

# src/ directory (scripts and styling)
$assetsSrcDir = Join-Path $assetsDir "src"
if (Test-Path $assetsSrcDir) {
    Remove-Item -Path $assetsSrcDir -Recurse -Force
}
Copy-Item -Path (Join-Path $rootDir "src") -Destination $assetsSrcDir -Recurse -Force

# tools/ directory (comparison & sync diagnostic players)
$toolsDir = Join-Path $rootDir "tools"
if (Test-Path $toolsDir) {
    $assetsToolsDir = Join-Path $assetsDir "tools"
    if (Test-Path $assetsToolsDir) { Remove-Item -Path $assetsToolsDir -Recurse -Force }
    Copy-Item -Path $toolsDir -Destination $assetsToolsDir -Recurse -Force
}

Write-Host "      Assets packaged into Android assets directory." -ForegroundColor Green

# 3. AAPT2 Compile Resources
Write-Host "[2/7] Compiling Android resources with AAPT2..." -ForegroundColor Cyan
& $aapt2 compile --dir $resDir -o $compiledResZip
if ($LASTEXITCODE -ne 0) { throw "AAPT2 resource compile failed with exit code $LASTEXITCODE" }

# 4. AAPT2 Link Resources & Assets
Write-Host "[3/7] Linking APK & Generating R.java with AAPT2..." -ForegroundColor Cyan
& $aapt2 link -I $androidJar --manifest $manifestPath $compiledResZip -A $assetsDir -o $unalignedApk --java $genDir --auto-add-overlay
if ($LASTEXITCODE -ne 0) { throw "AAPT2 link failed with exit code $LASTEXITCODE" }

# Normalize any Windows backslash asset paths to POSIX forward slashes
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($unalignedApk, [System.IO.Compression.ZipArchiveMode]::Update)
$toAdd = @()
$toDelete = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.Contains("\")) {
        $forwardName = $entry.FullName.Replace("\", "/")
        $existing = $zip.GetEntry($forwardName)
        if (-not $existing) {
            $ms = New-Object System.IO.MemoryStream
            $s = $entry.Open()
            $s.CopyTo($ms)
            $s.Close()
            $toAdd += @{ Name = $forwardName; Bytes = $ms.ToArray() }
        }
        $toDelete += $entry
    }
}
foreach ($item in $toAdd) {
    $newEntry = $zip.CreateEntry($item.Name, [System.IO.Compression.CompressionLevel]::Optimal)
    $es = $newEntry.Open()
    $es.Write($item.Bytes, 0, $item.Bytes.Length)
    $es.Close()
}
foreach ($delEntry in $toDelete) {
    $delEntry.Delete()
}
$zip.Dispose()

# 5. Compile Java Sources
Write-Host "[4/7] Compiling Java sources with javac (Java 8 bytecode)..." -ForegroundColor Cyan
$javaSources = @(Get-ChildItem -Path $javaSrcDir -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName)
$genSources = @(Get-ChildItem -Path $genDir -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName)
$allSources = $javaSources + $genSources

& $javac --release 8 -cp $androidJar -d $classesDir $allSources
if ($LASTEXITCODE -ne 0) { throw "Java compilation failed with exit code $LASTEXITCODE" }

# 6. Dex Classes with D8
Write-Host "[5/7] Compiling bytecode to Dalvik dex with D8..." -ForegroundColor Cyan
$classFiles = @(Get-ChildItem -Path $classesDir -Filter "*.class" -Recurse | Select-Object -ExpandProperty FullName)

& $java -cp $r8Jar com.android.tools.r8.D8 --lib $androidJar --release --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw "D8 dex compilation failed with exit code $LASTEXITCODE" }

$classesDex = Join-Path $dexDir "classes.dex"
if (-not (Test-Path $classesDex)) { throw "classes.dex not generated" }

# 7. Add classes.dex into unaligned.apk
Write-Host "[6/7] Adding classes.dex into APK archive..." -ForegroundColor Cyan
& $jar --update --file $unalignedApk -C $dexDir classes.dex
if ($LASTEXITCODE -ne 0) { throw "Jar update failed with exit code $LASTEXITCODE" }

# 8. Sign APK with Keytool & Jarsigner
Write-Host "[7/7] Signing APK with jarsigner..." -ForegroundColor Cyan
if (-not (Test-Path $keystore)) {
    Write-Host "      Generating Leelio release keystore..." -ForegroundColor Gray
    & $keytool -genkeypair -keystore $keystore -alias leelio -storepass leeliopass -keypass leeliopass `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -dname "CN=Leelio, OU=Curotech, O=Curotech, L=London, ST=London, C=GB"
    if ($LASTEXITCODE -ne 0) { throw "Keytool failed with exit code $LASTEXITCODE" }
}

if (Test-Path $finalApk) { Remove-Item $finalApk -Force }
& $jarsigner -keystore $keystore -storepass leeliopass -keypass leeliopass `
    -sigalg SHA256withRSA -digestalg SHA-256 `
    -signedjar $finalApk $unalignedApk leelio
if ($LASTEXITCODE -ne 0) { throw "Jarsigner failed with exit code $LASTEXITCODE" }

# Verify Signature
Write-Host "      Verifying APK signature..." -ForegroundColor Gray
& $jarsigner -verify $finalApk
if ($LASTEXITCODE -ne 0) { throw "APK verification failed with exit code $LASTEXITCODE" }

# Copy to public folder for direct browser download
Copy-Item -Path $finalApk -Destination $publicApk -Force

$apkSizeMB = [Math]::Round(((Get-Item $finalApk).Length / 1MB), 2)

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🎉 SUCCESS: Leelio.apk BUILT AND SIGNED! 🎉" -ForegroundColor Green
Write-Host "  Location: $finalApk" -ForegroundColor Yellow
Write-Host "  Size:     $apkSizeMB MB" -ForegroundColor Yellow
Write-Host "  Public:   $publicApk" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
