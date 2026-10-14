$client = New-Object System.Net.WebClient
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$data = $client.DownloadData('http://localhost:4242/crimson_153.glb')
$sw.Stop()
Write-Host "Downloaded $($data.Length) bytes in $($sw.ElapsedMilliseconds) ms"
