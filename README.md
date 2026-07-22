# AI 伴学层 + AI 通识知识库

产品主线不再是课程或题库，而是嵌入高频工作入口的轻量伴学体验。知识库保留为需要时才打开的深度底座。

## 三个主要界面

1. `extension/newtab.html`：新标签页，每天自然看见，只问当前要推进的事
2. `extension/sidepanel.html`：浏览器侧边栏，读取选中文字并只给一个关键建议
3. `feishu-companion.html`：飞书工作卡片，在会议与协作结果中补齐行动信息

统一链路：真实任务 → 一个建议 → 一键采用 → 一句解释 → 留下方法 → 相似场景再出现。

## 加载 Chrome 扩展原型

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 选择「加载已解压的扩展程序」
4. 选择本仓库根目录（包含 `manifest.json`）

扩展使用 Manifest V3，只申请 `activeTab`、`contextMenus`、`scripting`、`sidePanel` 与 `storage`。它不会静默读取所有网页；只有用户主动选择文字或点击读取时才获取当前上下文。模型请求通过服务端网关发送，未配置或暂不可用时自动回落到本地方法。

## 大模型接入

服务端接口位于 `api/companion.js`，浏览器扩展不会保存模型密钥。当前默认使用第三方 OpenAI-compatible 网关与 `gpt-5.6-luna`：

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.llm-token.cn/v1
AI_MODEL=gpt-5.6-luna
AI_API_KEY=只在 Vercel 等服务端环境中配置
```

接口使用 OpenAI-compatible Chat Completions 协议。该地址不是 OpenAI 官方接口；正式处理企业敏感资料前，应单独核验供应商的数据保留、隐私、稳定性与计费。模型不可用时，侧边栏会明确降级为本地方法，不阻断用户任务。

## 飞书文档 + Bot

本地桥接器位于 `scripts/feishu/bridge.mjs`，Card 2.0 模板位于 `feishu/cards/`。完整流程和权限说明见 `docs/feishu-companion-integration.md`。

```bash
node scripts/feishu/bridge.mjs status
node scripts/feishu/bridge.mjs send-card --chat-id oc_xxx --doc-url "飞书文档URL"
```

发送默认是 dry-run；只有显式增加 `--yes` 才会向真实群聊发送。卡片提交后，通过 `card.action.trigger` 将行动项追加到指定文档并更新原卡片状态。

## 知识底座

1. `learning.html` 了解旧知识连接、主动提取与间隔复现的设计依据
2. `fundamentals.html` 从 AI 基础到使用、验收的通识六站
3. `practice.html` 飞书 CLI、企业 ToB 提效与 AI Coding 从想法到上线
4. `feishu-ai.html` 飞书 AI 生态全景；`automotive.html` 汽车制造行业专题
5. 需要时：`glossary.html` / `boundaries.html` / `embodied.html` …

## 企业专栏内容

- 飞书生态全景：知识问答、智能会议纪要、Aily、多维表格 AI、妙搭/低代码、开放平台与治理
- 汽车制造：VOC、IPD、APQP、供应商、工厂异常、质量、销售售后和 90 天试点
- 飞书 CLI：会议、知识、销售、经营和应用交付的六个价值闭环
- AI Coding 从想法到上线：工具、Plan、本地验收、Git/测试、部署、备案与运维
- 各岗位日常提效、数据安全、权限、成本与人工确认
- 引用：WaytoAGI、Datawhale、Prompting Guide、HF Learn、论文与飞书官网  

## 本地打开

```bash
python -m http.server 8080
```
