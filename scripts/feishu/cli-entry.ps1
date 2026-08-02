param(
  [Parameter(Position = 0)]
  [string]$Uri = "ai-companion://feishu/setup",
  [string]$AgentPayload = ""
)

$ErrorActionPreference = "Continue"
$flow = "setup"
$sourceUrl = ""
$agentContext = $null

if ($AgentPayload) {
  try {
    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($AgentPayload))
    $agentContext = $json | ConvertFrom-Json
    $flow = "collaborate"
    $sourceUrl = [string]$agentContext.url
  } catch { $agentContext = $null }
}

if (-not $AgentPayload) { try {
  $parsed = [System.Uri]$Uri
  if ($parsed.AbsolutePath.Trim('/')) { $flow = $parsed.AbsolutePath.Trim('/').ToLowerInvariant() }
  if ($parsed.Query -match '(?:^|[?&])source=([^&]+)') {
    $sourceUrl = [System.Uri]::UnescapeDataString($Matches[1])
  }
} catch {
  $flow = "setup"
} }

Write-Host "AI 伴学 → 飞书 CLI" -ForegroundColor Cyan
Write-Host "正在检查本机配置，只在本机运行。" -ForegroundColor DarkGray
Write-Host ""

$cli = Get-Command lark-cli -ErrorAction SilentlyContinue
if (-not $cli) {
  Write-Host "尚未安装飞书 CLI。" -ForegroundColor Yellow
  Write-Host "请先运行：npm install -g @larksuite/cli"
  return
}

if ($flow -eq "setup") { $doctorOutput = lark-cli doctor 2>&1 } else { $doctorOutput = lark-cli doctor --offline 2>&1 }
$doctorExit = $LASTEXITCODE
if ($doctorExit -ne 0) {
  Write-Host ""
  Write-Host "本地配置尚未完成，正在进行完整检查。" -ForegroundColor Yellow
  $doctorOutput | Write-Host
  lark-cli doctor | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "配置已经恢复。" -ForegroundColor Green }
  else { lark-cli auth login }
  if ($LASTEXITCODE -ne 0) { return }
}

Write-Host ""
switch ($flow) {
  "meeting" {
    Write-Host "已进入：会议内容 → 行动闭环" -ForegroundColor Green
    Write-Host "可用入口：lark-cli minutes --help"
    Write-Host "          lark-cli task --help"
  }
  "base" {
    Write-Host "已进入：多维表格协同" -ForegroundColor Green
    Write-Host "可用入口：lark-cli base --help"
  }
  "assistant" {
    Write-Host "已进入：飞书应用与助手" -ForegroundColor Green
    Write-Host "可用入口：lark-cli apps --help"
    Write-Host "          lark-cli im --help"
  }
  "collaborate" {
    Write-Host "已进入：把当前网页带入飞书协同" -ForegroundColor Green
    if ($sourceUrl) { Write-Host "来源：$sourceUrl" -ForegroundColor DarkGray }
    if ($agentContext.title) { Write-Host "页面：$($agentContext.title)" }
    if ($agentContext.result) {
      Write-Host ""
      Write-Host "侧边栏已经完成的结果：" -ForegroundColor Cyan
      Write-Host $agentContext.result
    }
    Write-Host "可用入口：lark-cli docs --help"
    Write-Host "          lark-cli task --help"
  }
  default {
    Write-Host "飞书 CLI 已连接。" -ForegroundColor Green
    Write-Host ""
    Write-Host "接下来可以直接使用 docs、wiki、base、minutes、task 和 im。"
  }
}

Write-Host ""
Write-Host "高影响写入仍会在 CLI 内要求确认。" -ForegroundColor DarkGray
