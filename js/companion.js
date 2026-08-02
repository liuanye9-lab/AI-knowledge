(function () {
  "use strict";

  const form = document.getElementById("scenario-form");
  const input = document.getElementById("scenario-input");
  const knowledgeMap = window.AI_KNOWLEDGE_MAP;
  const rolePicker = document.getElementById("role-picker");
  const submitButton = form.querySelector('button[type="submit"]');
  const panel = document.getElementById("solution-panel");
  const projectHero = document.querySelector(".project-hero");
  const title = document.getElementById("solution-title");
  const badge = document.getElementById("fit-badge");
  const reason = document.getElementById("solution-reason");
  const humanInput = document.getElementById("human-input");
  const diagnosisOutput = document.getElementById("diagnosis-output");
  const diagnosisKnown = document.getElementById("diagnosis-known");
  const diagnosisMissing = document.getElementById("diagnosis-missing");
  const agentWork = document.getElementById("agent-work");
  const humanDecision = document.getElementById("human-decision");
  const steps = document.getElementById("project-steps");
  const toolTitle = document.getElementById("tool-title");
  const toolReason = document.getElementById("tool-reason");
  const coreMethod = document.getElementById("core-method");
  const methodDetails = document.getElementById("method-details");
  const methodExplanation = document.getElementById("method-explanation");
  const startButton = document.getElementById("start-project");
  const executionPanel = document.getElementById("agent-execution");
  const executionTitle = document.getElementById("agent-execution-title");
  const executionStatus = document.getElementById("agent-execution-status");
  const executionProgress = document.getElementById("agent-progress");
  const artifactTitle = document.getElementById("agent-artifact-title");
  const artifactContent = document.getElementById("agent-artifact-content");
  const decisionList = document.getElementById("agent-decision-list");
  const skillDraft = document.getElementById("skill-draft");
  const skillDraftContent = document.getElementById("skill-draft-content");
  const agentHandoff = document.getElementById("agent-handoff");
  const projectList = document.getElementById("project-list");
  const toast = document.getElementById("toast");
  const recommendedRole = document.getElementById("recommended-role");
  const changeRole = document.getElementById("change-role");
  const capabilityGapList = document.getElementById("capability-gap-list");
  const knowledgeLensLinks = document.getElementById("knowledge-lens-links");
  const humanJudgmentList = document.getElementById("human-judgment-list");
  const agentDelegationList = document.getElementById("agent-delegation-list");
  const recommendedPath = document.getElementById("recommended-path");
  const solutionLensImage = document.getElementById("solution-lens-image");

  const PROJECT_STORAGE_KEY = "aiCompanionProjects";
  let currentSolution = null;
  let selectedRole = new URLSearchParams(location.search).get("role") || "general";

  const scenarios = [
    {
      id: "venture",
      keywords: ["创业", "商业", "生意", "付费", "客户需求", "产品想法", "创新", "市场", "mvp"],
      title: "把创业想法变成一个最小验证实验",
      reason: "AI 可以加速访谈整理、原型和交付，但真实需求、付费意愿和单位经济必须从现实行为获得证据。",
      input: "最近一次真实问题、谁遇到、发生频率、当前替代方案和你已有的资源",
      agent: "整理问题证据、识别最高风险假设、设计最小实验",
      decision: "目标客户、可承受损失、价格和是否继续投入",
      tools: "客户访谈 + 人工交付 + AI Agent + 飞书多维表格",
      toolReason: "先用访谈和人工加 Agent 完成一次结果，再用多维表格记录承诺、成本和复购证据。",
      steps: ["还原最近一次真实问题和当前替代方案", "写出客户、价值结果和付费假设", "设计一个七天内可完成的最小交付实验", "争取付费或试点承诺，复盘后沉淀为 Skill"],
      method: "先获得真实承诺，再扩大产品投入。",
      explanation: "AI 让原型变便宜，但无法替代客户证据；最小实验的目标是减少不确定性，不是展示最多功能。"
    },
    {
      id: "data",
      keywords: ["数据", "资料", "信息", "知识库", "去噪", "沉淀", "归档", "文件夹", "分类"],
      title: "把杂乱资料变成可追溯的知识库",
      reason: "AI 适合解析、去重、分类和生成知识卡片，但来源可信度、权限与冲突版本需要你确认。",
      input: "资料位置、最终要解决的问题和不能外传的边界",
      agent: "解析材料、去重归类、提取事实并保留来源",
      decision: "可信来源、冲突版本、权限和淘汰规则",
      tools: "Docling + 结构化表格 + 飞书知识库",
      toolReason: "先把原始资料解析为可追溯内容，再将字段写入表格，最终在飞书中协作和查找。",
      steps: ["登记原文件、来源、时间和权限，不覆盖原件", "解析正文、表格和图片，并去除重复与模板噪音", "生成带来源、条件和状态的知识卡片", "用真实问题验证检索，再把稳定流程沉淀为 Skill"],
      method: "原始证据保留不动，AI 生成的知识层始终可以重建。",
      explanation: "把事实源与 AI 推断分开，既能降低整理成本，也能在模型犯错或资料更新时重新处理。"
    },
    {
      id: "meeting",
      keywords: ["会议", "周会", "纪要", "讨论", "访谈"],
      title: "把会议内容变成可执行任务",
      reason: "AI 很适合从大量记录里提取行动项，但负责人、截止时间和承诺必须由你确认。",
      input: "会议记录与希望达成的结果",
      agent: "提炼结论、拆分任务、发现遗漏",
      decision: "负责人、时间与对外承诺",
      tools: "飞书妙记 + 飞书文档 + 飞书任务",
      toolReason: "妙记提供原始记录，文档承载初稿，确认后再创建任务并通知负责人。",
      steps: ["读取记录，区分结论、分歧和待办", "生成负责人、下一步、完成标准初稿", "标出缺失信息，请你一次确认", "写入飞书并形成可追踪任务"],
      method: "先从事实中提炼初稿，再集中确认责任与承诺。",
      explanation: "新手先看完整示例，能降低同时理解工具和任务的负担；你只在高影响决策点介入。"
    },
    {
      id: "job",
      keywords: ["岗位", "面试", "简历", "招聘", "求职"],
      title: "把岗位要求变成针对性准备项目",
      reason: "AI 可以快速归纳岗位重点、匹配经历并模拟问答，但不能替你编造经历。",
      input: "岗位页面与你真实做过的事情",
      agent: "提炼要求、匹配经历、生成练习",
      decision: "哪些经历真实且最有说服力",
      tools: "浏览器侧边栏 + AI 助手 + 飞书文档",
      toolReason: "侧边栏读取岗位，AI 助手完成匹配，文档保存最终面试准备清单。",
      steps: ["提取岗位最重要的五项要求", "从真实经历中寻找可证明的对应材料", "生成回答初稿和追问清单", "由你确认真实性后形成准备文档"],
      method: "先提取评价标准，再用真实经历逐项匹配。",
      explanation: "具体示例比抽象概念更容易形成可迁移的解决结构；AI 负责匹配，人负责真实性。"
    },
    {
      id: "purchase",
      keywords: ["购买", "产品", "对比", "比较", "选择", "价格"],
      title: "围绕真实条件完成一次购买比较",
      reason: "AI 能整理大量参数并按你的条件比较，但实时价格、售后条款和关键参数仍需回到来源核验。",
      input: "候选产品和你真正关心的条件",
      agent: "收集差异、统一口径、生成比较表",
      decision: "预算、取舍与最终购买",
      tools: "浏览器侧边栏 + 比较表 + 来源核验",
      toolReason: "从当前商品页抓取已知信息，用同一标准比较，并保留来源供你确认。",
      steps: ["把你的条件排成优先顺序", "统一提取每个产品的可比信息", "标记缺失、冲突和营销表述", "生成带来源的购买建议"],
      method: "先定比较标准，再看产品，不被单一卖点带走。",
      explanation: "把注意力放在少数决定结果的条件上，可以减少无关信息占用工作记忆。"
    },
    {
      id: "customer",
      keywords: ["客服", "客户服务", "服务客户", "售后", "客户", "邮件", "回复", "跟进", "销售", "报价"],
      title: "把客户背景变成一份可发送的沟通稿",
      reason: "AI 适合整理背景和起草内容，但价格、承诺、隐私信息与发送动作需要你确认。",
      input: "客户背景、沟通目标和已有事实",
      agent: "整理上下文、起草内容、检查遗漏",
      decision: "价格、承诺与是否发送",
      tools: "AI 助手 + 飞书文档 + 飞书消息",
      toolReason: "先在文档中生成可审核稿，确认关键内容后再进入飞书协同或发送。",
      steps: ["提取客户关心的问题和上下文", "形成简短、明确的沟通初稿", "高亮价格、时间和承诺", "你确认后交给飞书继续协作"],
      method: "AI 先写可审核稿，人只确认高影响信息。",
      explanation: "一次确认一组关键选择，比对每个小步骤反复授权更省注意力，也更不容易忽略风险。"
    },
    {
      id: "cost",
      keywords: ["成本", "效率", "重复", "流程", "自动化", "省钱", "加班"],
      title: "找出最值得交给 AI 的重复工作",
      reason: "AI 能盘点流程、估算重复劳动并提出自动化候选，但是否值得投入取决于频率、风险和节省量。",
      input: "当前流程、频率和大致耗时",
      agent: "拆解步骤、估算收益、排序机会",
      decision: "允许自动执行的权限边界",
      tools: "飞书多维表格 + AI 助手 + 自动化",
      toolReason: "多维表格记录流程数据，AI 找规律，验证收益后再开启自动化。",
      steps: ["记录一周内重复发生的工作", "按频率、耗时和风险排序", "选一个低风险步骤做小范围试运行", "验证节省后沉淀为可复用 Skill"],
      method: "优先自动化高频、规则清楚、出错可恢复的步骤。",
      explanation: "二八法则不是猜 20%，而是用频率与收益找出少数真正影响结果的环节。"
    },
    {
      id: "document",
      keywords: ["方案", "文档", "报告", "写", "总结", "内容"],
      title: "把零散材料变成一份可交付方案",
      reason: "AI 适合组织结构、补充检查项和生成初稿，但目标、事实与最终立场仍需要你决定。",
      input: "目标、读者和已有材料",
      agent: "整理结构、生成初稿、检查缺口",
      decision: "目标、事实和最终立场",
      tools: "AI 助手 + 飞书文档",
      toolReason: "AI 完成结构化初稿，飞书文档承载批注、协作和最终交付。",
      steps: ["明确这份材料给谁看、要促成什么", "按目标整理已有事实和限制", "生成一版可直接修改的完整初稿", "确认事实后在飞书中协作交付"],
      method: "先定读者和结果，再组织材料与表达。",
      explanation: "让完整示例先出现，再逐步减少帮助，比先灌输写作框架更适合新手。"
    }
  ];

  const fallbackScenario = {
    id: "general",
    keywords: [],
    title: "先把这件事拆成一个可完成的小项目",
    reason: "是否值得使用 AI，取决于任务是否包含大量整理、比较、生成或重复操作。我们先做低成本判断。",
    input: "想达成的结果、已有材料和限制",
    agent: "拆解、生成初稿、记录和检查",
    decision: "目标、关键取舍与最终行动",
    tools: "AI 助手 + 浏览器侧边栏 + 飞书文档",
    toolReason: "先用最少工具跑通一次，再根据真实需求增加协作或自动化。",
    steps: ["说清最终要得到什么成果", "整理已有信息和不能触碰的边界", "让 Agent 生成一版完整示例", "由你确认关键选择并决定是否复用"],
    method: "人定义目标和边界，Agent 执行，人确认关键结果。",
    explanation: "把复杂任务外化成步骤，可以减少记忆负担；只解释当前决策需要的核心知识。"
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function readProjects() {
    try { return JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  function roleById(id) {
    return knowledgeMap?.roles?.find((role) => role.id === id) || knowledgeMap?.roles?.find((role) => role.id === "general");
  }

  function renderRolePicker() {
    if (!knowledgeMap || !rolePicker) return;
    rolePicker.innerHTML = knowledgeMap.roles.map((role) =>
      `<button type="button" data-role="${role.id}" class="${role.id === selectedRole ? "is-selected" : ""}">${role.name}</button>`
    ).join("");
  }

  function setRole(roleId, rerender = true) {
    if (!knowledgeMap?.roles?.some((role) => role.id === roleId)) roleId = "general";
    selectedRole = roleId;
    renderRolePicker();
    if (rerender && currentSolution) {
      currentSolution.diagnosis.role = roleId;
      renderSolution(currentSolution.goal, currentSolution.diagnosis);
    }
  }

  function listItems(root, values) {
    root.textContent = "";
    values.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      root.appendChild(item);
    });
  }

  function fallbackIntelligence(solution, diagnosis) {
    const route = knowledgeMap?.scenarioLenses?.[solution.id] || knowledgeMap?.scenarioLenses?.general;
    const role = diagnosis?.role || selectedRole || route?.role || "general";
    const lensIds = diagnosis?.knowledgeLenses?.length ? diagnosis.knowledgeLenses : route?.lenses || ["product", "systems", "human"];
    const lensNames = lensIds.map((id) => knowledgeMap?.lenses?.[id]?.name).filter(Boolean);
    return {
      role,
      capabilityGaps: diagnosis?.capabilityGaps?.length
        ? diagnosis.capabilityGaps
        : lensNames.slice(0, 4).map((name) => `用${name}检查当前方案`),
      knowledgeLenses: lensIds,
      humanJudgments: diagnosis?.humanJudgments?.length
        ? diagnosis.humanJudgments
        : ["最终要改善的结果", "事实、约束和不可妥协条件", solution.decision],
      agentDelegation: diagnosis?.agentDelegation?.length
        ? diagnosis.agentDelegation
        : [solution.agent, "整理证据并标记缺口", "生成第一版成果与检查清单"],
      recommendedPath: diagnosis?.recommendedPath || roleById(role)?.path || "目标 → 证据 → 判断 → Agent 执行 → 验收",
      skillCandidate: diagnosis?.skillCandidate || `${solution.title}判断与执行 Skill`
    };
  }

  function renderIntelligence(solution, diagnosis) {
    if (!knowledgeMap) return;
    const intelligence = fallbackIntelligence(solution, diagnosis);
    const role = roleById(intelligence.role);
    recommendedRole.textContent = role?.name || "通用职场";
    listItems(capabilityGapList, intelligence.capabilityGaps.slice(0, 5));
    listItems(humanJudgmentList, intelligence.humanJudgments.slice(0, 4));
    listItems(agentDelegationList, intelligence.agentDelegation.slice(0, 4));
    knowledgeLensLinks.textContent = "";
    intelligence.knowledgeLenses.slice(0, 6).forEach((lensId) => {
      const lens = knowledgeMap.lenses[lensId];
      if (!lens) return;
      const anchor = document.createElement("a");
      anchor.href = lens.hub;
      anchor.textContent = lens.name;
      knowledgeLensLinks.appendChild(anchor);
    });
    recommendedPath.textContent = intelligence.recommendedPath;
    const firstLens = intelligence.knowledgeLenses[0];
    const imageMap = {
      technology: "images/product/technology-layers-watercolor.webp",
      business: "images/product/business-value-loop-watercolor.webp",
      product: "images/product/product-discovery-loop-watercolor.webp",
      human: "images/product/cognition-design-loop-watercolor.webp",
      organization: "images/product/organization-decision-map-watercolor.webp",
      systems: "images/product/systems-uncertainty-map-watercolor.webp"
    };
    solutionLensImage.src = imageMap[firstLens] || "images/product/tech-business-product-triangle-watercolor.webp";
    solutionLensImage.alt = `本次需要调用${intelligence.knowledgeLenses.map((id) => knowledgeMap.lenses[id]?.name).filter(Boolean).join("、")}的水彩判断模型`;
    diagnosis.role = intelligence.role;
    diagnosis.capabilityGaps = intelligence.capabilityGaps;
    diagnosis.knowledgeLenses = intelligence.knowledgeLenses;
    diagnosis.humanJudgments = intelligence.humanJudgments;
    diagnosis.agentDelegation = intelligence.agentDelegation;
    diagnosis.recommendedPath = intelligence.recommendedPath;
    diagnosis.skillCandidate = intelligence.skillCandidate;
    selectedRole = intelligence.role;
    renderRolePicker();
  }

  function identifyScenario(goal, diagnosis) {
    const normalized = String(goal || "").toLowerCase();
    const sensitive = /医疗|诊断|药物|法律|诉讼|投资|贷款|保险/.test(normalized);
    const analyzed = scenarios.find((item) => item.id === diagnosis?.scenario);
    const genericKeywords = new Set(["产品", "选择", "比较", "方案", "写", "内容", "信息"]);
    const matched = scenarios
      .map((item) => ({
        item,
        score: item.keywords.reduce((total, word) => {
          if (!normalized.includes(word)) return total;
          return total + (genericKeywords.has(word) ? 1 : Math.max(2, word.length + 1));
        }, 0)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    const scenario = matched[0]?.score >= 2 ? matched[0].item : analyzed || matched[0]?.item || fallbackScenario;
    return { ...scenario, fit: sensitive ? "辅助使用" : "适合协同", sensitive };
  }

  function fallbackDiagnosis(goal) {
    const solution = identifyScenario(goal);
    const sentences = String(goal).split(/[。！？\n]/).map((item) => item.trim()).filter(Boolean);
    const constraints = sentences.filter((item) => /预算|时间|之前|以内|不超过|必须|不能|面向|用于/.test(item)).slice(0, 4);
    return {
      scenario: solution.id,
      role: selectedRole,
      goal: String(goal).slice(0, 500),
      desiredOutput: String(goal).slice(0, 500),
      facts: sentences.filter((item) => !constraints.includes(item)).slice(0, 6),
      constraints,
      missing: [],
      ...fallbackIntelligence(solution, { role: selectedRole })
    };
  }

  async function analyzeNeed(goal) {
    try {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "analyze_need", text: goal, role: selectedRole, source: "需求项目台" })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || "analysis_failed");
      return payload.result;
    } catch {
      return fallbackDiagnosis(goal);
    }
  }

  function renderSolution(goal, diagnosis = fallbackDiagnosis(goal)) {
    const solution = identifyScenario(goal, diagnosis);
    currentSolution = { ...solution, goal, diagnosis };
    startButton.textContent = "生成第一版成果";
    methodDetails.setAttribute("aria-expanded", "false");
    methodDetails.textContent = "为什么这样做";
    methodExplanation.hidden = true;
    executionPanel.hidden = true;
    agentHandoff.hidden = true;
    title.textContent = solution.title;
    badge.textContent = solution.fit;
    badge.classList.toggle("is-caution", solution.sensitive);
    reason.textContent = solution.sensitive
      ? `${solution.reason} 当前内容可能属于高影响领域，AI 只能辅助整理，不代替专业判断。`
      : `系统根据你写下的目标、材料和限制生成以下方案。${solution.reason}`;
    diagnosisOutput.textContent = diagnosis.desiredOutput || goal;
    const known = [...(diagnosis.facts || []), ...(diagnosis.constraints || [])].slice(0, 4);
    diagnosisKnown.textContent = known.length ? known.join("；") : "目前只识别到目标，执行时会保留待确认项";
    diagnosisMissing.textContent = diagnosis.missing?.length ? diagnosis.missing.join("；") : "暂无必须先回答的问题";
    humanInput.textContent = known.length ? `已提供 ${known.length} 条事实或限制` : solution.input;
    agentWork.textContent = solution.agent;
    humanDecision.textContent = solution.decision;
    toolTitle.textContent = solution.tools;
    toolReason.textContent = solution.toolReason;
    coreMethod.textContent = solution.method;
    methodExplanation.textContent = solution.explanation;
    renderIntelligence(solution, diagnosis);
    steps.textContent = "";
    solution.steps.forEach((step, index) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${index + 1}</span><p>${step}</p>`;
      steps.appendChild(item);
    });
    panel.hidden = false;
  }

  async function runDiagnosis(goal) {
    submitButton.disabled = true;
    submitButton.textContent = "正在理解…";
    const diagnosis = await analyzeNeed(goal);
    renderSolution(goal, diagnosis);
    submitButton.disabled = false;
    submitButton.textContent = "更新方案";
  }

  function saveProject(project) {
    const projects = readProjects().filter((item) => item.goal !== project.goal);
    projects.unshift(project);
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects.slice(0, 12)));
    renderProjects();
  }

  function renderProgress(items) {
    executionProgress.textContent = "";
    const stages = items?.length ? items : [
      { label: "理解目标", status: "done" },
      { label: "形成初稿", status: "waiting" },
      { label: "检查遗漏", status: "waiting" },
      { label: "等待确认", status: "waiting" }
    ];
    stages.slice(0, 8).forEach((stage) => {
      const item = document.createElement("li");
      item.className = stage.status === "done" ? "is-done" : "";
      item.textContent = stage.label;
      if (stage.detail) item.title = stage.detail;
      executionProgress.appendChild(item);
    });
  }

  function renderAgentResult(result) {
    executionTitle.textContent = result.title;
    executionStatus.textContent = result.status === "ready" ? "成果已就绪" : "等待你确认";
    artifactTitle.textContent = result.artifact.title;
    artifactContent.textContent = result.artifact.content;
    renderProgress(result.execution);

    decisionList.textContent = "";
    if (!result.decisions.length) {
      const ready = document.createElement("p");
      ready.textContent = "没有必须补充的信息，可以直接检查成果。";
      decisionList.appendChild(ready);
    } else {
      result.decisions.forEach((decision) => {
        const item = document.createElement("article");
        item.className = "agent-decision-item";
        const question = document.createElement("strong");
        const why = document.createElement("small");
        question.textContent = decision.question;
        why.textContent = decision.why || "确认后才会继续外部动作。";
        item.append(question, why);
        decisionList.appendChild(item);
      });
    }

    const skill = result.skillCandidate;
    skillDraftContent.textContent = "";
    const name = document.createElement("strong");
    const details = document.createElement("p");
    name.textContent = skill.name;
    details.textContent = [
      skill.trigger ? `适用时机：${skill.trigger}` : "",
      skill.steps?.length ? `可复用步骤：${skill.steps.join(" → ")}` : "",
      skill.checks?.length ? `检查：${skill.checks.join("；")}` : "",
      skill.approvalActions?.length ? `需要确认后执行：${skill.approvalActions.join("、")}` : ""
    ].filter(Boolean).join("\n");
    skillDraftContent.append(name, details);
    skillDraft.open = false;
    agentHandoff.hidden = false;
  }

  function renderAgentError(error) {
    executionTitle.textContent = "项目已保存，Agent 暂未开始";
    executionStatus.textContent = "需要配置";
    artifactTitle.textContent = "执行层暂时不可用";
    artifactContent.textContent = error === "model_not_configured"
      ? "服务端尚未配置模型密钥。你的项目已经保存在本机，配置完成后可再次点击开始。"
      : "这次没有成功取得执行结果。项目已经保留，请稍后再次点击开始。";
    decisionList.textContent = "";
    const message = document.createElement("p");
    message.textContent = "没有发生发送、创建任务或其他外部写入。";
    decisionList.appendChild(message);
    renderProgress([{ label: "保存项目", status: "done" }, { label: "调用 Agent", status: "waiting" }]);
  }

  function renderProjects() {
    const projects = readProjects();
    projectList.textContent = "";
    if (!projects.length) {
      projectList.innerHTML = '<article class="empty-project"><strong>还没有项目</strong><p>从上面说一句需求，第一份项目方案会出现在这里。</p></article>';
      return;
    }
    projects.slice(0, 3).forEach((project) => {
      const article = document.createElement("article");
      article.className = "active-project-card";
      article.innerHTML = `<div><small>下一步</small><h3>${project.title}</h3><p>${project.next}</p></div><span>继续 →</span>`;
      article.addEventListener("click", () => {
        input.value = project.goal;
        renderSolution(project.goal, project.diagnosis);
      });
      projectList.appendChild(article);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const goal = input.value.trim();
    if (!goal) return input.focus();
    await runDiagnosis(goal);
  });

  rolePicker?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-role]");
    if (!button) return;
    setRole(button.dataset.role);
  });

  changeRole?.addEventListener("click", () => {
    rolePicker.scrollIntoView({ behavior: "smooth", block: "center" });
    rolePicker.querySelector(".is-selected")?.focus();
  });

  document.querySelectorAll("[data-goal]").forEach((button) => {
    button.addEventListener("click", async () => {
      input.value = button.dataset.goal;
      await runDiagnosis(button.dataset.goal);
    });
  });

  methodDetails.addEventListener("click", () => {
    const expanded = methodDetails.getAttribute("aria-expanded") === "true";
    methodDetails.setAttribute("aria-expanded", String(!expanded));
    methodExplanation.hidden = expanded;
    methodDetails.textContent = expanded ? "为什么这样做" : "收起解释";
  });

  startButton.addEventListener("click", async () => {
    if (!currentSolution) return;
    const project = {
      goal: currentSolution.goal,
      title: currentSolution.title,
      next: currentSolution.steps[0],
      status: "running",
      diagnosis: currentSolution.diagnosis,
      role: currentSolution.diagnosis.role,
      knowledgeLenses: currentSolution.diagnosis.knowledgeLenses,
      createdAt: new Date().toISOString()
    };
    saveProject(project);
    executionPanel.hidden = false;
    executionTitle.textContent = "正在形成第一版成果";
    executionStatus.textContent = "执行中";
    artifactTitle.textContent = "准备中";
    artifactContent.textContent = "Agent 正在整理目标、生成初稿并检查遗漏。";
    decisionList.innerHTML = "<p>关键选择会集中出现在这里。</p>";
    skillDraftContent.textContent = "";
    agentHandoff.hidden = true;
    renderProgress();
    startButton.disabled = true;
    startButton.textContent = "Agent 执行中…";

    try {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "execute_project",
          goal: currentSolution.goal,
          scenarioId: currentSolution.id,
          source: "需求项目台",
          context: {
            originalText: currentSolution.goal,
            diagnosis: currentSolution.diagnosis
          },
          solution: {
            title: currentSolution.title,
            steps: currentSolution.steps,
            tools: currentSolution.tools,
            humanDecision: currentSolution.decision
            ,
            role: currentSolution.diagnosis.role,
            capabilityGaps: currentSolution.diagnosis.capabilityGaps,
            knowledgeLenses: currentSolution.diagnosis.knowledgeLenses,
            humanJudgments: currentSolution.diagnosis.humanJudgments,
            agentDelegation: currentSolution.diagnosis.agentDelegation,
            recommendedPath: currentSolution.diagnosis.recommendedPath,
            skillCandidate: currentSolution.diagnosis.skillCandidate
          }
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || "request_failed");
      renderAgentResult(payload.result);
      saveProject({
        ...project,
        title: payload.result.title,
        next: payload.result.decisions[0]?.question || "检查并使用第一版成果",
        status: payload.result.status,
        artifact: payload.result.artifact,
        skillCandidate: payload.result.skillCandidate
      });
      startButton.textContent = "重新执行";
      showToast("第一版成果已生成，只需确认关键选择");
    } catch (error) {
      renderAgentError(error.message);
      startButton.textContent = "再次尝试";
      showToast("项目已保存，Agent 暂未取得结果");
    } finally {
      startButton.disabled = false;
    }
  });

  // 主入口先判断 AI 是否值得介入，再生成方案；项目完成后沉淀为可复用方法或 Skill。
  projectHero.after(panel);
  renderRolePicker();
  renderProjects();
  const queryGoal = new URLSearchParams(location.search).get("goal");
  if (queryGoal) {
    input.value = queryGoal.slice(0, 500);
    runDiagnosis(input.value);
  }
})();
