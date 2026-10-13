param([string]$path = "public")
try {
    $res = Invoke-RestMethod -Uri "https://api.github.com/repos/wass08/r3f-virtual-girlfriend-frontend/contents/$path" -Headers @{'User-Agent'='Antigravity'}
    foreach ($item in $res) {
        Write-Host "$($item.type): $($item.name) -> $($item.download_url)"
    }
} catch {
    Write-Host "Error: $_"
}
