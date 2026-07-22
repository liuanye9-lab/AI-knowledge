$ErrorActionPreference = "Stop"

$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stagePath = Join-Path $workspaceRoot ".extension-package"
$outputDirectory = Join-Path $workspaceRoot "downloads"
$outputPath = Join-Path $outputDirectory "ai-companion-extension.zip"

if (-not $stagePath.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to use a staging path outside the workspace."
}

if (Test-Path -LiteralPath $stagePath) {
  Remove-Item -LiteralPath $stagePath -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $stagePath, $outputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $stagePath "extension"), (Join-Path $stagePath "css"), (Join-Path $stagePath "images\product") | Out-Null

Copy-Item -LiteralPath (Join-Path $workspaceRoot "manifest.json") -Destination $stagePath
Copy-Item -Path (Join-Path $workspaceRoot "extension\*") -Destination (Join-Path $stagePath "extension") -Recurse
Copy-Item -LiteralPath (Join-Path $workspaceRoot "css\companion.css") -Destination (Join-Path $stagePath "css")
Copy-Item -LiteralPath (Join-Path $workspaceRoot "images\product\newtab-action-watercolor.webp") -Destination (Join-Path $stagePath "images\product")

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Compress-Archive -Path (Join-Path $stagePath "*") -DestinationPath $outputPath -CompressionLevel Optimal
Remove-Item -LiteralPath $stagePath -Recurse -Force

Write-Output $outputPath
