#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/Applications/AI Companion CLI.app"
SUPPORT_DIR="$HOME/.ai-companion"
ENTRY_SCRIPT="$SUPPORT_DIR/feishu-cli-entry.command"

if [[ "${1:-}" == "--uninstall" ]]; then
  rm -rf "$APP_DIR"
  rm -rf "$SUPPORT_DIR"
  echo "已移除 ai-companion 本地链接。"
  exit 0
fi

mkdir -p "$HOME/Applications" "$SUPPORT_DIR"

cat > "$ENTRY_SCRIPT" <<'ENTRY'
#!/usr/bin/env bash
set -u
URI="${1:-ai-companion://feishu/setup}"
FLOW="${URI#ai-companion://feishu/}"
FLOW="${FLOW%%\?*}"

printf '\033[36mAI 伴学 → 飞书 CLI\033[0m\n'
printf '正在检查本机配置，只在本机运行。\n\n'

if ! command -v lark-cli >/dev/null 2>&1; then
  echo "尚未安装飞书 CLI。请先运行：npm install -g @larksuite/cli"
  exit 1
fi

if [[ "$FLOW" == "setup" ]]; then
  lark-cli doctor >/dev/null || lark-cli auth login
else
  lark-cli doctor --offline >/dev/null || lark-cli doctor >/dev/null || lark-cli auth login
fi

case "$FLOW" in
  meeting) echo "已进入：会议内容 → 行动闭环"; echo "可用入口：lark-cli minutes --help / lark-cli task --help" ;;
  base) echo "已进入：多维表格协同"; echo "可用入口：lark-cli base --help" ;;
  assistant) echo "已进入：飞书应用与助手"; echo "可用入口：lark-cli apps --help / lark-cli im --help" ;;
  collaborate) echo "已进入：把当前网页带入飞书协同"; echo "可用入口：lark-cli docs --help / lark-cli task --help" ;;
  *) echo "飞书 CLI 已连接。可直接使用 docs、wiki、base、minutes、task 和 im。" ;;
esac

echo "高影响写入仍会在 CLI 内要求确认。"
ENTRY
chmod +x "$ENTRY_SCRIPT"

rm -rf "$APP_DIR"
osacompile -o "$APP_DIR" <<APPLESCRIPT
on open location theURL
  tell application "Terminal"
    activate
    do script quoted form of "$ENTRY_SCRIPT" & " " & quoted form of theURL
  end tell
end open location
APPLESCRIPT

PLIST="$APP_DIR/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string cn.aicompanion.feishu-cli" "$PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier cn.aicompanion.feishu-cli" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string AI Companion Protocol" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string ai-companion" "$PLIST"

LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
"$LSREGISTER" -f "$APP_DIR"

echo "已注册 ai-companion:// 本地链接。"
echo "飞书入口现在会直接打开 Mac 上的飞书 CLI。"
echo "如需移除：bash scripts/feishu/install-url-handler-mac.sh --uninstall"
