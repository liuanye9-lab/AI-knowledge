"use strict";

const KNOWLEDGE_MAP = require("../js/knowledge-map.js");
const DEFAULT_BASE_URL = "https://api.llm-token.cn/v1";
const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_AGNES_URL = "https://apihub.agnes-ai.com/v1/chat/completions";
const DEFAULT_AGNES_MODEL = "agnes-2.0-flash";
const MAX_INPUT_CHARS = 8000;
const REQUEST_TIMEOUT_MS = 25000;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 20;
const rateWindows = new Map();
const PROJECT_TASK = "execute_project";

const SYSTEM_PROMPT = `你是“AI 伴学”，一个嵌在真实工作中的轻量协作助手。你的目标不是授课，而是让用户眼前的内容立刻变好，并顺手留下一个可迁移的方法。

严格要求：
1. 一次只指出一个影响最大的改进点，不列知识清单，不考试，不说教。
2. rewrite 必须可以直接复制使用，保留原意，不编造事实。
3. why 只用一句话，连接用户已有经验，避免术语。
4. method 是一句可在相似情境复用的方法，最多 28 个汉字。
5. 如果原文涉及法律、医疗、财务、隐私或对外承诺，在 risk 中简短提示人工核验；否则 risk 为空字符串。
6. 只返回 JSON，不使用 Markdown 或代码围栏。格式：{"title":"","rewrite":"","why":"","method":"","risk":""}`;

const PROJECT_SYSTEM_PROMPT = `你是“跨学科判断力知识库”的项目执行 Agent。用户不需要学习完整课程；你要围绕真实目标直接形成一份可使用、可审核的第一版成果。

协作边界：
1. 人负责目标、事实、取舍、权限与最终承诺；Agent 负责拆解、起草、检查和沉淀。
2. 只执行低风险的知识工作。创建任务、发送消息、邀请成员、购买、发布、删除及任何外部写入，必须列入 decisions 和 skillCandidate.approvalActions，等待人工确认，不能声称已经执行。
3. 不编造事实；缺少的信息写“待确认”，并把最少的关键问题集中列入 decisions。
4. artifact 必须是用户现在就能复制或继续修改的交付物，不是教程、提示词或泛泛建议。
5. skillCandidate 只沉淀本次可复现的输入、步骤、检查方法和需审批动作，不包含密钥或个人敏感信息。
6. role、capabilityGaps、knowledgeLenses、humanJudgments、agentDelegation、recommendedPath 必须围绕本次任务生成，不输出课程清单。
7. 只返回 JSON，不使用 Markdown 或代码围栏。格式：
{"title":"","status":"needs_confirmation","summary":"","role":"general","capabilityGaps":[],"knowledgeLenses":[],"humanJudgments":[],"agentDelegation":[],"recommendedPath":"","artifact":{"type":"document","title":"","content":""},"decisions":[{"id":"","question":"","why":"","options":[],"required":true}],"execution":[{"label":"","status":"done","detail":""}],"skillCandidate":{"name":"","trigger":"","inputs":[],"steps":[],"checks":[],"output":"","approvalActions":[]},"risk":""}`;

const MODE_PROMPTS = {
  clarify: "直接解释当前内容：先用一句熟悉的类比，再给出目标、三个重点和一个待确认项。结果不是提示词，必须可直接阅读。",
  check: "找出最可能造成错误、误解或无法验收的一处，并给出谨慎修订。",
  action: "直接写出一版可交付内容或不超过 3 项的可交接行动，明确负责人角色、时间和完成标准；未知信息标记待确认。结果不是写作建议。"
};

const LIGHT_TASK_PROMPTS = {
  recognize: `你只负责整理已经提供的文字。修正明显的空格、换行和标点，保留原意、数字、日期、时间与专有名词；不新增信息，不改写含义。只返回 JSON：{"text":"","language":"","uncertain":[]}`,
  normalize: `你只负责规范已有文字的空格、换行、标点和列表结构，保留原意与全部事实；不新增信息，不改写含义。只返回 JSON：{"text":"","language":"","uncertain":[]}`,
  classify: `你只负责给已有内容归类。type 只能是 job、product、email、meeting、document、other 之一。只返回 JSON：{"type":"other","confidence":0,"evidence":""}`,
  analyze_need: `你先提取用户已经表达的需求信息，再识别完成任务所需的最少跨学科判断视角，不补充用户事实。
scenario 只能是 meeting、job、purchase、customer、cost、document、data、venture、general 之一。
role 只能是 product、operations、manager、customer、founder、general 之一；knowledgeLenses 只能使用 technology、business、product、human、organization、systems。
goal 是用户想做的事情；desiredOutput 是用户最终想得到的具体成果；facts 只放原文已有事实和材料；constraints 只放预算、时间、对象、格式等限制；missing 只放执行前真正缺少的关键信息。
capabilityGaps 最多 4 条，描述为了完成任务需要补齐的判断能力；humanJudgments 最多 3 条，写必须由人决定的取舍；agentDelegation 最多 4 条，写 Agent 可直接完成的低风险知识工作；recommendedPath 是一句最短执行路径；skillCandidate 是可沉淀的方法名称。
只返回 JSON：{"scenario":"general","role":"general","goal":"","desiredOutput":"","facts":[],"constraints":[],"missing":[],"capabilityGaps":[],"knowledgeLenses":[],"humanJudgments":[],"agentDelegation":[],"recommendedPath":"","skillCandidate":""}`
};

const ALLOWED_ROLES = new Set(KNOWLEDGE_MAP.roles.map((role) => role.id));
const ALLOWED_LENSES = new Set(Object.keys(KNOWLEDGE_MAP.lenses));

function defaultIntelligence(scenario, requestedRole) {
  const route = KNOWLEDGE_MAP.scenarioLenses[scenario] || KNOWLEDGE_MAP.scenarioLenses.general;
  const role = ALLOWED_ROLES.has(requestedRole) ? requestedRole : route.role;
  const roleData = KNOWLEDGE_MAP.roles.find((item) => item.id === role) || KNOWLEDGE_MAP.roles.find((item) => item.id === "general");
  const lensIds = route.lenses.slice(0, 5);
  return {
    role,
    capabilityGaps: lensIds.slice(0, 4).map((id) => `用${KNOWLEDGE_MAP.lenses[id].name}检查当前方案`),
    knowledgeLenses: lensIds,
    humanJudgments: ["最终要改善的结果", "事实、约束和不可妥协条件", "最终取舍、权限与对外承诺"],
    agentDelegation: ["整理现有材料与证据", "生成第一版方案或成果", "检查遗漏、冲突和风险", "把有效流程整理为 Skill 草案"],
    recommendedPath: roleData.path,
    skillCandidate: "任务判断与执行 Skill"
  };
}

function isAllowedOrigin(origin) {
  return !origin || origin.startsWith("chrome-extension://") ||
    origin === "https://ai-knowledge-sigma.vercel.app" ||
    origin === "https://ai.lay28.top" ||
    /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

function setCors(req, res) {
  const origin = String(req.headers?.origin || "");
  if (origin && isAllowedOrigin(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
}

function isRateLimited(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "local");
  const client = forwarded.split(",")[0].trim();
  const now = Date.now();
  const current = rateWindows.get(client);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(client, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型没有返回 JSON 对象");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeResult(value) {
  const result = {};
  for (const key of ["title", "rewrite", "why", "method", "risk"]) {
    result[key] = typeof value?.[key] === "string" ? value[key].trim() : "";
  }
  if (!result.title || !result.rewrite || !result.why || !result.method) {
    throw new Error("模型返回缺少必要字段");
  }
  return result;
}

const SCENARIO_SIGNALS = {
  venture: ["创业", "商业", "生意", "付费", "客户需求", "产品想法", "创新", "市场", "mvp"],
  data: ["数据", "资料", "知识库", "去噪", "沉淀", "归档", "文件夹", "分类"],
  meeting: ["会议", "周会", "纪要", "讨论", "访谈"],
  job: ["岗位", "面试", "简历", "招聘", "求职"],
  purchase: ["购买", "对比", "比较", "选择", "价格"],
  customer: ["客服", "客户服务", "服务客户", "售后", "客户", "邮件", "回复", "跟进", "销售", "报价"],
  cost: ["成本", "效率", "重复", "流程", "自动化", "省钱", "加班"],
  document: ["方案", "文档", "报告", "写", "总结", "内容"]
};
const GENERIC_SCENARIO_SIGNALS = new Set(["选择", "比较", "方案", "写", "内容"]);

function refineScenario(candidate, text) {
  const normalized = String(text || "").toLowerCase();
  const ranked = Object.entries(SCENARIO_SIGNALS)
    .map(([scenario, signals]) => ({
      scenario,
      score: signals.reduce((total, signal) => {
        if (!normalized.includes(signal)) return total;
        return total + (GENERIC_SCENARIO_SIGNALS.has(signal) ? 1 : Math.max(2, signal.length + 1));
      }, 0)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 2 ? ranked[0].scenario : candidate;
}

function normalizeLightResult(task, value, context = {}) {
  if (task === "classify") {
    const allowedTypes = new Set(["job", "product", "email", "meeting", "document", "other"]);
    return {
      type: allowedTypes.has(value?.type) ? value.type : "other",
      confidence: Number.isFinite(value?.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0,
      evidence: typeof value?.evidence === "string" ? value.evidence.trim().slice(0, 300) : ""
    };
  }

  if (task === "analyze_need") {
    const allowedScenarios = new Set(["meeting", "job", "purchase", "customer", "cost", "document", "data", "venture", "general"]);
    const goal = typeof value?.goal === "string" ? value.goal.trim().slice(0, 500) : "";
    const desiredOutput = typeof value?.desiredOutput === "string" ? value.desiredOutput.trim().slice(0, 500) : "";
    if (!goal || !desiredOutput) throw new Error("需求识别缺少目标或成果");
    const modelScenario = allowedScenarios.has(value?.scenario) ? value.scenario : "general";
    const scenario = refineScenario(modelScenario, `${context.text || ""}\n${goal}\n${desiredOutput}`);
    const scenarioWasRefined = scenario !== modelScenario;
    const defaults = defaultIntelligence(
      scenario,
      ALLOWED_ROLES.has(context.role) ? context.role : ALLOWED_ROLES.has(value?.role) ? value.role : ""
    );
    const knowledgeLenses = strings(value?.knowledgeLenses, 6, 40).filter((id) => ALLOWED_LENSES.has(id));
    return {
      scenario,
      role: defaults.role,
      goal,
      desiredOutput,
      facts: strings(value?.facts, 10, 300),
      constraints: strings(value?.constraints, 8, 300),
      missing: strings(value?.missing, 6, 300),
      capabilityGaps: !scenarioWasRefined && strings(value?.capabilityGaps, 4, 160).length ? strings(value?.capabilityGaps, 4, 160) : defaults.capabilityGaps,
      knowledgeLenses: !scenarioWasRefined && knowledgeLenses.length ? knowledgeLenses : defaults.knowledgeLenses,
      humanJudgments: !scenarioWasRefined && strings(value?.humanJudgments, 3, 180).length ? strings(value?.humanJudgments, 3, 180) : defaults.humanJudgments,
      agentDelegation: !scenarioWasRefined && strings(value?.agentDelegation, 4, 180).length ? strings(value?.agentDelegation, 4, 180) : defaults.agentDelegation,
      recommendedPath: !scenarioWasRefined && typeof value?.recommendedPath === "string" && value.recommendedPath.trim()
        ? value.recommendedPath.trim().slice(0, 300)
        : defaults.recommendedPath,
      skillCandidate: !scenarioWasRefined && typeof value?.skillCandidate === "string" && value.skillCandidate.trim()
        ? value.skillCandidate.trim().slice(0, 160)
        : defaults.skillCandidate
    };
  }

  const text = typeof value?.text === "string" ? value.text.trim() : "";
  if (!text) throw new Error("轻量模型返回缺少文字字段");
  return {
    text,
    language: typeof value?.language === "string" ? value.language.trim().slice(0, 30) : "",
    uncertain: Array.isArray(value?.uncertain)
      ? value.uncertain.filter((item) => typeof item === "string").slice(0, 20)
      : []
  };
}

function strings(value, limit = 8, maxLength = 300) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, limit).map((item) => item.trim().slice(0, maxLength))
    : [];
}

function normalizeProjectResult(value) {
  const artifact = {
    type: typeof value?.artifact?.type === "string" ? value.artifact.type.trim().slice(0, 40) : "document",
    title: typeof value?.artifact?.title === "string" ? value.artifact.title.trim().slice(0, 160) : "",
    content: typeof value?.artifact?.content === "string" ? value.artifact.content.trim().slice(0, 12000) : ""
  };
  const decisions = Array.isArray(value?.decisions) ? value.decisions.slice(0, 6).map((item, index) => ({
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim().slice(0, 60) : `decision-${index + 1}`,
    question: typeof item?.question === "string" ? item.question.trim().slice(0, 300) : "",
    why: typeof item?.why === "string" ? item.why.trim().slice(0, 400) : "",
    options: strings(item?.options, 6, 120),
    required: item?.required !== false
  })).filter((item) => item.question) : [];
  const execution = Array.isArray(value?.execution) ? value.execution.slice(0, 8).map((item) => ({
    label: typeof item?.label === "string" ? item.label.trim().slice(0, 160) : "",
    status: ["done", "waiting"].includes(item?.status) ? item.status : "waiting",
    detail: typeof item?.detail === "string" ? item.detail.trim().slice(0, 400) : ""
  })).filter((item) => item.label) : [];
  const skill = value?.skillCandidate || {};
  const skillCandidate = {
    name: typeof skill.name === "string" ? skill.name.trim().slice(0, 120) : "",
    trigger: typeof skill.trigger === "string" ? skill.trigger.trim().slice(0, 240) : "",
    inputs: strings(skill.inputs),
    steps: strings(skill.steps),
    checks: strings(skill.checks),
    output: typeof skill.output === "string" ? skill.output.trim().slice(0, 300) : "",
    approvalActions: strings(skill.approvalActions)
  };
  const result = {
    title: typeof value?.title === "string" ? value.title.trim().slice(0, 160) : "",
    status: value?.status === "ready" && !decisions.some((item) => item.required) ? "ready" : "needs_confirmation",
    summary: typeof value?.summary === "string" ? value.summary.trim().slice(0, 500) : "",
    ...defaultIntelligence(
      "general",
      ALLOWED_ROLES.has(value?.role) ? value.role : "general"
    ),
    artifact,
    decisions,
    execution,
    skillCandidate,
    risk: typeof value?.risk === "string" ? value.risk.trim().slice(0, 500) : ""
  };
  const modelLenses = strings(value?.knowledgeLenses, 6, 40).filter((id) => ALLOWED_LENSES.has(id));
  result.capabilityGaps = strings(value?.capabilityGaps, 5, 180).length ? strings(value?.capabilityGaps, 5, 180) : result.capabilityGaps;
  result.knowledgeLenses = modelLenses.length ? modelLenses : result.knowledgeLenses;
  result.humanJudgments = strings(value?.humanJudgments, 4, 180).length ? strings(value?.humanJudgments, 4, 180) : result.humanJudgments;
  result.agentDelegation = strings(value?.agentDelegation, 5, 180).length ? strings(value?.agentDelegation, 5, 180) : result.agentDelegation;
  result.recommendedPath = typeof value?.recommendedPath === "string" && value.recommendedPath.trim()
    ? value.recommendedPath.trim().slice(0, 300)
    : result.recommendedPath;
  result.skillCandidate = skillCandidate;
  if (!result.title || !artifact.title || !artifact.content || !skillCandidate.name || !skillCandidate.steps.length) {
    throw new Error("项目 Agent 返回缺少必要字段");
  }
  return result;
}

function createLocalProjectResult(body, goal) {
  const scenarioId = typeof body?.scenarioId === "string" ? body.scenarioId : "general";
  const solution = body?.solution && typeof body.solution === "object" ? body.solution : {};
  const suppliedSteps = strings(solution.steps, 6, 180);
  const steps = suppliedSteps.length ? suppliedSteps : [
    "明确最终要交付的成果",
    "整理已有事实与限制",
    "形成一版可以直接修改的初稿",
    "确认关键选择后再继续外部动作"
  ];
  const templates = {
    venture: { type: "validation_plan", heading: "第一版创业验证实验", prompts: ["真实问题：最近一次发生经过、频率与代价", "最高风险假设：客户、价值、付费或渠道", "最小证据：付费、试点、数据接入或明确时间承诺"] },
    data: { type: "knowledge_base", heading: "第一版资料沉淀方案", prompts: ["原始证据：保留原件、来源、时间与权限", "知识处理：解析、去重、分类、冲突标记", "验证方式：用五个真实问题检查引用与拒答"] },
    meeting: { type: "task_list", heading: "第一版行动清单", prompts: ["会议结论：待补充原始记录", "行动项：待补充", "负责人和截止时间：待确认"] },
    job: { type: "document", heading: "第一版准备清单", prompts: ["岗位最重要的要求：待补充岗位页面", "可证明的真实经历：待补充", "需要重点练习的问题：待确认"] },
    purchase: { type: "comparison", heading: "第一版比较框架", prompts: ["比较标准：预算、核心需求、长期成本", "候选产品与来源：待补充", "不能妥协的条件：待确认"] },
    customer: { type: "email", heading: "第一版沟通稿", prompts: ["沟通目标：待确认", "已知客户背景：待补充", "价格、时间和承诺：发送前确认"] },
    cost: { type: "plan", heading: "第一版提效机会清单", prompts: ["高频重复步骤：待补充", "当前耗时与频率：待补充", "允许自动执行的权限边界：待确认"] },
    document: { type: "document", heading: "第一版方案结构", prompts: ["读者与目标：待确认", "已有事实和材料：待补充", "成功标准：待确认"] },
    general: { type: "plan", heading: "第一版项目清单", prompts: ["期望成果：已记录", "已有材料与限制：待补充", "最终取舍：待确认"] }
  };
  const template = templates[scenarioId] || templates.general;
  const title = typeof solution.title === "string" && solution.title.trim()
    ? solution.title.trim().slice(0, 160)
    : "把眼前的需求变成可执行项目";
  const humanDecision = typeof solution.humanDecision === "string" && solution.humanDecision.trim()
    ? solution.humanDecision.trim().slice(0, 240)
    : "目标、关键事实与最终行动";
  const risk = /医疗|诊断|药物|法律|诉讼|投资|贷款|保险/.test(goal)
    ? "该目标涉及高影响领域，基础执行器只整理信息，结论必须由专业人士核验。"
    : "";

  const diagnosis = body?.context?.diagnosis && typeof body.context.diagnosis === "object"
    ? body.context.diagnosis
    : {};
  const desiredOutput = typeof diagnosis.desiredOutput === "string" ? diagnosis.desiredOutput.trim().slice(0, 500) : "";
  const knownFacts = strings(diagnosis.facts, 10, 300);
  const constraints = strings(diagnosis.constraints, 8, 300);
  const missing = strings(diagnosis.missing, 6, 300);
  const intelligenceDefaults = defaultIntelligence(scenarioId, solution.role || diagnosis.role);
  const knowledgeLenses = strings(solution.knowledgeLenses || diagnosis.knowledgeLenses, 6, 40).filter((id) => ALLOWED_LENSES.has(id));
  const personalizedContext = [
    desiredOutput ? `期望成果：${desiredOutput}` : "",
    knownFacts.length ? `已知信息\n${knownFacts.map((item) => `- ${item}`).join("\n")}` : "",
    constraints.length ? `限制条件\n${constraints.map((item) => `- ${item}`).join("\n")}` : "",
    missing.length ? `执行前待确认\n${missing.map((item) => `- ${item}`).join("\n")}` : ""
  ].filter(Boolean);

  return {
    title,
    status: "needs_confirmation",
    summary: "已形成一份可以直接补充和继续修改的项目初稿。",
    role: ALLOWED_ROLES.has(solution.role) ? solution.role : intelligenceDefaults.role,
    capabilityGaps: strings(solution.capabilityGaps || diagnosis.capabilityGaps, 5, 180).length
      ? strings(solution.capabilityGaps || diagnosis.capabilityGaps, 5, 180)
      : intelligenceDefaults.capabilityGaps,
    knowledgeLenses: knowledgeLenses.length ? knowledgeLenses : intelligenceDefaults.knowledgeLenses,
    humanJudgments: strings(solution.humanJudgments || diagnosis.humanJudgments, 4, 180).length
      ? strings(solution.humanJudgments || diagnosis.humanJudgments, 4, 180)
      : intelligenceDefaults.humanJudgments,
    agentDelegation: strings(solution.agentDelegation || diagnosis.agentDelegation, 5, 180).length
      ? strings(solution.agentDelegation || diagnosis.agentDelegation, 5, 180)
      : intelligenceDefaults.agentDelegation,
    recommendedPath: typeof solution.recommendedPath === "string" && solution.recommendedPath.trim()
      ? solution.recommendedPath.trim().slice(0, 300)
      : intelligenceDefaults.recommendedPath,
    artifact: {
      type: template.type,
      title: template.heading,
      content: [
        `目标：${goal}`,
        ...personalizedContext.flatMap((section) => ["", section]),
        "",
        template.heading,
        ...template.prompts.map((item, index) => `${index + 1}. ${item}`),
        "",
        "执行路径",
        ...steps.map((item, index) => `${index + 1}. ${item}`)
      ].join("\n")
    },
    decisions: [{
      id: "primary-decision",
      question: `请确认：${humanDecision}`,
      why: "这是影响结果或外部行动的关键选择，确认前不会自动发送、创建或发布。",
      options: ["按当前方案继续", "先补充信息"],
      required: true
    }],
    execution: [
      { label: "理解目标", status: "done", detail: "已识别场景和期望成果" },
      { label: "形成项目初稿", status: "done", detail: "已生成可编辑的结构和执行路径" },
      { label: "检查缺失信息", status: "done", detail: "缺失项已统一标记为待确认" },
      { label: "执行外部动作", status: "waiting", detail: "等待人工确认" }
    ],
    skillCandidate: {
      name: typeof solution.skillCandidate === "string" && solution.skillCandidate.trim()
        ? solution.skillCandidate.trim().slice(0, 120)
        : `${title}方法`,
      trigger: `再次遇到“${goal.slice(0, 80)}”一类需求时`,
      inputs: ["目标", "已有材料", "限制条件"],
      steps,
      checks: ["事实不得凭空补写", "关键取舍由人确认", "外部写入前再次确认"],
      output: template.heading,
      approvalActions: ["发送消息", "创建任务", "发布或对外承诺"]
    },
    risk
  };
}

function getMessageText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part?.text || "").join("");
  return "";
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.end();
  if (!isAllowedOrigin(String(req.headers?.origin || ""))) return sendJson(res, 403, { ok: false, error: "origin_not_allowed" });

  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const configured = Boolean(process.env.AI_API_KEY);
  const lightModel = process.env.AGNES_MODEL || DEFAULT_AGNES_MODEL;
  const lightUrl = process.env.AGNES_API_URL || DEFAULT_AGNES_URL;
  const lightConfigured = Boolean(process.env.AGNES_API_KEY);

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      configured,
      model,
      lightConfigured,
      lightModel,
      provider: process.env.AI_PROVIDER || "openai-compatible",
      privacy: "Only explicitly submitted text is sent to the model."
    });
  }

  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  const lightTask = LIGHT_TASK_PROMPTS[req.body?.task] ? req.body.task : "";
  const projectTask = req.body?.task === PROJECT_TASK;
  if (lightTask && !lightConfigured) return sendJson(res, 503, { ok: false, error: "light_model_not_configured" });
  if (!lightTask && !projectTask && !configured) return sendJson(res, 503, { ok: false, error: "model_not_configured" });
  if (isRateLimited(req)) return sendJson(res, 429, { ok: false, error: "rate_limited" });

  const text = projectTask
    ? (typeof req.body?.goal === "string" ? req.body.goal.trim() : "")
    : (typeof req.body?.text === "string" ? req.body.text.trim() : "");
  const mode = MODE_PROMPTS[req.body?.mode] ? req.body.mode : "clarify";
  const source = typeof req.body?.source === "string" ? req.body.source.slice(0, 200) : "当前任务";

  if (!text) return sendJson(res, 400, { ok: false, error: "empty_text" });
  if (text.length > MAX_INPUT_CHARS) return sendJson(res, 413, { ok: false, error: "input_too_long", limit: MAX_INPUT_CHARS });
  if (projectTask && !configured) {
    return sendJson(res, 200, {
      ok: true,
      result: createLocalProjectResult(req.body, text),
      meta: { model: "local-project-executor", route: "project-agent-local", inputTokens: null, outputTokens: null }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(lightTask ? lightUrl : `${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lightTask ? process.env.AGNES_API_KEY : process.env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: lightTask ? lightModel : model,
        messages: lightTask
          ? [
              { role: "system", content: LIGHT_TASK_PROMPTS[lightTask] },
              { role: "user", content: `来源：${source}\n用户选择的角色：${ALLOWED_ROLES.has(req.body?.role) ? req.body.role : "未指定"}\n\n已有文字：\n${text}` }
            ]
          : projectTask
            ? [
                { role: "system", content: PROJECT_SYSTEM_PROMPT },
                {
                  role: "user",
                  content: JSON.stringify({
                    goal: text,
                    scenarioId: typeof req.body?.scenarioId === "string" ? req.body.scenarioId.slice(0, 60) : "general",
                    source,
                    context: req.body?.context && typeof req.body.context === "object" ? req.body.context : {},
                    suggestedSolution: req.body?.solution && typeof req.body.solution === "object" ? req.body.solution : {}
                  })
                }
              ]
          : [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `来源：${source}\n任务模式：${MODE_PROMPTS[mode]}\n\n用户内容：\n${text}` }
            ],
        temperature: lightTask ? 0 : 0.25,
        max_tokens: lightTask ? 500 : projectTask ? 1600 : 700
      }),
      signal: controller.signal
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("AI upstream error", upstream.status, payload?.error?.code || "unknown");
      return sendJson(res, 502, { ok: false, error: "model_upstream_error" });
    }

    const parsed = extractJson(getMessageText(payload));
    const result = lightTask
      ? normalizeLightResult(lightTask, parsed, { text, role: req.body?.role })
      : projectTask
        ? normalizeProjectResult(parsed)
        : normalizeResult(parsed);
    if (lightTask === "analyze_need" && ALLOWED_ROLES.has(req.body?.role)) {
      result.role = req.body.role;
      const roleData = KNOWLEDGE_MAP.roles.find((item) => item.id === result.role);
      if (roleData && !parsed?.recommendedPath) result.recommendedPath = roleData.path;
    }
    return sendJson(res, 200, {
      ok: true,
      result,
      meta: {
        model: lightTask ? lightModel : model,
        route: lightTask ? "light" : projectTask ? "project-agent" : "main",
        inputTokens: payload?.usage?.prompt_tokens || null,
        outputTokens: payload?.usage?.completion_tokens || null
      }
    });
  } catch (error) {
    const code = error?.name === "AbortError" ? "model_timeout" : "invalid_model_response";
    console.error("AI companion error", code);
    return sendJson(res, code === "model_timeout" ? 504 : 502, { ok: false, error: code });
  } finally {
    clearTimeout(timeout);
  }
};
