# Enterprise Practice Feishu + AI Coding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `practice.html` into a beginner-friendly, watercolor-style visual guide covering Feishu product boundaries, six valuable Feishu CLI workflows, and an AI Coding path from idea to safe production operation.

**Architecture:** Keep the existing no-build static-site architecture. Put editorial content in semantic HTML, shared visual rules in `css/styles.css`, page-only progressive enhancement in a new `js/practice.js`, and static regression checks in a dependency-free Node test file. Generate three watercolor illustrations as attention anchors; keep exact labels and factual information in HTML rather than inside images.

**Tech Stack:** HTML5, CSS custom properties and responsive layout, vanilla JavaScript, Node.js built-in test runner, JPEG illustrations generated with the repository's image-generation workflow.

## Global Constraints

- Preserve the existing low-saturation watercolor, paper texture, hand-drawn line, irregular rounded-corner visual language.
- Do not add a frontend framework, package manager dependency, backend, database, or build step.
- Explain concepts with the five-part first-principles pattern: why, input, transformation, output, boundary.
- Put one primary attention anchor in each section: conclusion first, visual structure second, expandable detail third.
- Use `<strong>` for no more than one key judgment per normal paragraph; never bold whole paragraphs.
- Keep normal paragraphs short and put volatile product details or CLI commands in `<details>`.
- Treat Feishu product capabilities as version-, tenant-, scope-, and permission-dependent.
- Mark external writes such as sending messages, sending email, changing business data, inviting attendees, and publishing apps as confirmation-required.
- Never include real tokens, App IDs, user IDs, chat IDs, email addresses, IP addresses, or credentials in copyable examples.
- Use official sources for product capability and compliance claims; label `neat-freak` as an optional MIT-licensed community tool.
- Core content must remain readable when JavaScript is disabled.
- All new external links open in a new tab with `target="_blank" rel="noopener noreferrer"`.

---

## File Structure

- `practice.html`: owns all reader-facing enterprise practice content and semantic section order.
- `css/styles.css`: owns reusable attention, capability, workflow, roadmap, boundary, source, and responsive presentation rules.
- `js/practice.js`: owns only the problem selector, section highlighting, and copy-button progressive enhancement for this page.
- `js/shell.js`: owns global sidebar labels and deep links.
- `index.html`: owns the home-page entry copy for the upgraded enterprise practice guide.
- `images/illustrations/feishu-collaboration-garden.png`: watercolor attention anchor for the Feishu capability map.
- `images/illustrations/ai-feishu-cli-loop.png`: watercolor attention anchor for the human–AI–CLI–Feishu loop.
- `images/illustrations/ai-coding-launch-route.png`: watercolor attention anchor for the five-stage AI Coding journey.
- `scripts/verify-practice.test.mjs`: dependency-free static regression checks for content structure, accessibility hooks, source hygiene, and asset references.
- `README.md`: owns the concise repository-level description of the upgraded practice path.

---

### Task 1: Lock the New Page Contract with Static Tests

**Files:**
- Create: `scripts/verify-practice.test.mjs`
- Test: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: repository-root HTML, CSS, JavaScript, and image files.
- Produces: a Node test suite invoked with `node --test scripts/verify-practice.test.mjs`; later tasks extend this same file with focused tests.

- [ ] **Step 1: Confirm the built-in test runner is available**

Run:

```powershell
node --version
```

Expected: a semantic version and exit code `0`.

- [ ] **Step 2: Create the initial failing structure tests**

Create `scripts/verify-practice.test.mjs` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const practice = read("practice.html");

test("practice page exposes the approved eight-station route", () => {
  const ids = [
    "map",
    "feishu",
    "ai-cli",
    "cli-loops",
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
    const tag = practice.match(
      new RegExp(`<img[^>]+src="images/illustrations/${name}"[^>]*>`),
    )?.[0] || "";
    assert.match(tag, /width="\d+"/, `missing intrinsic width for ${name}`);
    assert.match(tag, /height="\d+"/, `missing intrinsic height for ${name}`);
  }
});
```

- [ ] **Step 3: Run the tests and verify they fail for the intended reasons**

Run:

```powershell
node --test scripts/verify-practice.test.mjs
```

Expected: failures mentioning missing `#ai-cli`, `#cli-loops`, `js/practice.js`, or watercolor assets. There must be no syntax error in the test file.

- [ ] **Step 4: Commit the executable contract**

```powershell
git add scripts/verify-practice.test.mjs
git commit -m "test: define enterprise practice page contract"
```

---

### Task 2: Generate and Curate the Three Watercolor Attention Anchors

**Files:**
- Create: `images/illustrations/feishu-collaboration-garden.png`
- Create: `images/illustrations/ai-feishu-cli-loop.png`
- Create: `images/illustrations/ai-coding-launch-route.png`

**Interfaces:**
- Consumes: the visual constraints in `docs/superpowers/specs/2026-07-20-enterprise-practice-feishu-ai-coding-design.md` and the color language in `css/styles.css`.
- Produces: three wide PNG illustrations with no baked-in labels, ready for semantic figures in Task 3. HTML intrinsic dimensions must match each generated file's actual pixel dimensions.

- [ ] **Step 1: Read the image-generation skill before generating**

Read the complete `imagegen` skill and follow its board/generation workflow if the current environment requires one.

- [ ] **Step 2: Generate the Feishu collaboration garden**

Use this exact creative brief:

```text
16:9 editorial watercolor illustration on warm white textured paper. A calm collaborative garden arranged like a gentle workplace map: a document desk, a bookshelf, a meeting table, a task board, a calendar, and a structured data table connected by soft hand-painted paths. Muted sage green, dusty blue, clay, pale lavender, and warm gray. Friendly for adult beginners, airy negative space, subtle pencil outlines, tactile paper grain. No logos, no readable text, no UI screenshots, no neon, no glassmorphism, no photorealism. Composition must remain legible when cropped on mobile.
```

Save the curated result as `images/illustrations/feishu-collaboration-garden.png`. Preserve the image generator's native wide aspect ratio instead of resizing it with a separate image editor.

- [ ] **Step 3: Generate the human–AI–CLI–Feishu loop**

Use this exact creative brief:

```text
16:9 editorial watercolor illustration on warm white textured paper. A clear circular workflow: a thoughtful person states a goal, a soft abstract AI mind interprets it, a small command-line toolbench performs careful actions across documents, messages, calendar, tasks, meetings and business records, then results return to the person for review. Use arrows made from hand-painted brush paths, but include no words or symbols that need reading. Muted sage, gray-blue, clay and pale lavender, generous whitespace, subtle pencil linework, calm and trustworthy rather than futuristic. No logos, no readable text, no glowing cyber effects, no photorealism.
```

Save the curated result as `images/illustrations/ai-feishu-cli-loop.png`. Preserve the image generator's native wide aspect ratio instead of resizing it with a separate image editor.

- [ ] **Step 4: Generate the AI Coding launch route**

Use this exact creative brief:

```text
16:9 editorial watercolor illustration on warm white textured paper. A beginner-friendly journey with five visual stopping points connected by one flowing route: naming and a domain signpost, a local project folder and planning notebook, a Git safety rope around a code box, a small website being launched to the cloud, and a quiet operations desk with monitoring gauges and iteration notes. Muted sage green, dusty blue, clay, sand and pale lavender. Clean negative space, hand-painted paper texture, soft pencil outlines, warm human feeling. No readable text, no brand logos, no neon, no glassmorphism, no photorealism.
```

Save the curated result as `images/illustrations/ai-coding-launch-route.png`. Preserve the image generator's native wide aspect ratio instead of resizing it with a separate image editor.

- [ ] **Step 5: Inspect every image at full detail**

Use the local image viewer on all three files. Verify:

- each file uses a wide composition, and its actual pixel dimensions are recorded for the later HTML `width` and `height` attributes;
- there is no accidental readable text or recognizable third-party logo;
- the central subject remains clear at thumbnail size;
- the palette is consistent with existing `viz-enterprise-ai.jpg`;
- no image relies on red/green alone to communicate meaning.

Regenerate only the failed asset if any check fails.

- [ ] **Step 6: Run the asset existence part of the tests**

Run:

```powershell
node --test --test-name-pattern "watercolor assets exist" scripts/verify-practice.test.mjs
```

Expected: the existence assertions pass; HTML-reference assertions still fail until Task 3.

- [ ] **Step 7: Commit the curated illustrations**

```powershell
git add images/illustrations/feishu-collaboration-garden.png images/illustrations/ai-feishu-cli-loop.png images/illustrations/ai-coding-launch-route.png
git commit -m "feat: add enterprise practice watercolor illustrations"
```

---

### Task 3: Rewrite the Enterprise Practice Page as Eight Attention-Layered Stations

**Files:**
- Modify: `practice.html`
- Modify: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: the three exact image paths from Task 2 and existing shared classes such as `station`, `station-label`, `pyramid`, `you-box`, `source-near`, `source-chip`, and `spine-nav`.
- Produces: semantic hooks `#map`, `#feishu`, `#ai-cli`, `#cli-loops`, `#site`, `#daily`, `#gov`, and `#refs`; data hooks `data-problem-filter`, `data-problem`, and `data-copy-command` for Task 5.

- [ ] **Step 1: Extend tests for approved copy and safety markers**

Append to `scripts/verify-practice.test.mjs`:

```js
test("first-principles copy distinguishes Feishu AI, Aily, and CLI", () => {
  assert.match(practice, /飞书 AI 是现成的脑力助手/);
  assert.match(practice, /Aily 是 AI 应用装配台/);
  assert.match(practice, /飞书 CLI 是 AI 的操作手/);
  assert.match(practice, /AI 负责理解和生成/);
});

test("six CLI value loops and confirmation boundaries are present", () => {
  const loops = [
    "每日工作简报",
    "会议闭环",
    "企业知识运营",
    "销售跟进",
    "经营周报",
    "AI 应用交付",
  ];

  for (const loop of loops) assert.match(practice, new RegExp(loop));
  assert.match(practice, /写入前确认/);
  assert.match(practice, /最小权限/);
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

  const externalLinks = [...practice.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g)];
  assert.ok(externalLinks.length > 0);
  for (const [link] of externalLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }
});
```

- [ ] **Step 2: Run the new content tests and verify failure**

Run:

```powershell
node --test --test-name-pattern "first-principles|six CLI|AI Coding route|community tools" scripts/verify-practice.test.mjs
```

Expected: all four tests fail because the approved copy and structure are not yet present.

- [ ] **Step 3: Replace the page hero and in-page navigation**

Keep the existing app shell, top bar, footer, and script order. Replace the hero copy and `spine-nav` with this exact structure:

```html
<header class="page-hero">
  <div class="section-eyebrow">企业实操 · 飞书 + AI Coding</div>
  <h1>让 AI 真正进入工作，也把想法做成产品</h1>
  <p class="lead attention-lead">
    这不是产品名词清单。我们从一个最朴素的问题出发：
    <strong>AI 想明白以后，谁来保存信息、推动协作、执行动作并留下记录？</strong>
    飞书负责工作现场，AI 负责理解和生成，人负责判断与验收。
  </p>
  <figure class="figure hero-figure">
    <div class="figure-media">
      <img src="images/illustrations/viz-enterprise-ai.jpg"
           alt="人在企业协作场景中使用 AI 处理知识、数据与任务"
           width="1600" height="900" />
    </div>
    <figcaption class="figure-cap">
      <strong>本页路线</strong>
      <span>先看飞书能做什么，再看 CLI 怎样串起工作，最后把产品从想法推进到上线。</span>
    </figcaption>
  </figure>
</header>

<nav class="spine-nav" aria-label="本专栏目录">
  <a href="#map">提效地图</a>
  <a href="#feishu">飞书能力</a>
  <a href="#ai-cli">AI · Aily · CLI</a>
  <a href="#cli-loops">CLI 闭环</a>
  <a href="#site">AI Coding 上线</a>
  <a href="#daily">岗位实操</a>
  <a href="#gov">治理运维</a>
  <a href="#refs">官方资料</a>
</nav>
```

- [ ] **Step 4: Build stations one through four**

Use one `<article class="station" id="…">` per station. The required reader-facing content is:

1. `#map`: the bold conclusion “AI 负责理解和生成，飞书负责让信息有地方存、有人协作、有权限约束、有流程继续往下走。” followed by personal, team, business, and system layers.
2. `#feishu`: the six capability groups from the design spec, each with “适合” and “边界” fields, plus `feishu-collaboration-garden.png`.
3. `#ai-cli`: the brain / assembly bench / hands distinction, plus `ai-feishu-cli-loop.png`.
4. `#cli-loops`: the six approved value-loop cards.

Use this exact card contract for each CLI loop:

```html
<article class="workflow-card" data-problem="meeting">
  <div class="workflow-card-head">
    <span class="workflow-number">02</span>
    <div>
      <p class="workflow-kicker">会议信息散在录音和聊天里</p>
      <h3>会议闭环</h3>
    </div>
  </div>
  <p><strong>价值：</strong>会议不是“总结完就结束”，而是自动变成负责人、截止时间和下一步行动。</p>
  <ol class="micro-flow" aria-label="会议闭环步骤">
    <li>查日程</li><li>读妙记</li><li>提炼结论</li><li>创建任务</li><li>通知负责人</li>
  </ol>
  <div class="boundary-note"><strong>写入前确认：</strong>建任务、发消息、邀请成员前，让人核对对象和内容。</div>
  <details>
    <summary>给 AI 的一句话</summary>
    <div class="copy-block">
      <code>读取我今天这场会议的妙记，先列出结论和待办草稿；不要发消息或创建任务，等我确认。</code>
      <button type="button" data-copy-command aria-label="复制会议闭环提示词">复制</button>
    </div>
  </details>
</article>
```

The other five cards must use the same four-field contract and these `data-problem` values:

- daily brief: `daily`
- knowledge operations: `knowledge`
- sales follow-up: `data`
- operating report: `data`
- AI app delivery: `app`

Add a problem selector before the workflow grid:

```html
<div class="problem-filter" data-problem-filter aria-label="选择你想解决的问题">
  <button type="button" data-filter="all" aria-pressed="true">全部</button>
  <button type="button" data-filter="knowledge" aria-pressed="false">知识</button>
  <button type="button" data-filter="meeting" aria-pressed="false">会议</button>
  <button type="button" data-filter="data" aria-pressed="false">数据</button>
  <button type="button" data-filter="daily" aria-pressed="false">日常协作</button>
  <button type="button" data-filter="app" aria-pressed="false">做应用</button>
</div>
```

- [ ] **Step 5: Build the five-stage AI Coding station**

In `#site`, place `ai-coding-launch-route.png`, then render five `.phase-card` elements using the exact stage names from the test. Preserve the user's practical points, but apply these factual edits:

- Coding Plan: “先试用；只选官方支持当前 Agent 的套餐组合。”
- Agent product: mention examples as examples, not rankings or guarantees.
- name/domain: search WeChat, mini programs, app stores, domain availability, and basic trademark conflicts.
- server: state “静态网站、Serverless、云开发和妙搭不一定需要买服务器。”
- ICP: state “使用中国大陆服务器对外提供互联网信息服务时，依法办理 ICP 备案；材料齐全时，通信管理部门法定办理时限以官方规定为准。”
- GitHub: private repository by default for non-public product code; link current branch-protection documentation instead of embedding a fixed monthly price.
- `neat-freak`: label “可选 · 社区维护 · MIT”，explain that it aligns project knowledge and never replaces tests or review.

End with the exact loop:

```html
<div class="iteration-loop" aria-label="持续迭代流程">
  <span>新分支</span><i aria-hidden="true">→</i>
  <span>说需求</span><i aria-hidden="true">→</i>
  <span>Agent 实现</span><i aria-hidden="true">→</i>
  <span>本地验收</span><i aria-hidden="true">→</i>
  <span>测试与文档</span><i aria-hidden="true">→</i>
  <span>PR 与 CI</span><i aria-hidden="true">→</i>
  <span>发布观察</span>
</div>
```

- [ ] **Step 6: Consolidate daily, governance, and source stations**

- Keep the useful role/scenario rows in `#daily`; add deep links back to the matching CLI loops.
- In `#gov`, include data classification, least privilege, external-write confirmation, secrets, backup/recovery, logs/alerts, cache/rate limiting/DDoS awareness, and cost ceilings.
- In `#refs`, separate “飞书官方”“开发与合规官方”“社区工具” visually and show “核对日期：2026-07-20”.
- Retain existing official source links where current; add the exact official URLs listed in the approved design spec.

- [ ] **Step 7: Load the page-only script**

Insert before `</body>`, after `js/sandboxes.js`:

```html
<script src="js/practice.js"></script>
```

- [ ] **Step 8: Run the structure and content tests**

Run:

```powershell
node --test --test-name-pattern "eight-station|page-only|watercolor assets|first-principles|six CLI|AI Coding route|community tools" scripts/verify-practice.test.mjs
```

Expected: all selected tests pass.

- [ ] **Step 9: Commit the semantic content rewrite**

```powershell
git add practice.html scripts/verify-practice.test.mjs
git commit -m "feat: rewrite enterprise practice learning route"
```

---

### Task 4: Add Watercolor-Compatible Attention and Responsive Components

**Files:**
- Modify: `css/styles.css`
- Modify: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: semantic class names created in Task 3.
- Produces: responsive styles for `.attention-lead`, `.capability-map`, `.capability-card`, `.role-triad`, `.workflow-grid`, `.workflow-card`, `.problem-filter`, `.phase-roadmap`, `.phase-card`, `.boundary-note`, `.copy-block`, and `.iteration-loop`.

- [ ] **Step 1: Add a failing style-contract test**

Append:

```js
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
}
);
```

- [ ] **Step 2: Run the style test and verify failure**

Run:

```powershell
node --test --test-name-pattern "attention and workflow" scripts/verify-practice.test.mjs
```

Expected: failure on `.attention-lead`.

- [ ] **Step 3: Add the component styles at the end of `css/styles.css`**

Use the existing variables only. Implement:

```css
/* Enterprise practice · attention-led watercolor components */
.attention-lead strong {
  color: var(--sage-deep);
  background: linear-gradient(transparent 62%, var(--sage-wash) 62%);
  padding: 0 0.08em;
}

.capability-map,
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.capability-card,
.workflow-card,
.phase-card {
  background: var(--paper-card);
  border: 1.5px solid var(--line);
  border-radius: 18px 24px 17px 22px;
  box-shadow: var(--shadow);
  padding: 18px;
  position: relative;
}

.capability-card:nth-child(3n + 1),
.phase-card:nth-child(3n + 1) { background: linear-gradient(145deg, var(--sage-wash), #fff 58%); }
.capability-card:nth-child(3n + 2),
.phase-card:nth-child(3n + 2) { background: linear-gradient(145deg, var(--blue-gray-wash), #fff 58%); }
.capability-card:nth-child(3n),
.phase-card:nth-child(3n) { background: linear-gradient(145deg, var(--clay-wash), #fff 58%); }

.role-triad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.workflow-card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.workflow-number {
  flex: 0 0 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 45% 55% 50% 50%;
  background: var(--sage);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.workflow-kicker {
  color: var(--ink-mute);
  font-size: var(--fs-xs);
  line-height: 1.5;
  margin-bottom: 4px;
}

.micro-flow,
.iteration-loop {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0;
}

.micro-flow li,
.iteration-loop span {
  background: rgba(255,255,255,0.78);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill);
  padding: 5px 10px;
  color: var(--ink-soft);
  font-size: 12px;
}

.micro-flow li:not(:last-child)::after {
  content: "→";
  color: var(--ink-faint);
  margin-left: 10px;
}

.boundary-note {
  background: var(--clay-wash);
  border-left: 3px solid var(--clay);
  border-radius: 6px 14px 14px 6px;
  color: var(--ink-soft);
  font-size: var(--fs-sm);
  line-height: 1.65;
  padding: 10px 12px;
  margin: 12px 0;
}

.problem-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 20px;
}

.problem-filter button {
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  padding: 7px 12px;
  color: var(--ink-mute);
  background: var(--paper-card);
}

.problem-filter button[aria-pressed="true"] {
  color: var(--sage-deep);
  border-color: var(--sage);
  background: var(--sage-wash);
}

.workflow-card.is-muted {
  opacity: 0.28;
  filter: saturate(0.5);
}

.phase-roadmap {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.copy-block {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 10px;
}

.copy-block code {
  flex: 1;
  white-space: normal;
  overflow-wrap: anywhere;
}

.copy-block button {
  flex: 0 0 auto;
  border: 1px solid var(--sage);
  border-radius: var(--radius-pill);
  padding: 5px 10px;
  color: var(--sage-deep);
  background: var(--sage-wash);
}

@media (max-width: 900px) {
  .phase-roadmap { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 700px) {
  .capability-map,
  .workflow-grid,
  .role-triad,
  .phase-roadmap { grid-template-columns: 1fr; }

  .copy-block { flex-direction: column; }
  .copy-block button { width: 100%; }
  .workflow-card.is-muted { display: none; }
}
```

Adjust only spacing and selector specificity if the existing cascade requires it; do not introduce new colors.

- [ ] **Step 4: Run the style test**

Run:

```powershell
node --test --test-name-pattern "attention and workflow" scripts/verify-practice.test.mjs
```

Expected: pass.

- [ ] **Step 5: Commit the visual component system**

```powershell
git add css/styles.css scripts/verify-practice.test.mjs
git commit -m "style: add attention-led enterprise practice components"
```

---

### Task 5: Add Accessible Problem Filtering and Safe Copy Buttons

**Files:**
- Create: `js/practice.js`
- Modify: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: `[data-problem-filter]`, `[data-filter]`, `[data-problem]`, and `[data-copy-command]` from Task 3.
- Produces: `setProblemFilter(filter: string): void` and `copyCommand(button: HTMLButtonElement): Promise<void>` inside an isolated IIFE; no globals.

- [ ] **Step 1: Add failing static interaction tests**

Append:

```js
test("practice interaction script preserves accessible button state", () => {
  const js = read("js/practice.js");
  assert.match(js, /function setProblemFilter\(filter\)/);
  assert.match(js, /setAttribute\("aria-pressed"/);
  assert.match(js, /classList\.toggle\("is-muted"/);
  assert.match(js, /navigator\.clipboard\.writeText/);
  assert.match(js, /复制失败/);
});
```

- [ ] **Step 2: Run the interaction test and verify failure**

Run:

```powershell
node --test --test-name-pattern "interaction script" scripts/verify-practice.test.mjs
```

Expected: failure because `js/practice.js` does not exist.

- [ ] **Step 3: Implement `js/practice.js`**

Create:

```js
(function () {
  "use strict";

  var filterRoot = document.querySelector("[data-problem-filter]");
  var filterButtons = filterRoot ? Array.from(filterRoot.querySelectorAll("[data-filter]")) : [];
  var problemCards = Array.from(document.querySelectorAll("[data-problem]"));

  function setProblemFilter(filter) {
    filterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.filter === filter ? "true" : "false");
    });

    problemCards.forEach(function (card) {
      var matches = filter === "all" || card.dataset.problem === filter;
      card.classList.toggle("is-muted", !matches);
    });
  }

  if (filterRoot) {
    filterRoot.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button || !filterRoot.contains(button)) return;
      setProblemFilter(button.dataset.filter || "all");
    });
  }

  async function copyCommand(button) {
    var block = button.closest(".copy-block");
    var code = block ? block.querySelector("code") : null;
    if (!code) return;

    var original = button.textContent;
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      button.textContent = "已复制";
    } catch (error) {
      button.textContent = "复制失败";
    }
    window.setTimeout(function () {
      button.textContent = original;
    }, 1600);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy-command]");
    if (button) copyCommand(button);
  });
})();
```

- [ ] **Step 4: Run the interaction test**

Run:

```powershell
node --test --test-name-pattern "interaction script" scripts/verify-practice.test.mjs
```

Expected: pass.

- [ ] **Step 5: Commit the progressive enhancement**

```powershell
git add js/practice.js scripts/verify-practice.test.mjs
git commit -m "feat: add enterprise practice filters and copy actions"
```

---

### Task 6: Align the Global Entry Points and Repository Description

**Files:**
- Modify: `js/shell.js`
- Modify: `index.html`
- Modify: `README.md`
- Modify: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: the final section IDs from Task 3.
- Produces: stable global navigation links to `practice.html#feishu`, `#cli-loops`, `#site`, `#daily`, and `#refs`.

- [ ] **Step 1: Add failing entry-point tests**

Append:

```js
test("global entry points describe and link the upgraded guide", () => {
  const shell = read("js/shell.js");
  const index = read("index.html");
  const readme = read("README.md");

  for (const id of ["feishu", "cli-loops", "site", "daily", "refs"]) {
    assert.match(shell, new RegExp(`practice\\.html#${id}`));
  }
  assert.match(index, /飞书 CLI/);
  assert.match(index, /从想法到上线/);
  assert.match(readme, /飞书 CLI/);
  assert.match(readme, /AI Coding 从想法到上线/);
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
node --test --test-name-pattern "global entry points" scripts/verify-practice.test.mjs
```

Expected: failure because the old sidebar lacks `#cli-loops` and the home copy does not mention Feishu CLI.

- [ ] **Step 3: Update sidebar deep links**

Replace the enterprise sublinks in `js/shell.js` with:

```js
'<a class="sidebar-link sub" href="practice.html#feishu">飞书产品能力地图</a>' +
'<a class="sidebar-link sub" href="practice.html#ai-cli">AI · Aily · CLI</a>' +
'<a class="sidebar-link sub" href="practice.html#cli-loops">飞书 CLI 价值闭环</a>' +
'<a class="sidebar-link sub" href="practice.html#site">AI Coding 从想法到上线</a>' +
'<a class="sidebar-link sub" href="practice.html#daily">岗位实操清单</a>' +
'<a class="sidebar-link sub" href="practice.html#refs">官方资料与核对日期</a>' +
```

- [ ] **Step 4: Update the home-page enterprise card**

Use this copy:

```html
<h3>企业如何用 AI 提效</h3>
<p>看清飞书产品边界，用飞书 CLI 串起真实工作，再沿 AI Coding 路线把想法做成可上线产品。</p>
<div class="card-meta">从飞书到上线 →</div>
```

Add “飞书 CLI · 从想法到上线” to the section description without changing the existing card layout.

- [ ] **Step 5: Update the README path**

Change the enterprise practice bullets to:

```markdown
- 飞书产品能力地图：内容、数据、协作、组织、AI 与应用交付的适用边界
- 飞书 CLI：会议、知识、销售、经营和应用交付的六个价值闭环
- AI Coding 从想法到上线：工具、Plan、本地验收、Git/测试、部署、备案与运维
- 各岗位日常提效、数据安全、权限、成本与人工确认
```

- [ ] **Step 6: Run entry-point tests**

Run:

```powershell
node --test --test-name-pattern "global entry points" scripts/verify-practice.test.mjs
```

Expected: pass.

- [ ] **Step 7: Commit global alignment**

```powershell
git add js/shell.js index.html README.md scripts/verify-practice.test.mjs
git commit -m "docs: align enterprise practice entry points"
```

---

### Task 7: Perform Full Static, Visual, Mobile, and Source Verification

**Files:**
- Modify if defects are found: `practice.html`
- Modify if defects are found: `css/styles.css`
- Modify if defects are found: `js/practice.js`
- Modify if defects are found: `js/shell.js`
- Modify if defects are found: `index.html`
- Modify if defects are found: `scripts/verify-practice.test.mjs`

**Interfaces:**
- Consumes: the complete implementation.
- Produces: a clean working tree whose page passes automated checks and a manual desktop/mobile acceptance pass.

- [ ] **Step 1: Add final hygiene tests**

Append:

```js
test("practice page contains no secret-shaped examples or unfinished markers", () => {
  assert.doesNotMatch(practice, /\b(sk-[A-Za-z0-9_-]{12,}|cli_[a-z0-9]{12,}|ou_[a-z0-9]{12,}|oc_[a-z0-9]{12,})\b/);
  assert.doesNotMatch(practice, /\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  const unfinished = [
    ["TO", "DO"].join(""),
    ["TB", "D"].join(""),
    "待" + "补充",
    "占位" + "内容",
  ];
  for (const marker of unfinished) assert.doesNotMatch(practice, new RegExp(marker));
});

test("new figures have non-empty alt text and lazy loading outside the hero", () => {
  const figures = [
    "feishu-collaboration-garden.png",
    "ai-feishu-cli-loop.png",
    "ai-coding-launch-route.png",
  ];

  for (const name of figures) {
    const tag = practice.match(new RegExp(`<img[^>]+src="images/illustrations/${name}"[^>]*>`))?.[0] || "";
    assert.match(tag, /alt="[^"]{8,}"/);
    assert.match(tag, /loading="lazy"/);
  }
});
```

- [ ] **Step 2: Run the entire static test suite**

Run:

```powershell
node --test scripts/verify-practice.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Run repository text and diff hygiene checks**

Run:

```powershell
git diff --check
rg -n "所有未备案域名都会被运营商拦截|自家的 Agent (一定|肯定)更适合" practice.html css/styles.css js/practice.js js/shell.js index.html README.md
```

Expected: `git diff --check` exits `0`; `rg` returns no matches.

- [ ] **Step 4: Start the local static server**

Run:

```powershell
python -m http.server 8080
```

Expected: server listens at `http://localhost:8080/`. Keep it running only for the acceptance pass.

- [ ] **Step 5: Verify desktop behavior at 1440×900**

Open `http://localhost:8080/practice.html` in a real browser and verify:

- the watercolor hero and three new figures are visually consistent;
- each viewport has one dominant attention anchor;
- all eight sticky-nav links scroll to the correct station;
- the problem selector updates `aria-pressed` and mutes nonmatching cards;
- copy buttons copy only identifier-free natural-language prompts;
- all external sources open in a new tab;
- the page has no console error.

- [ ] **Step 6: Verify mobile behavior at 390×844**

Verify:

- no page-level horizontal overflow;
- sidebar and in-page navigation remain usable;
- capability, role, workflow, and phase grids collapse to one column;
- filtered-out workflow cards do not leave large blank areas;
- no image text is required to understand the section;
- buttons have comfortable tap targets and visible focus states.

- [ ] **Step 7: Check the three-minute beginner path**

Without using search, confirm a first-time reader can locate these answers within three minutes:

1. “飞书每类产品大致负责什么？”
2. “飞书 CLI 能创造什么价值，又不能越过什么权限？”
3. “我怎样把一个 AI Coding 产品从想法推进到上线？”

If any answer requires reading a long unbroken block, split that block into a conclusion, cards, and details without adding new scope.

- [ ] **Step 8: Review final changes and commit verification fixes**

Run:

```powershell
git status --short
git diff --stat
git diff --check
node --test scripts/verify-practice.test.mjs
```

Expected: only intended files changed, no whitespace errors, all tests pass.

Commit any verification fixes:

```powershell
git add practice.html css/styles.css js/practice.js js/shell.js index.html README.md scripts/verify-practice.test.mjs
git commit -m "fix: complete enterprise practice acceptance pass"
```

If no fixes were required, do not create an empty commit.

---

## Final Acceptance Checklist

- [ ] Existing watercolor identity is preserved and strengthened, not replaced.
- [ ] Three curated wide watercolor illustrations are present, accessible, and use truthful intrinsic dimensions.
- [ ] The page contains exactly the approved eight top-level stations.
- [ ] Feishu products are explained by job and boundary rather than marketing category.
- [ ] Feishu AI, Aily, and CLI are clearly distinguished in plain language.
- [ ] Six CLI workflows each show value, flow, output, and human confirmation point.
- [ ] The original 20-step AI Coding material is retained as five attention-manageable phases.
- [ ] Server, ICP, Coding Plan, GitHub Pro, Agent compatibility, and community Skill claims are calibrated.
- [ ] Core content works without JavaScript; enhancement works with keyboard and screen-reader state.
- [ ] Official and community sources are separated and dated.
- [ ] Automated checks and desktop/mobile acceptance pass.
