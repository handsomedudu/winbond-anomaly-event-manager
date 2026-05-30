param(
  [string]$TailscaleExe = "tailscale.exe"
)

$ErrorActionPreference = "Continue"

$targetPort = "5173"
$externalUrl = $null
$opened = $false

Write-Host "Starting Tailscale Funnel for localhost:$targetPort ..."
Write-Host ""

$quotedExe = '"' + $TailscaleExe + '"'
$command = "$quotedExe funnel $targetPort 2>&1"

& cmd.exe /d /c $command | ForEach-Object {
  $line = $_.ToString()
  Write-Host $line

  if (-not $opened -and $line -match "https://[A-Za-z0-9.-]+\.ts\.net") {
    $externalUrl = $Matches[0].TrimEnd(".")
    $opened = $true

    Write-Host ""
    Write-Host "Tailscale Funnel URL: $externalUrl"

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

$tailscaleExitCode = $LASTEXITCODE
if ($tailscaleExitCode -ne 0 -and -not $opened) {
  Write-Host "tailscale exited before creating a Funnel URL. Exit code: $tailscaleExitCode"
  Write-Host "If this is the first time, log in to Tailscale and approve Funnel when prompted."
  exit $tailscaleExitCode
}
