import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const practice = read("practice.html");

test("practice page exposes the approved eight-station route", () => {
  const ids = [
    "map",
    "feishu",
    "ai-roles",
    "collaboration-loops",
    "site",
    "daily",
    "gov",
    "refs",
  ];

  for (const id of ids) {
    assert.match(practice, new RegExp(`<article[^>]+id="${id}"`), `missing #${id}`);
    assert.match(practice, new RegExp(`href="#${id}"`), `missing nav link to #${id}`);
  }
});

test("practice page loads its page-only progressive enhancement", () => {
  assert.match(practice, /<script src="js\/practice\.js"><\/script>/);
});

test("new watercolor assets exist and are referenced with explicit dimensions", () => {
  const assets = [
    "feishu-collaboration-garden.png",
    "ai-feishu-cli-loop.png",
    "ai-coding-launch-route.png",
  ];

  for (const name of assets) {
    assert.equal(existsSync(new URL(`../images/illustrations/${name}`, import.meta.url)), true);
    const tag =
      practice.match(
        new RegExp(`<img[^>]+src="images/illustrations/${name}"[^>]*>`),
      )?.[0] || "";
    assert.match(tag, /width="\d+"/, `missing intrinsic width for ${name}`);
    assert.match(tag, /height="\d+"/, `missing intrinsic height for ${name}`);
  }
});

test("first-principles copy distinguishes Feishu AI, Aily, and collaboration flow", () => {
  assert.match(practice, /飞书 AI 是现成的脑力助手/);
  assert.match(practice, /Aily 是 AI 应用装配台/);
  assert.match(practice, /协同流程是 AI 的落地路径/);
  assert.match(practice, /AI 负责理解和生成/);
  assert.doesNotMatch(practice, /飞书 CLI/);
});

test("six collaboration loops and confirmation boundaries are present", () => {
  const loops = [
    "每日工作简报",
    "会议闭环",
    "企业知识运营",
    "销售跟进",
    "经营周报",
    "AI 应用交付",
  ];

  for (const loop of loops) assert.match(practice, new RegExp(loop));
  assert.match(practice, /人来确认/);
  assert.match(practice, /最小权限/);
});

test("collaboration loops use a scannable input-AI-output-confirmation hierarchy", () => {
  assert.equal((practice.match(/class="workflow-route"/g) || []).length, 6);
  assert.equal((practice.match(/class="workflow-value"/g) || []).length, 6);
  assert.equal((practice.match(/<span>人来确认<\/span>/g) || []).length, 6);
  assert.match(practice, /每个闭环的阅读方式/);
  assert.match(practice, /工作现场/);
  assert.match(practice, /理解与整理/);
  assert.match(practice, /落回飞书/);
});

test("AI Coding route uses five stages and corrects absolute claims", () => {
  const stages = [
    "选工具，也选名字",
    "在本地做出第一版",
    "给项目装上安全绳",
    "选择合适的上线方式",
    "上线后进入迭代",
  ];

  for (const stage of stages) assert.match(practice, new RegExp(stage));
  assert.match(practice, /不一定需要买服务器/);
  assert.match(practice, /中国大陆服务器/);
  assert.doesNotMatch(practice, /所有未备案域名都会被运营商拦截/);
  assert.doesNotMatch(practice, /自家的 Agent (一定|肯定)更适合/);
});

test("community tools are labeled and external links are hardened", () => {
  assert.match(practice, /neat-freak[^<]*社区/);
  assert.match(practice, /MIT/);

  const externalLinks = [
    ...practice.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g),
  ];
  assert.ok(externalLinks.length > 0);
  for (const [link] of externalLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("attention and workflow components have dedicated responsive styles", () => {
  const css = read("css/styles.css");
  const classes = [
    "attention-lead",
    "capability-map",
    "capability-card",
    "role-triad",
    "workflow-grid",
    "workflow-card",
    "problem-filter",
    "phase-roadmap",
    "phase-card",
    "boundary-note",
    "copy-block",
    "iteration-loop",
  ];

  for (const name of classes) {
    assert.match(css, new RegExp(`\\.${name}\\b`), `missing .${name}`);
  }
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /\.workflow-route\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);

  const narrowPhoneStart = css.indexOf("@media (max-width: 390px)");
  const enterpriseStart = css.indexOf("/* Enterprise practice");
  const narrowPhoneBlock = css.slice(narrowPhoneStart, enterpriseStart);
  assert.match(narrowPhoneBlock, /\}\s*$/, "390px media query must close before enterprise styles");
});

test("practice page uses a raster favicon instead of inline SVG", () => {
  assert.match(practice, /<link rel="icon" type="image\/png"/);
  assert.doesNotMatch(practice, /data:image\/svg\+xml/);
});

test("practice interaction script preserves accessible button state", () => {
  const js = read("js/practice.js");
  assert.match(js, /function setProblemFilter\(filter\)/);
  assert.match(js, /setAttribute\("aria-pressed"/);
  assert.match(js, /classList\.toggle\("is-muted"/);
  assert.match(js, /navigator\.clipboard\.writeText/);
  assert.match(js, /复制失败/);
});

test("global entry points describe and link the interdisciplinary judgment system", () => {
  const shell = read("js/shell.js");
  const knowledgeMap = read("js/knowledge-map.js");
  const index = read("index.html");
  const readme = read("README.md");

  for (const hub of ["技术与工程", "商业与产品", "人脑与设计", "组织与决策"]) {
    assert.match(knowledgeMap, new RegExp(hub));
  }
  assert.match(shell, /技术与系统节点/);
  assert.match(shell, /商业、产品与行业节点/);
  assert.match(shell, /人、组织与表达节点/);
  assert.match(shell, /职业发展与引路人网络/);
  assert.match(shell, /原有 AI 结构地图/);
  assert.match(shell, /跨学科判断力地图/);
  assert.match(shell, /knowledge-map\.html/);
  assert.match(index, /内容收敛到四个知识枢纽/);
  assert.match(index, /技术判断力/);
  assert.match(index, /业务判断力/);
  assert.match(index, /产品判断力/);
  assert.match(index, /从想法到上线/);
  assert.match(readme, /AI/);
  assert.match(readme, /飞书 CLI/);
  assert.match(readme, /AI Coding 从想法到上线/);
});

test("practice page contains no secret-shaped examples or unfinished markers", () => {
  assert.doesNotMatch(
    practice,
    /\b(sk-[A-Za-z0-9_-]{12,}|cli_[a-z0-9]{12,}|ou_[a-z0-9]{12,}|oc_[a-z0-9]{12,})\b/,
  );
  assert.doesNotMatch(practice, /\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  const unfinished = [
    ["TO", "DO"].join(""),
    ["TB", "D"].join(""),
    "待" + "补充",
    "占位" + "内容",
  ];
  for (const marker of unfinished) {
    assert.doesNotMatch(practice, new RegExp(marker));
  }
});

test("new figures have non-empty alt text and lazy loading outside the hero", () => {
  const figures = [
    "feishu-collaboration-garden.png",
    "ai-feishu-cli-loop.png",
    "ai-coding-launch-route.png",
  ];

  for (const name of figures) {
    const tag =
      practice.match(
        new RegExp(`<img[^>]+src="images/illustrations/${name}"[^>]*>`),
      )?.[0] || "";
    assert.match(tag, /alt="[^"]{8,}"/);
    assert.match(tag, /loading="lazy"/);
  }
});
