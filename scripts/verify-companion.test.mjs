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

test("browser fallback prioritizes a specific customer-service signal over generic choice words", async () => {
  const companionClient = await readFile(new URL("../js/companion.js", import.meta.url), "utf8");
  assert.match(companionClient, /"客服", "客户服务", "服务客户", "售后"/);
  assert.match(companionClient, /genericKeywords = new Set/);
  assert.match(companionClient, /\.sort\(\(a, b\) => b\.score - a\.score\)/);
});

test("project execution remains useful when the optional reasoning model is not configured", async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = globalThis.fetch;
  delete process.env.AI_API_KEY;
  let upstreamCalled = false;
  globalThis.fetch = async () => {
    upstreamCalled = true;
    throw new Error("local project execution must not call an unconfigured model");
  };
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-local-project-agent" },
    body: {
      task: "execute_project",
      goal: "比较三款产品，找到更适合我的选择",
      scenarioId: "purchase",
      solution: {
        title: "围绕真实条件完成一次购买比较",
        steps: ["把条件排成优先顺序", "统一提取可比信息", "标记缺失和冲突", "生成带来源的建议"],
        humanDecision: "预算、取舍与最终购买"
      },
      context: {
        diagnosis: {
          desiredOutput: "选出适合通勤和周末露营的车型",
          facts: ["每天通勤 40 公里", "候选车型是 A、B、C"],
          constraints: ["预算 20 万以内"],
          missing: ["是否具备家充条件"]
        }
      }
    }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.meta.route, "project-agent-local");
  assert.equal(body.result.artifact.type, "comparison");
  assert.match(body.result.artifact.content, /比较标准/);
  assert.match(body.result.artifact.content, /每天通勤 40 公里/);
  assert.match(body.result.artifact.content, /预算 20 万以内/);
  assert.match(body.result.artifact.content, /是否具备家充条件/);
  assert.match(body.result.decisions[0].question, /预算、取舍与最终购买/);
  assert.equal(body.result.execution[0].status, "done");
  assert.ok(body.result.skillCandidate.steps.length >= 3);
  assert.equal(upstreamCalled, false);

  globalThis.fetch = previousFetch;
  if (previousKey) process.env.AI_API_KEY = previousKey;
});

test("light need analysis extracts a concrete outcome and constraints without choosing the solution", async () => {
  const previousAgnesKey = process.env.AGNES_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.AGNES_API_KEY = "test-agnes-key-not-a-real-secret";
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          scenario: "purchase",
          goal: "比较三款车型",
          desiredOutput: "选出适合通勤和露营的一款",
          facts: ["每天通勤 40 公里", "候选车型 A、B、C"],
          constraints: ["预算 20 万以内"],
          missing: ["家充条件"]
        }) } }]
      })
    };
  };
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-need-analysis" },
    body: { task: "analyze_need", text: "预算 20 万，每天通勤 40 公里，周末想露营，帮我比较 A、B、C。" }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.meta.route, "light");
  assert.equal(body.result.scenario, "purchase");
  assert.equal(body.result.desiredOutput, "选出适合通勤和露营的一款");
  assert.deepEqual(body.result.constraints, ["预算 20 万以内"]);
  assert.match(upstreamRequest.body.messages[0].content, /提取用户已经表达的需求信息/);
  assert.doesNotMatch(upstreamRequest.body.messages[0].content, /推荐组合|你应该推荐/);

  globalThis.fetch = previousFetch;
  if (previousAgnesKey) process.env.AGNES_API_KEY = previousAgnesKey;
  else delete process.env.AGNES_API_KEY;
});

test("need analysis corrects a generic model classification when the user gives a specific customer-service signal", async () => {
  const previousAgnesKey = process.env.AGNES_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.AGNES_API_KEY = "test-agnes-key-not-a-real-secret";
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({
        scenario: "purchase",
        role: "manager",
        goal: "为团队选择 AI 客服方案",
        desiredOutput: "得到技术、成本、客户体验与风险兼顾的方案",
        facts: [],
        constraints: [],
        missing: [],
        knowledgeLenses: ["systems"]
      }) } }]
    })
  });
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-customer-signal" },
    body: {
      task: "analyze_need",
      text: "我要为团队选择一套 AI 客服方案，需要判断技术、成本、客户体验和风险。",
      role: "manager"
    }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.result.scenario, "customer");
  assert.equal(body.result.role, "manager");
  assert.ok(body.result.knowledgeLenses.includes("business"));
  assert.ok(body.result.humanJudgments.length >= 3);

  globalThis.fetch = previousFetch;
  if (previousAgnesKey) process.env.AGNES_API_KEY = previousAgnesKey;
  else delete process.env.AGNES_API_KEY;
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

test("project execution route returns an artifact, confirmation points and a reusable Skill draft", async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.AI_API_KEY = "test-key-not-a-real-secret";
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          title: "周会行动闭环",
          status: "needs_confirmation",
          summary: "已从会议内容形成任务初稿。",
          artifact: {
            type: "task_list",
            title: "本周行动项",
            content: "1. 待确认负责人：整理客户反馈；截止时间：周五。"
          },
          decisions: [{
            id: "owner",
            question: "谁负责整理客户反馈？",
            why: "负责人会影响后续任务创建与通知。",
            options: ["待确认"],
            required: true
          }],
          execution: [
            { label: "识别行动项", status: "done", detail: "已完成" },
            { label: "创建飞书任务", status: "waiting", detail: "等待人工确认负责人" }
          ],
          skillCandidate: {
            name: "会议行动项整理",
            trigger: "收到会议记录后",
            inputs: ["会议记录"],
            steps: ["提取结论与行动项", "集中确认负责人和截止时间"],
            checks: ["不补写未出现的承诺"],
            output: "可审核的任务清单",
            approvalActions: ["创建任务", "发送通知"]
          },
          risk: ""
        }) } }],
        usage: { prompt_tokens: 30, completion_tokens: 90 }
      })
    };
  };

  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-project-route" },
    body: {
      task: "execute_project",
      goal: "把周会记录整理成任务",
      scenarioId: "meeting",
      solution: { title: "把会议内容变成可执行任务", steps: ["提取行动项"], humanDecision: "负责人和截止时间" }
    }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.meta.route, "project-agent");
  assert.equal(body.result.artifact.type, "task_list");
  assert.equal(body.result.decisions[0].required, true);
  assert.equal(body.result.skillCandidate.name, "会议行动项整理");
  assert.match(upstreamRequest.body.messages[0].content, /外部写入/);
  assert.match(upstreamRequest.body.messages[0].content, /只返回 JSON/);
  assert.match(upstreamRequest.body.messages[1].content, /把周会记录整理成任务/);

  globalThis.fetch = previousFetch;
  if (previousKey) process.env.AI_API_KEY = previousKey;
  else delete process.env.AI_API_KEY;
});

test("light recognition tasks route to Agnes server-side", async () => {
  const previousAgnesKey = process.env.AGNES_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.AGNES_API_KEY = "test-agnes-key-not-a-real-secret";
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"text":"会议时间：周五 10:00","language":"zh-CN","uncertain":[]}' } }],
        usage: { prompt_tokens: 8, completion_tokens: 12 }
      })
    };
  };
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:4173", "x-forwarded-for": "test-agnes-route" },
    body: { task: "recognize", text: "会议时间 周五 10:00", source: "截图文字" }
  };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(upstreamRequest.url, "https://apihub.agnes-ai.com/v1/chat/completions");
  assert.equal(upstreamRequest.body.model, "agnes-2.0-flash");
  assert.equal(body.result.text, "会议时间：周五 10:00");
  assert.equal(body.meta.route, "light");
  assert.doesNotMatch(JSON.stringify(upstreamRequest.body), /判断|决策|建议/);
  globalThis.fetch = previousFetch;
  if (previousAgnesKey) process.env.AGNES_API_KEY = previousAgnesKey;
  else delete process.env.AGNES_API_KEY;
});

test("model health reports Agnes availability without exposing its key", async () => {
  const previousAgnesKey = process.env.AGNES_API_KEY;
  const previousMainKey = process.env.AI_API_KEY;
  process.env.AGNES_API_KEY = "test-agnes-key-not-a-real-secret";
  delete process.env.AI_API_KEY;
  const req = { method: "GET", headers: { origin: "http://localhost:4173" } };
  const res = responseMock();
  await companionModule(req, res);
  const body = JSON.parse(res.body);
  assert.equal(body.lightConfigured, true);
  assert.equal(body.lightModel, "agnes-2.0-flash");
  assert.equal("agnesApiKey" in body, false);
  assert.doesNotMatch(res.body, /test-agnes-key/);
  if (previousAgnesKey) process.env.AGNES_API_KEY = previousAgnesKey;
  else delete process.env.AGNES_API_KEY;
  if (previousMainKey) process.env.AI_API_KEY = previousMainKey;
  else delete process.env.AI_API_KEY;
});

test("new-tab extension stays lightweight and does not ship sidepanel or local bridge permissions", async () => {
  const [manifestText, newtabHtml, newtabScript, installHtml] = await Promise.all([
    readFile(new URL("../manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../extension/newtab.html", import.meta.url), "utf8"),
    readFile(new URL("../extension/newtab.js", import.meta.url), "utf8"),
    readFile(new URL("../install.html", import.meta.url), "utf8")
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.version, "1.4.0");
  assert.equal(manifest.chrome_url_overrides.newtab, "extension/newtab.html");
  assert.ok(manifest.permissions.includes("topSites"));
  assert.equal("side_panel" in manifest, false);
  assert.equal("background" in manifest, false);
  assert.equal("content_scripts" in manifest, false);
  assert.equal(manifest.permissions.includes("nativeMessaging"), false);
  assert.equal(manifest.permissions.includes("sidePanel"), false);
  assert.match(manifestText, /ai-knowledge-sigma\.vercel\.app/);
  assert.doesNotMatch(newtabHtml, /textarea|contenteditable/);
  assert.equal((newtabHtml.match(/<input\b/g) || []).length, 1);
  assert.match(newtabHtml, /type="search"/);
  assert.match(newtabHtml, /打开能力地图/);
  assert.match(newtabScript, /ai-knowledge-sigma\.vercel\.app\/knowledge-map/);
  assert.doesNotMatch(`${newtabHtml}\n${newtabScript}\n${installHtml}`, /sidepanel|飞书 CLI|ai-companion:\/\//i);
  assert.match(installHtml, /ai-companion-extension\.zip/);
});

test("knowledge map keeps the task-first framing without an inline task form or project execution page", async () => {
  const [legacy, mapPage, mapScript, newtab] = await Promise.all([
    readFile(new URL("../companion.html", import.meta.url), "utf8"),
    readFile(new URL("../knowledge-map.html", import.meta.url), "utf8"),
    readFile(new URL("../js/knowledge-map-page.js", import.meta.url), "utf8"),
    readFile(new URL("../extension/newtab.html", import.meta.url), "utf8"),
  ]);
  assert.match(legacy, /location\.replace\("knowledge-map\.html"\)/);
  assert.doesNotMatch(mapPage, /map-task-form|map-task-guidance|role-paths/);
  assert.match(mapPage, /sidebar-root/);
  assert.doesNotMatch(mapScript, /visibleLenses|scrollIntoView|map-task-input/);
  assert.doesNotMatch(mapScript, /companion\.html/);
  assert.match(newtab, /打开能力地图/);
});

test("primary product surfaces contain no SVG image content", async () => {
  const files = ["../index.html", "../knowledge-map.html", "../install.html", "../learning.html", "../glossary.html", "../extension/newtab.html"];
  const contents = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  for (const content of contents) assert.doesNotMatch(content, /<svg|\.svg\b/i);
});

test("product is repositioned around interdisciplinary judgment", async () => {
  const [home, mapPage] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../knowledge-map.html", import.meta.url), "utf8")
  ]);
  assert.match(home, /扩展认知边界/);
  assert.match(home, /驾驭 AI/);
  assert.match(mapPage, /先说你要(?:<br\s*\/?>)?解决什么/);
  assert.match(mapPage, /四个知识枢纽/);
});

test("active product pages do not expose cancelled sidepanel or Feishu CLI paths", async () => {
  const [home, mapPage, ecosystem, practice, newtab, manifestText] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../knowledge-map.html", import.meta.url), "utf8"),
    readFile(new URL("../feishu-ai.html", import.meta.url), "utf8"),
    readFile(new URL("../practice.html", import.meta.url), "utf8"),
    readFile(new URL("../extension/newtab.html", import.meta.url), "utf8"),
    readFile(new URL("../manifest.json", import.meta.url), "utf8")
  ]);
  for (const surface of [home, mapPage, ecosystem, practice, newtab, manifestText]) {
    assert.doesNotMatch(surface, /ai-companion:\/\/|飞书 CLI|sidepanel/i);
  }
  assert.match(newtab, /frequent-list/);
  assert.match(newtab, /打开能力地图/);
});

test("knowledge content follows one interdisciplinary judgment map", async () => {
  const [knowledgeMap, shell] = await Promise.all([
    readFile(new URL("../js/knowledge-map.js", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8")
  ]);
  for (const lens of ["技术判断", "业务判断", "产品判断", "人脑与设计", "组织与沟通", "系统与决策"]) {
    assert.match(knowledgeMap, new RegExp(lens));
  }
  for (const hub of ["技术与工程", "商业与产品", "人脑与设计", "组织与决策"]) {
    assert.match(`${knowledgeMap}\n${shell}`, new RegExp(hub));
  }
  assert.match(knowledgeMap, /scenarioLenses/);
  assert.match(knowledgeMap, /pageLenses/);
});

test("content images use complete responsive display rules", async () => {
  const [styles, companionStyles, ecosystem] = await Promise.all([
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../css/companion.css", import.meta.url), "utf8"),
    readFile(new URL("../feishu-ai.html", import.meta.url), "utf8")
  ]);
  assert.match(styles, /Knowledge illustrations must stay complete/);
  assert.match(styles, /object-fit:\s*contain/);
  assert.match(styles, /height:\s*auto/);
  assert.match(companionStyles, /Every generated illustration remains complete/);
  assert.match(ecosystem, /feishu-ai-ecosystem-watercolor\.webp/);
});

test("data-to-knowledge module preserves evidence and makes derived knowledge rebuildable", async () => {
  const [page, styles, shell] = await Promise.all([
    readFile(new URL("../data-knowledge.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8")
  ]);
  assert.match(page, /原始证据不可丢/);
  assert.match(page, /可重建层/);
  for (const stage of ["收集", "解析", "去噪", "知识卡片", "分层存储", "检索", "反馈"]) {
    assert.match(page, new RegExp(stage));
  }
  for (const layer of ["原始资料", "结构化数据", "元数据", "语义索引", "关系图谱"]) {
    assert.match(page, new RegExp(layer));
  }
  for (const source of ["2404.16130", "GN921JHCRw", "2410.10813", "docling-project/docling", "infiniflow/ragflow", "qdrant/qdrant"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /data-to-knowledge-watercolor\.png/);
  assert.match(page, /knowledge-storage-layers-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.data-knowledge-page/);
  assert.match(shell, /data-knowledge\.html/);
});

test("AI entrepreneurship topic teaches one evidence-to-revenue loop instead of startup slogans", async () => {
  const [page, styles, shell] = await Promise.all([
    readFile(new URL("../innovation.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8")
  ]);
  for (const stage of ["真实问题", "用户访谈", "价值假设", "最小实验", "真实承诺", "单位经济", "复盘沉淀"]) {
    assert.match(page, new RegExp(stage));
  }
  for (const capability of ["商业思维", "业务能力", "产品思维", "创新能力"]) {
    assert.match(page, new RegExp(capability));
  }
  for (const source of ["effectuation.org", "paulgraham.com", "steveblank.com", "strategyzer.com", "christenseninstitute.org", "nber.org/papers/w31161", "aiinstitute.hbs.edu"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const project of ["langgenius/dify", "n8n-io/n8n", "PostHog/posthog", "supabase/supabase"]) {
    assert.match(page, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /ai-entrepreneurship-watercolor\.png/);
  assert.match(page, /venture-validation-loop-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.innovation-page/);
  assert.match(shell, /innovation\.html/);
});

test("industry topic teaches a reusable discovery-to-solution method with automotive as an example", async () => {
  const [page, styles, shell, home, ecosystem] = await Promise.all([
    readFile(new URL("../automotive.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../feishu-ai.html", import.meta.url), "utf8")
  ]);
  for (const stage of ["定义边界", "画业务骨架", "收集现实证据", "找到约束", "匹配 AI 角色", "做最小实验"]) {
    assert.match(page, new RegExp(stage));
  }
  for (const role of ["看懂", "判断辅助", "生成方案", "执行行动"]) {
    assert.match(page, new RegExp(role));
  }
  for (const source of ["apqc.org", "omg.org/spec/BPMN", "processmining.org", "nber.org/papers/w31161", "nist.gov/itl/ai-risk-management-framework"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const project of ["process-intelligence-solutions/pm4py", "flowable/flowable-engine", "langflow-ai/langflow", "langgenius/dify"]) {
    assert.match(page, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /汽车制造/);
  assert.match(page, /industry-discovery-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.industry-discovery-page/);
  assert.match(shell, /快速看懂一个行业/);
  assert.match(home, /快速看懂一个行业/);
  assert.match(ecosystem, /进入行业方法/);
});

test("cognitive management topic turns research into human-Agent operating rules", async () => {
  const [page, styles, shell, home, hub] = await Promise.all([
    readFile(new URL("../cognitive-management-ai.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../companion.html", import.meta.url), "utf8")
  ]);
  for (const concept of ["注意力", "工作记忆", "长期记忆", "有限理性", "组织记忆", "反馈学习"]) {
    assert.match(page, new RegExp(concept));
  }
  for (const stage of ["定目标", "先判断", "委派", "反证", "确认", "执行留痕", "沉淀 Skill"]) {
    assert.match(page, new RegExp(stage));
  }
  for (const right of ["自动执行", "审核后执行", "人类决定", "禁止执行"]) {
    assert.match(page, new RegExp(right));
  }
  for (const source of ["27542527", "26151629", "nobelprize.org", "orsc.1040.0069", "nber.org/papers/w31161", "aiinstitute.hbs.edu"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const project of ["SoarGroup/Soar", "humanlayer/humanlayer", "langfuse/langfuse", "traceloop/openllmetry", "dapr/dapr-agents"]) {
    assert.match(page, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /cognitive-management-ai-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.cognitive-ai-page/);
  assert.match(shell, /cognitive-management-ai\.html/);
  assert.match(home, /脑科学 × 管理 × AI/);
  assert.doesNotMatch(hub, /脑科学 × 管理 × AI →/);
});

test("social intelligence topic teaches ethical audience-aware communication and relationship boundaries", async () => {
  const [page, styles, shell, home, hub] = await Promise.all([
    readFile(new URL("../social-intelligence.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../companion.html", import.meta.url), "utf8")
  ]);
  for (const layer of ["认识自己", "理解对象", "翻译价值", "组织观点", "经营关系"]) {
    assert.match(page, new RegExp(layer));
  }
  for (const part of ["情境", "关切", "价值", "结构", "行动"]) {
    assert.match(page, new RegExp(part));
  }
  for (const boundary of ["可以协调", "需要拒绝", "需要升级", "需要退出"]) {
    assert.match(page, new RegExp(boundary));
  }
  for (const source of ["29658736", "39823207", "mnsc.48.11.1408.268", "38667574", "ambpp.2015.16947abstract", "23882206"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const project of ["CornellNLP/ConvoKit", "microsoft/presidio", "RasaHQ/rasa", "argilla-io/argilla"]) {
    assert.match(page, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /social-intelligence-watercolor\.png/);
  assert.match(page, /audience-value-structure-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.social-intelligence-page/);
  assert.match(shell, /social-intelligence\.html/);
  assert.match(home, /社会认知与关系协作/);
  assert.doesNotMatch(hub, /社会认知与关系协作 →/);
});

test("structured expression topic connects pyramid communication with evidence, objections and Agent practice", async () => {
  const [page, styles, shell, home] = await Promise.all([
    readFile(new URL("../structured-expression.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../js/shell.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8")
  ]);
  for (const concept of ["自下而上", "自上而下", "SCQA", "MECE", "Toulmin", "隐含前提", "最强反例", "适用边界"]) {
    assert.match(page, new RegExp(concept));
  }
  for (const checkpoint of ["问题", "结论", "标准", "证据", "连接", "异议", "行动"]) {
    assert.match(page, new RegExp(checkpoint));
  }
  for (const source of ["barbaraminto.com", "S1747938X15000664", "S1747938X22000501", "hequ.70063", "19014238", "AJET/article/view/1154"]) {
    assert.match(page, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const project of ["argdown.org", "arg.tech/index.php/ova", "vale-cli/vale", "logseq/logseq", "jgm/pandoc"]) {
    assert.match(page, new RegExp(project.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /structured-expression-watercolor\.png/);
  assert.match(page, /pyramid-thinking-watercolor\.png/);
  assert.doesNotMatch(page, /<svg|\.svg\b/i);
  assert.match(styles, /\.structured-expression-page/);
  assert.match(styles, /\.global-judgment-unit/);
  assert.match(shell, /structured-expression\.html/);
  assert.match(shell, /global-judgment-unit/);
  assert.match(home, /结构化表达与金字塔思维/);
});

test("all shell-driven knowledge pages receive a page-specific judgment unit", async () => {
  const [shell, knowledgeMap] = await Promise.all([
    readFile(new URL("../js/shell.js", import.meta.url), "utf8"),
    readFile(new URL("../js/knowledge-map.js", import.meta.url), "utf8")
  ]);
  for (const page of ["fundamentals.html", "boundaries.html", "learning.html", "mindmap.html", "history.html", "glossary.html", "architectures.html", "embodied.html", "practice.html", "feishu-ai.html", "automotive.html", "innovation.html", "data-knowledge.html", "cognitive-management-ai.html", "social-intelligence.html", "structured-expression.html"]) {
    assert.match(knowledgeMap, new RegExp(page.replace(".", "\\.")));
  }
  assert.match(shell, /global-judgment-unit/);
  assert.match(shell, /pageVisual/);
  assert.match(shell, /loading="lazy"/);
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
