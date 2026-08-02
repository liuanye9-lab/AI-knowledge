# AI 伴学 Agent 架构审计与升级

日期：2026-07-22

## 一句话结论

旧结构把新标签页、侧边栏和飞书做成三个互相跳转的页面，用户仍要自己理解“下一步做什么”。新结构把它们降为三个薄入口，由本机 Agent Gateway 统一接收上下文、生成结果、调用工具并处理权限。

## 证据与问题

1. 飞书 CLI 已安装并通过 `lark-cli doctor`，浏览器却使用 `ai-companion://` 自定义协议；真正失败的是浏览器到本机的连接，而不是 CLI。
2. Chrome 实际加载的是 `E:\插件` 旧副本，不是当前项目目录，因此源代码更新不会自动反映到浏览器。
3. 旧侧边栏输出“请把以下内容……”一类提示词，让用户承担第二次复制、选择工具和判断结果的成本，不是完整 Agent。
4. OpenClaw 和 Codex 均已安装，但 OpenClaw 尚未初始化 Gateway；Codex 可作为复杂代码执行器，不应承担每一次网页解释。

## 新运行架构

```text
新标签页（发现与回忆）  侧边栏（当前任务）  飞书（协同与沉淀）
              \          |          /
                本机 Agent Bridge
                        |
       上下文路由 · 学习策略 · 会话记忆 · 权限审批
          /             |                 \
   飞书 CLI Skills   OpenClaw Gateway    Codex Agent
   文档/任务/知识库   渠道/记忆/定时任务   代码/仓库/复杂执行
```

## 三个入口的唯一职责

### 新标签页

每天自然出现，负责“去哪里”和“想起上次方法”。它不承载完整对话，也不要求用户学习产品导航。

### 侧边栏

只在用户面对一页真实内容时主动打开，负责三件事：看懂这页、写成一版、检查一下。每次先给直接结果，再用一句话揭示本次 AI 能力，形成无感迁移学习。

### 飞书

负责多人协作和知识沉淀，不在网页里模拟飞书。浏览器通过 Chrome Native Messaging 连接本机 Agent，Agent 再打开飞书 CLI，并把当前页面和结果带过去。

## 权限边界

- 默认只读当前活动页，且只在用户主动打开侧边栏时读取。
- 浏览器不直接获得系统命令权限；所有本机调用进入 Native Messaging Host。
- 文档写入、发消息、创建任务等高影响动作仍在 CLI/Agent 层确认。
- OpenClaw 按能力注册表逐项启用，不默认开放全部 Skills。
- Codex 只在代码、仓库和复杂执行任务中被路由调用。

## 已实现

- 侧边栏从提示词改为直接结果，并新增“你刚刚用到的 AI 能力”。
- 模式改为看懂、写成、检查，保持零输入和一步操作。
- 新增 Windows Native Messaging Agent Bridge 与自动安装器。
- 本机桥接已识别飞书 CLI 与 Codex；OpenClaw 未初始化时明确显示未连接。
- 已同步 Chrome 当前加载的 `E:\插件` 副本，避免项目与浏览器版本分叉。

## 下一阶段

1. 初始化独立的 OpenClaw `ai-companion` Agent、Gateway 与审批白名单。
2. 使用飞书官方 OpenClaw 插件接入消息、文档、任务和知识库。
3. 增加会话记忆：只保存用户确认的方法和协作结果，不保存整页隐私内容。
4. 把 Codex app-server 接为专业执行器，并保留逐次审批和可追踪日志。

## 采用与参考

- Chrome Side Panel：https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome Native Messaging：https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
- 飞书官方 CLI：https://github.com/larksuite/cli
- 飞书官方 OpenClaw 插件：https://github.com/larksuite/openclaw-lark
- OpenClaw 架构与审批：https://docs.openclaw.ai/architecture 、https://docs.openclaw.ai/tools/exec-approvals
- Codex：https://github.com/openai/codex
- Codex app-server：https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md
