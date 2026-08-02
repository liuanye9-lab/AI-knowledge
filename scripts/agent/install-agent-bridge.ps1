param(
  [string]$ExtensionId = "",
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$hostName = "cn.ai_companion.agent_bridge"
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$hostName"
$installRoot = Join-Path $env:LOCALAPPDATA "AICompanion\AgentBridge"

if ($Uninstall) {
  if (Test-Path -LiteralPath $registryPath) { Remove-Item -LiteralPath $registryPath -Recurse -Force }
  Write-Host "已移除 AI 伴学本机 Agent Bridge。"
  exit 0
}

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path

function Find-ExtensionId {
  param([string]$ExpectedPath)
  $userData = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
  if (-not (Test-Path -LiteralPath $userData)) { return "" }
  $profiles = Get-ChildItem -LiteralPath $userData -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq "Default" -or $_.Name -like "Profile *" }
  $preferenceFiles = foreach ($profile in $profiles) {
    foreach ($name in @("Preferences", "Secure Preferences")) {
      $candidateFile = Join-Path $profile.FullName $name
      if (Test-Path -LiteralPath $candidateFile) { Get-Item -LiteralPath $candidateFile }
    }
  }
  foreach ($file in $preferenceFiles) {
    try {
      $preferences = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
      $settings = $preferences.extensions.settings
      if (-not $settings) { continue }
      foreach ($property in $settings.PSObject.Properties) {
        $candidate = $property.Value.path
        if (-not $candidate) { continue }
        $resolved = [System.IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables([string]$candidate))
        if ($resolved.TrimEnd('\') -eq $ExpectedPath.TrimEnd('\')) { return $property.Name }
        $candidateManifest = Join-Path $resolved "manifest.json"
        if (Test-Path -LiteralPath $candidateManifest) {
          $manifest = Get-Content -LiteralPath $candidateManifest -Raw | ConvertFrom-Json
          if ($manifest.name -eq "AI 伴学层") { return $property.Name }
        }
      }
    } catch { continue }
  }
  return ""
}

if (-not $ExtensionId) { $ExtensionId = Find-ExtensionId -ExpectedPath $projectRoot }
if ($ExtensionId -notmatch '^[a-p]{32}$') {
  throw "没有找到已加载的 AI 伴学插件。请先在 chrome://extensions 加载项目根目录，或传入 -ExtensionId。"
}

New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
$exePath = Join-Path $installRoot "agent-bridge.exe"
$sourcePath = Join-Path $PSScriptRoot "AgentBridge.cs"
if (Test-Path -LiteralPath $exePath) { Remove-Item -LiteralPath $exePath -Force }
$compiler = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe" }
& $compiler /nologo /target:exe /reference:System.Web.Extensions.dll "/out:$exePath" $sourcePath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $exePath)) { throw "本机 Agent Bridge 编译失败。" }
Copy-Item -LiteralPath (Join-Path $projectRoot "scripts\feishu\cli-entry.ps1") -Destination (Join-Path $installRoot "cli-entry.ps1") -Force
$codexAgentTarget = Join-Path $installRoot "codex-agent"
New-Item -ItemType Directory -Path $codexAgentTarget -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot "agent\codex-ai-companion\AGENTS.md") -Destination (Join-Path $codexAgentTarget "AGENTS.md") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "agent\codex-ai-companion\result.schema.json") -Destination (Join-Path $codexAgentTarget "result.schema.json") -Force

$manifestPath = Join-Path $installRoot "$hostName.json"
$manifest = [ordered]@{
  name = $hostName
  description = "AI 伴学本机 Agent Bridge"
  path = $exePath
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
New-Item -Path $registryPath -Force | Out-Null
Set-ItemProperty -Path $registryPath -Name "(default)" -Value $manifestPath

Write-Host "AI 伴学本机 Agent Bridge 已连接。" -ForegroundColor Green
Write-Host "扩展 ID：$ExtensionId"
Write-Host "回到 chrome://extensions 点击一次“重新加载”，即可从侧边栏调用 Codex Agent 或飞书 CLI。"
