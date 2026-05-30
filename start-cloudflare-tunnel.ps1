$ErrorActionPreference = "Continue"

$targetUrl = "http://localhost:5173"
$externalUrl = $null
$opened = $false

Write-Host "Starting Cloudflare Tunnel for $targetUrl ..."
Write-Host ""

& cmd.exe /d /c "cloudflared tunnel --protocol http2 --url $targetUrl 2>&1" | ForEach-Object {
  $line = $_.ToString()
  Write-Host $line

  if (-not $opened -and $line -match "https://[A-Za-z0-9-]+\.trycloudflare\.com") {
    $externalUrl = $Matches[0]
    $opened = $true

    Write-Host ""
    Write-Host "Cloudflare Tunnel URL: $externalUrl"

    try {
      Set-Clipboard -Value $externalUrl
      Write-Host "The URL has been copied to your clipboard."
    } catch {
      Write-Host "Could not copy the URL to clipboard. You can copy it from the line above."
    }

    try {
      Start-Process $externalUrl
      Write-Host "The URL has been opened in your default browser."
    } catch {
      Write-Host "Could not open the URL automatically. You can open it manually."
    }

    Write-Host ""
  }
}

$cloudflaredExitCode = $LASTEXITCODE
if ($cloudflaredExitCode -ne 0 -and -not $opened) {
  Write-Host "cloudflared exited before creating a tunnel. Exit code: $cloudflaredExitCode"
  exit $cloudflaredExitCode
}
