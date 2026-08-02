# 三入口低门槛体验审计

## Audit scope

- 产品：AI 伴学新标签页、浏览器侧边栏、飞书入口
- 用户目标：不理解产品、不学习提示词、不经过说明页，直接到达当前目的
- 证据：2026-07-22 在已加载扩展的 Chrome 中重新截取

## 原流程发现

1. 新标签页同时承担搜索、AI 意图选择、学习边界和产品流程说明。视觉清楚，但用户必须先判断自己该点哪一种 AI 操作。
2. 侧边栏用“这个知识怎么用 AI”组织结果，教育逻辑完整，但使用时机不够具体，且复制、记住方法、重试、进入知识体系形成多个后续选择。
3. 飞书入口停在网页知识库，用户仍需理解知识结构，不能直接进入本机 CLI 和飞书内部协同。

## 完成后的流程

1. 新标签页：打开即显示搜索、网址输入和浏览器本地常用页面。AI 不主动占据主流程。
2. 侧边栏：只解决“当前网页接下来怎么处理”，默认提取下一步，并提供快速看懂、检查风险两种单击模式。
3. 飞书：所有主要入口使用 `ai-companion://feishu/...`，由本机启动器打开飞书 CLI；Windows 已注册，macOS 提供一次性安装脚本。

## UX 与可访问性结论

- 主要选择数量下降，三个入口各自只有一个核心任务。
- 新标签页保留原生搜索心智，常用页面只在本地读取，不上传浏览记录。
- 侧边栏无文本输入，模式按钮具有可读名称、选中视觉状态和至少 42px 高度。
- 飞书高影响写入没有被自动执行，仍交由 CLI 的权限和确认机制处理。
- 截图和 DOM 可确认阅读顺序、名称和响应式重排；完整键盘遍历、屏幕阅读器播报和外部协议系统弹窗仍需在目标设备上人工验证。

## Evidence

- 原新标签页：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/01-newtab.png`
- 原侧边栏：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/02-sidepanel.png`
- 原飞书入口：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/03-feishu.png`
- 新标签页：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/newtab-direct.png`
- 新侧边栏：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/sidepanel-action.png`
- 新飞书入口：`C:/Users/Lay/.codex/visualizations/2026/07/22/entry-friction-audit/feishu-cli-entry-final-v2.png`
