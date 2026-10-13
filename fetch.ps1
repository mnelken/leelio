param([string]$url, [string]$out)
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 30
    $item = Get-Item $out
    Write-Host "Success: $($item.FullName) ($($item.Length) bytes)"
} catch {
    Write-Host "Failed: $($_.Exception.ToString())"
}
