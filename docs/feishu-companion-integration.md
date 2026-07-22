# AI 伴学：飞书文档、Bot 与卡片连接

这条链路不创建新的“学习系统”。Bot 只在会议或文档产生结果时出现，把缺失的负责人补齐，再将行动写回原有飞书文档。

## 链路

1. `lark-cli docs +fetch` 读取用户明确指定的文档，不扫描整个云空间。
2. Bot 发送 Card 2.0 互动卡片，用户在卡片内选择负责人。
3. `card.action.trigger` 通过飞书长连接回到本地桥接器。
4. 桥接器用用户身份将两个待办追加到目标文档。
5. Bot 使用回调 token 将原卡片更新为完成态。

Bot 负责群消息和卡片；用户身份负责用户自己的文档。不要用 Bot 身份假装能访问个人云空间。

## 最小权限

- Bot：`im:message:send_as_bot`、`im:message:readonly`
- 用户：`docx:document:readonly`、`docx:document:write_only`
- 飞书开发者后台：应用 → 事件与回调 → 回调配置，需要启用

应用可用范围还必须覆盖目标群成员，Bot 需要已在目标群内。

## 验证与运行

```powershell
# 1. 检查身份与 card.action.trigger schema
node scripts/feishu/bridge.mjs status

# 2. 只读检查目标文档目录
node scripts/feishu/bridge.mjs fetch-doc --doc "飞书文档URL"

# 3. 默认只 dry-run，不会发送
node scripts/feishu/bridge.mjs send-card `
  --chat-id oc_xxx `
  --doc-url "飞书文档URL"

# 4. 确认群和文档后，真实发送
node scripts/feishu/bridge.mjs send-card `
  --chat-id oc_xxx `
  --doc-url "飞书文档URL" `
  --yes

# 5. 监听卡片提交并写回文档
node scripts/feishu/bridge.mjs listen `
  --doc "飞书文档URL" `
  --doc-url "飞书文档URL" `
  --yes
```

监听器是本地开发桥接器。生产环境应把事件处理迁移到持续运行的服务，并用数据库按 `event_id` 幂等去重；卡片更新 token 有效期为 30 分钟且最多使用两次。

## 模型服务配置

侧边栏只调用同源 `/api/companion`，API Key 不进入扩展。

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.llm-token.cn/v1
AI_MODEL=gpt-5.6-luna
AI_API_KEY=在部署平台中配置，不写入仓库
```

接口兼容 OpenAI Chat Completions，但当前地址是第三方网关，不代表 OpenAI 官方服务。切换模型只需要更换服务端变量；前端协议保持 `{title,rewrite,why,method,risk}` 不变。
