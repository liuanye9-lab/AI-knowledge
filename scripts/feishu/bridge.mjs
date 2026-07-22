#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const cardDir = path.join(repoRoot, "feishu", "cards");
const isWindows = process.platform === "win32";
const cliExecutable = isWindows ? process.execPath : "lark-cli";
const cliPrefix = isWindows
  ? [path.join(process.env.APPDATA || "", "npm", "node_modules", "@larksuite", "cli", "scripts", "run.js")]
  : [];

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const options = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (rest[index + 1] && !rest[index + 1].startsWith("--")) options[key] = rest[++index];
    else options[key] = true;
  }
  return options;
}

function runCli(args, { inherit = true } = {}) {
  const result = spawnSync(cliExecutable, [...cliPrefix, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    shell: false,
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: "1",
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: "1"
    }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `lark-cli exited ${result.status}`);
  return result.stdout;
}

async function loadCard(name, docUrl) {
  const raw = await readFile(path.join(cardDir, name), "utf8");
  return JSON.parse(raw.replaceAll("__DOC_URL__", docUrl));
}

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildDocumentXml(form) {
  const now = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date());
  return [
    `<h2>会议行动记录 · ${escapeXml(now)}</h2>`,
    "<p>以下行动由会议卡片确认后写入，责任人与截止时间仍需团队在执行中持续核对。</p>",
    `<checkbox done="false">整理并分享客户反馈摘要 · <cite type="user" user-id="${escapeXml(form.owner_1)}"></cite> · 截止：本周五 · 完成标准：项目群可查看摘要</checkbox>`,
    `<checkbox done="false">确认试点用户名单并发起访谈 · <cite type="user" user-id="${escapeXml(form.owner_2)}"></cite> · 截止：下周三 · 完成标准：名单确认并发出邀请</checkbox>`,
    "<p><b>方法：</b>任务最好同时包含负责人、截止时间和完成标准。</p>"
  ].join("");
}

async function status() {
  runCli(["auth", "status", "--json", "--verify"]);
  runCli(["event", "schema", "card.action.trigger", "--json"]);
}

async function fetchDoc(options) {
  if (!options.doc) throw new Error("缺少 --doc <飞书文档 URL 或 token>");
  runCli(["docs", "+fetch", "--doc", options.doc, "--scope", "outline", "--max-depth", "2", "--detail", "simple", "--as", "user"]);
}

async function sendCard(options) {
  if (!options.chatId) throw new Error("缺少 --chat-id oc_xxx");
  if (!options.docUrl) throw new Error("缺少 --doc-url <飞书文档 URL>");
  const card = await loadCard("meeting-actions.json", options.docUrl);
  const args = ["im", "+messages-send", "--chat-id", options.chatId, "--msg-type", "interactive", "--content", JSON.stringify(card), "--as", "bot"];
  if (!options.yes) args.push("--dry-run");
  runCli(args);
  if (!options.yes) console.error("\n当前仅预览请求。确认目标群和文档后，加 --yes 才会真实发送。");
}

async function updateCard(token, docUrl) {
  const card = await loadCard("meeting-actions-done.json", docUrl);
  runCli(["api", "POST", "/open-apis/interactive/v1/card/update", "--as", "bot", "--data", JSON.stringify({ token, card })]);
}

async function consume(options) {
  if (!options.doc) throw new Error("缺少 --doc <飞书文档 URL 或 token>");
  if (!options.docUrl) throw new Error("缺少 --doc-url <卡片打开用的文档 URL>");
  if (!options.yes) throw new Error("监听器会把确认结果追加到真实文档；核对目标后请显式添加 --yes");

  const child = spawn(cliExecutable, [...cliPrefix, "event", "consume", "card.action.trigger", "--as", "bot"], {
    cwd: repoRoot,
    shell: false,
    stdio: ["inherit", "pipe", "inherit"],
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: "1",
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: "1"
    }
  });
  const seen = new Set();
  const lines = readline.createInterface({ input: child.stdout });

  for await (const line of lines) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (!event.event_id || seen.has(event.event_id) || !event.form_value) continue;
    seen.add(event.event_id);
    let form;
    try { form = JSON.parse(event.form_value); } catch { continue; }
    if (!form.owner_1 || !form.owner_2) continue;

    const xml = buildDocumentXml(form);
    runCli(["docs", "+update", "--doc", options.doc, "--command", "append", "--content", xml, "--as", "user"]);
    if (event.token) await updateCard(event.token, options.docUrl);
    console.error(`[bridge] 已处理事件 ${event.event_id}，文档与卡片状态已更新。`);
  }

  const exitCode = await new Promise((resolve) => child.on("close", resolve));
  process.exitCode = exitCode || 0;
}

function help() {
  console.log(`AI 伴学 · 飞书 CLI 桥接器

node scripts/feishu/bridge.mjs status
node scripts/feishu/bridge.mjs fetch-doc --doc <URL或token>
node scripts/feishu/bridge.mjs send-card --chat-id oc_xxx --doc-url <URL> [--yes]
node scripts/feishu/bridge.mjs listen --doc <URL或token> --doc-url <URL> --yes

send-card 默认 dry-run；listen 必须显式 --yes。`);
}

const options = parseArgs(process.argv.slice(2));
try {
  if (options.command === "status") await status();
  else if (options.command === "fetch-doc") await fetchDoc(options);
  else if (options.command === "send-card") await sendCard(options);
  else if (options.command === "listen") await consume(options);
  else help();
} catch (error) {
  console.error(`[bridge] ${error.message}`);
  process.exitCode = 1;
}
