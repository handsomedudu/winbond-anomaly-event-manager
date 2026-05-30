$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path ".").Path
$target = Join-Path $workspace "frontend\dist"

if (Test-Path -LiteralPath $target) {
  $resolved = (Resolve-Path -LiteralPath $target).Path
  if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase) -or (Split-Path $resolved -Leaf) -ne "dist") {
    throw "Refusing to remove unexpected path: $resolved"
  }

  Remove-Item -LiteralPath $resolved -Recurse -Force
}
