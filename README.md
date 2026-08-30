# AI 伴学层 + AI 通识知识库

产品主线不再是课程或题库，而是从真实任务进入能力地图，再按需要打开知识枢纽。知识库是需要时才打开的深度底座。

## 两个主要界面

1. `extension/newtab.html`：新标签页，保留常用页面与一个能力地图入口
2. `knowledge-map.html`：输入真实任务后，直接返回最相关的知识判断路径

统一知识主线：认识 AI → 判断何时适合用 → 在真实任务中使用 → 验证结果与边界 → 沉淀为个人/团队方法 → 行业实践。

统一路径是：打开 → 到达 → 判断 → 打开相应知识枢纽 → 在真实场景中试一次 → 人工确认后沉淀方法。

## 安装 Chrome 产品

用户入口是 `install.html`。上架 Chrome Web Store 后，只需把页面的 `data-store-url` 填成商店地址，按钮就会直接跳到浏览器安装确认；安装完成后，Manifest V3 会自动接管新标签页。

当前可下载 `downloads/ai-companion-extension.zip` 作为企业内测包：

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 选择「加载已解压的扩展程序」
4. 选择解压后的目录（包含 `manifest.json`）

扩展使用 Manifest V3，只申请 `topSites` 与 `storage`，用于在新标签页展示常用页面。它不读取当前网页、不申请本机桥接权限，也不连接飞书 CLI。

## 大模型接入

服务端接口位于 `api/companion.js`，浏览器扩展不会保存模型密钥。当前默认使用第三方 OpenAI-compatible 网关与 `gpt-5.6-luna`：

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.llm-token.cn/v1
AI_MODEL=gpt-5.6-luna
AI_API_KEY=只在 Vercel 等服务端环境中配置
```

接口使用 OpenAI-compatible Chat Completions 协议。该地址不是 OpenAI 官方接口；正式处理企业敏感资料前，应单独核验供应商的数据保留、隐私、稳定性与计费。

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
3. `practice.html` 飞书协同自动化、企业 ToB 提效与 AI Coding 从想法到上线
4. `feishu-ai.html` 六阶段知识主线与飞书 AI 生态场景；`automotive.html` 行业发现与 AI 方案专题
5. `cognitive-management-ai.html` 脑科学、认知科学、管理学与 Agent 协作专题
6. `social-intelligence.html` 社会认知、职场沟通、关系协作、价值表达与边界专题
7. `structured-expression.html` 结构化表达、金字塔思维、Toulmin 论证与 Agent 协作专题
8. 需要时：`glossary.html` / `boundaries.html` / `embodied.html` …

## 企业专栏内容

- 飞书生态全景：知识问答、智能会议纪要、Aily、多维表格 AI、妙搭/低代码、开放平台与治理
- 汽车制造：VOC、IPD、APQP、供应商、工厂异常、质量、销售售后和 90 天试点
- 组织认知：注意力、工作记忆、决策权、组织记忆、人机协作闭环和 Skill 沉淀
- 社会认知：理解对象、翻译价值、观点结构、职场关系、人情边界与 AI 沟通复盘
- 结构化表达：自下而上归纳、自上而下交付、SCQA、MECE、论证检查与多版本表达 Skill
- 飞书协同自动化：会议、知识、销售、经营和应用交付的六个价值闭环
- AI Coding 从想法到上线：工具、Plan、本地验收、Git/测试、部署、备案与运维
- 各岗位日常提效、数据安全、权限、成本与人工确认
- 引用：WaytoAGI、Datawhale、Prompting Guide、HF Learn、论文与飞书官网  

## 学习卡片

- [从克制到持续学习：梁文锋相关语录的战略逻辑](docs/knowledge-cards/2026-07-22-deepseek-strategic-restraint.md)：区分二手语录、逻辑推导与项目应用，讨论 AGI 主线、持续学习、成本效率、开源和组织战略。

## 本地打开

```bash
python -m http.server 8080
```
