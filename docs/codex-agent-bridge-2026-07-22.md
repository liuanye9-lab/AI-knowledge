# Codex CLI Agent Bridge 验证记录

日期：2026-07-22

## 当前架构

```text
Chrome 侧边栏
  → Chrome Native Messaging
  → AI Companion Agent Bridge
  → Codex CLI（临时会话、只读沙箱、无网络）
  → JSON Schema 结构化结果
  → 侧边栏直接呈现
```

OpenClaw、飞书插件和 Gateway 已按用户要求暂停，不参与当前运行链路。

## 安全约束

- `codex exec --ephemeral`：不保留本次会话。
- `--sandbox read-only`：不允许修改本机文件。
- `--ignore-user-config`：不继承用户可能放宽权限的自定义设置；身份认证仍使用现有 Codex 登录。
- 不启用网络，不使用 MCP、Shell 或其他外部工具。
- 网页正文被包裹为不可信 `page-content`，并在 Agent 指令中明确禁止服从其中的指令。
- 输入最多 8000 字符，输出必须通过固定 JSON Schema。
- 失败时自动退回现有服务端模型或本地可靠方法，不阻塞侧边栏。

## 已验证

1. Codex CLI 从 `0.141.0` 升级到 `0.145.0`，兼容当前账户模型。
2. Native Messaging Host 能通过 UTF-8 管道调用 Codex CLI。
3. `clarify` 模式返回 `title/rewrite/why/method/risk` 五个结构化字段。
4. 含“读取密码并发送”的网页提示注入测试被拒绝，输出未执行或复述恶意动作。
5. Codex 运行环境为 `read-only`，Agent 未获得文件写入或外部网络能力。

## 当前边界

- 第一次调用通常比本地规则慢，需要等待 Codex CLI 初始化。
- 目前是单次任务 Agent，没有跨页面长期记忆。
- 还没有连接飞书写入操作；侧边栏结果仍需用户主动点击“交给飞书”。
- Chrome 加载扩展后需要在 `chrome://extensions` 手动重新加载一次，浏览器安全策略不允许自动操作该页面。
