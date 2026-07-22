import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import companionModule from "../api/companion.js";

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    end(value = "") { this.body = value; }
  };
}

test("model health does not expose secrets", async () => {
  const previous = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  const req = { method: "GET", headers: { origin: "http://localhost:4173" } };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.configured, false);
  assert.equal(body.model, "gpt-5.6-luna");
  assert.equal(body.provider, "openai-compatible");
  assert.equal("apiKey" in body, false);
  if (previous) process.env.AI_API_KEY = previous;
});

test("model endpoint rejects missing configuration without upstream calls", async () => {
  const previous = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  const req = { method: "POST", headers: {}, body: { text: "测试", mode: "clarify" } };
  const res = responseMock();
  await companionModule(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(JSON.parse(res.body).error, "model_not_configured");
  if (previous) process.env.AI_API_KEY = previous;
});

test("model endpoint normalizes a structured upstream response", async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.AI_API_KEY = "test-key-not-a-real-secret";
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '{"title":"先明确对象","rewrite":"面向项目负责人说明目标。","why":"对象明确后信息更容易取舍。","method":"先定对象，再写内容。","risk":""}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 }
    })
  });
  const req = { method: "POST", headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-success" }, body: { text: "说明项目目标", mode: "clarify" } };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.result.title, "先明确对象");
  assert.equal(body.meta.outputTokens, 20);
  globalThis.fetch = previousFetch;
  if (previousKey) process.env.AI_API_KEY = previousKey;
  else delete process.env.AI_API_KEY;
});

test("extension keeps model credentials server-side", async () => {
  const [manifestText, sidepanel, sidepanelHtml, newtabHtml, installHtml] = await Promise.all([
    readFile(new URL("../manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../extension/sidepanel.js", import.meta.url), "utf8"),
    readFile(new URL("../extension/sidepanel.html", import.meta.url), "utf8"),
    readFile(new URL("../extension/newtab.html", import.meta.url), "utf8"),
    readFile(new URL("../install.html", import.meta.url), "utf8")
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.chrome_url_overrides.newtab, "extension/newtab.html");
  assert.equal(manifest.side_panel.default_path, "extension/sidepanel.html");
  assert.match(manifestText, /ai-knowledge-sigma\.vercel\.app/);
  assert.doesNotMatch(sidepanel, /AI_API_KEY|Bearer\s+[A-Za-z0-9_-]{12,}/);
  assert.match(sidepanel, /模型暂不可用/);
  assert.doesNotMatch(sidepanelHtml, /textarea|contenteditable|data-mode/);
  assert.doesNotMatch(newtabHtml, /textarea|input|form/);
  assert.match(sidepanel, /capture-page-context/);
  assert.match(installHtml, /ai-companion-extension\.zip/);
});

test("primary product surfaces contain no SVG image content", async () => {
  const files = ["../index.html", "../companion.html", "../install.html", "../learning.html", "../glossary.html", "../extension/newtab.html", "../extension/sidepanel.html"];
  const contents = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  for (const content of contents) assert.doesNotMatch(content, /<svg|\.svg\b/i);
});

test("previous product slogan is restored", async () => {
  const [home, hub] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../companion.html", import.meta.url), "utf8")
  ]);
  assert.match(home, /用你已经知道的/);
  assert.match(home, /连接 AI 新世界/);
  assert.match(hub, /用你已经知道的/);
});

test("installed product links open their native browser surfaces", async () => {
  const [hub, bridge, worker] = await Promise.all([
    readFile(new URL("../companion.html", import.meta.url), "utf8"),
    readFile(new URL("../extension/site-bridge.js", import.meta.url), "utf8"),
    readFile(new URL("../extension/service-worker.js", import.meta.url), "utf8")
  ]);
  assert.match(hub, /data-companion-surface="newtab"/);
  assert.match(hub, /data-companion-surface="sidepanel"/);
  assert.match(bridge, /open-newtab/);
  assert.match(worker, /chrome\.tabs\.create/);
});

test("Feishu Card 2.0 has one primary submit and a document link", async () => {
  const card = JSON.parse(await readFile(new URL("../feishu/cards/meeting-actions.json", import.meta.url), "utf8"));
  assert.equal(card.schema, "2.0");
  const form = card.body.elements.find((item) => item.tag === "form");
  assert.ok(form);
  assert.equal(form.elements.filter((item) => item.type === "primary_filled").length, 1);
  assert.equal(form.elements.filter((item) => item.tag === "select_person" && item.required).length, 2);
  assert.ok(JSON.stringify(card).includes("__DOC_URL__"));
});
