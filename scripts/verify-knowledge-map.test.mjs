import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";
import knowledgeMap from "../js/knowledge-map.js";
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

test("knowledge map is the single taxonomy for six lenses, four hubs and role paths", () => {
  assert.equal(knowledgeMap.hubs.length, 4);
  assert.deepEqual(Object.keys(knowledgeMap.lenses), ["technology", "business", "product", "human", "organization", "systems"]);
  assert.ok(knowledgeMap.roles.length >= 6);
  for (const hub of knowledgeMap.hubs) {
    assert.ok(hub.title);
    assert.ok(hub.href.endsWith(".html"));
    assert.equal(hub.essentials.length, 5);
    assert.ok(hub.agent.length >= 4);
    assert.ok(hub.human.length >= 4);
    assert.ok(hub.sources.some((source) => source[0] === "研究证据"));
  }
});

test("the judgment map and four hubs expose the task-first and 80/20 structure", async () => {
  const files = [
    "../knowledge-map.html",
    "../technology-engineering.html",
    "../business-product.html",
    "../human-design.html",
    "../organization-decision.html"
  ];
  const [mapPage, ...hubPages] = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  assert.match(mapPage, /先说你要(?:<br\s*\/?>)?解决什么/);
  assert.doesNotMatch(mapPage, /role-paths|map-task-form/);
  assert.match(mapPage, /六种判断视角/);
  assert.match(mapPage, /四个知识枢纽/);
  for (const page of hubPages) {
    assert.match(page, /data-hub-id/);
    assert.match(page, /js\/knowledge-map\.js/);
    assert.match(page, /js\/hub-page\.js/);
  }
  const renderer = await readFile(new URL("../js/hub-page.js", import.meta.url), "utf8");
  for (const unit of ["现实决定", "只掌握最关键的 20%", "可以交给 Agent", "必须由人判断", "常见误判", "真实项目", "直接使用的检查表", "完成后沉淀", "证据与来源"]) {
    assert.match(renderer, new RegExp(unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("all ten generated watercolor visuals are raster, bounded and present", async () => {
  const assets = [
    "interdisciplinary-constellation-watercolor.webp",
    "tech-business-product-triangle-watercolor.webp",
    "technology-layers-watercolor.webp",
    "language-tradeoffs-watercolor.webp",
    "business-value-loop-watercolor.webp",
    "product-discovery-loop-watercolor.webp",
    "cognition-design-loop-watercolor.webp",
    "organization-decision-map-watercolor.webp",
    "systems-uncertainty-map-watercolor.webp",
    "role-capability-paths-watercolor.webp"
  ];
  for (const asset of assets) {
    const url = new URL(`../images/product/${asset}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size > 50_000, `${asset} should be a substantive generated image`);
    assert.ok(info.size < 500_000, `${asset} should remain delivery-friendly`);
  }
});

test("local Agent execution preserves interdisciplinary metadata and old scenarios", async () => {
  const previous = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-knowledge-map-local" },
    body: {
      task: "execute_project",
      goal: "为团队选择一套 AI 客服方案",
      scenarioId: "customer",
      context: { diagnosis: { role: "manager", knowledgeLenses: ["business", "technology", "organization"] } },
      solution: {
        title: "AI 客服方案判断",
        steps: ["定义客户结果", "比较技术与成本", "明确人工接管", "验证后再扩大"],
        humanDecision: "预算、风险和上线范围",
        role: "manager",
        knowledgeLenses: ["business", "technology", "organization"],
        humanJudgments: ["客户体验", "预算和风险", "上线范围"],
        agentDelegation: ["检索方案", "整理比较", "生成试点清单"],
        recommendedPath: "目标 → 价值 → 技术 → 风险 → 试点",
        skillCandidate: "AI 客服选型 Skill"
      }
    }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.result.role, "manager");
  assert.deepEqual(body.result.knowledgeLenses, ["business", "technology", "organization"]);
  assert.equal(body.result.humanJudgments.length, 3);
  assert.equal(body.result.agentDelegation.length, 3);
  assert.match(body.result.recommendedPath, /技术/);
  assert.equal(body.result.skillCandidate.name, "AI 客服选型 Skill");
  if (previous) process.env.AI_API_KEY = previous;
});

test("primary interdisciplinary pages contain no SVG content and images use explicit dimensions", async () => {
  const files = ["../knowledge-map.html", "../js/hub-page.js"];
  const contents = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  for (const content of contents) {
    assert.doesNotMatch(content, /<svg|\.svg\b/i);
    assert.match(content, /width="1536"/);
    assert.match(content, /height="1024"/);
  }
  const css = await readFile(new URL("../css/knowledge-map.css", import.meta.url), "utf8");
  assert.match(css, /object-fit:\s*contain/);
}
);

test("career development is person-centered, evidence-aware and connected to the organization hub", async () => {
  const page = await readFile(new URL("../career-direction.html", import.meta.url), "utf8");
  const shell = await readFile(new URL("../js/shell.js", import.meta.url), "utf8");
  const map = await readFile(new URL("../js/knowledge-map.js", import.meta.url), "utf8");
  for (const signal of ["发展型关系网络", "产业真实性", "意愿证据", "微承诺—交付—复盘", "五维机会账本", "退出", "Agent"]) {
    assert.match(page, new RegExp(signal));
  }
  assert.match(page, /pubmed\.ncbi\.nlm\.nih\.gov\/19343074/);
  assert.match(page, /2022-rajkumar\.pdf/);
  assert.match(shell, /career-direction\.html/);
  assert.match(map, /"career-direction\.html": \["organization", "business", "human", "systems"\]/);
  assert.doesNotMatch(page, /<svg\b/i);
});

test("productivity revolutions topic connects history, capital and measurable AI value", async () => {
  const page = await readFile(new URL("../productivity-revolutions.html", import.meta.url), "utf8");
  const shell = await readFile(new URL("../js/shell.js", import.meta.url), "utf8");
  const map = await readFile(new URL("../js/knowledge-map.js", import.meta.url), "utf8");
  const history = await readFile(new URL("../history.html", import.meta.url), "utf8");
  for (const signal of [
    "六个技术时代，七个时间锚点",
    "1776–1777",
    "1882",
    "1981",
    "1991",
    "2007",
    "2022",
    "资本投入",
    "客户付费",
    "全生命周期成本",
    "To B",
    "To G"
  ]) {
    assert.match(page, new RegExp(signal));
  }
  assert.match(shell, /productivity-revolutions\.html/);
  assert.match(map, /"productivity-revolutions\.html": \["business", "systems", "technology", "organization"\]/);
  assert.match(history, /productivity-revolutions\.html/);
  assert.match(page, /productivity-revolutions-watercolor\.webp/);
  assert.match(page, /width="1536" height="1024"/);
  assert.doesNotMatch(page, /<svg\b|\.svg\b/i);
});
