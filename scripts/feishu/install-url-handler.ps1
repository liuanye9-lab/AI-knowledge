param(
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$schemeRoot = "HKCU:\Software\Classes\ai-companion"

if ($Uninstall) {
  if (Test-Path -LiteralPath $schemeRoot) { Remove-Item -LiteralPath $schemeRoot -Recurse -Force }
  Write-Host "已移除 ai-companion 本地链接。"
  exit 0
}

$entryScript = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "cli-entry.ps1")).Path
$pwshCommand = Get-Command pwsh.exe -ErrorAction SilentlyContinue
if (-not $pwshCommand) {
  throw "飞书本地入口需要 PowerShell 7（pwsh.exe），以确保中文脚本按 UTF-8 正确读取。"
}
$shellExe = $pwshCommand.Source
$command = '"' + $shellExe + '" -NoLogo -NoExit -ExecutionPolicy Bypass -File "' + $entryScript + '" "%1"'

New-Item -Path $schemeRoot -Force | Out-Null
Set-ItemProperty -Path $schemeRoot -Name "(default)" -Value "URL:AI Companion Protocol"
Set-ItemProperty -Path $schemeRoot -Name "URL Protocol" -Value ""
New-Item -Path "$schemeRoot\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$schemeRoot\DefaultIcon" -Name "(default)" -Value "${shellExe},0"
New-Item -Path "$schemeRoot\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$schemeRoot\shell\open\command" -Name "(default)" -Value $command

Write-Host "已注册 ai-companion:// 本地链接。"
Write-Host "飞书入口现在会直接打开本机飞书 CLI。"
Write-Host "如需移除：.\scripts\feishu\install-url-handler.ps1 -Uninstall"
