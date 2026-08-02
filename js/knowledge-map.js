(function (root, factory) {
  var data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  if (root) root.AI_KNOWLEDGE_MAP = data;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var lenses = {
    technology: { id: "technology", name: "技术判断", short: "系统、取舍、可靠性", hub: "technology-engineering.html" },
    business: { id: "business", name: "业务判断", short: "客户、价值、成本", hub: "business-product.html" },
    product: { id: "product", name: "产品判断", short: "需求、优先级、验证", hub: "business-product.html" },
    human: { id: "human", name: "人脑与设计", short: "认知、体验、行为", hub: "human-design.html" },
    organization: { id: "organization", name: "组织与沟通", short: "协作、激励、责任", hub: "organization-decision.html" },
    systems: { id: "systems", name: "系统与决策", short: "反馈、概率、风险", hub: "organization-decision.html" }
  };

  var hubs = [
    {
      id: "technology-engineering",
      title: "技术与工程",
      href: "technology-engineering.html",
      summary: "不背语法，理解系统为什么这样搭、哪里会坏、怎样验收。",
      image: "images/product/technology-layers-watercolor.webp",
      modelImage: "images/product/language-tradeoffs-watercolor.webp",
      decision: "这项技术是否适合当前业务、团队和风险，而不只是能不能做。",
      essentials: ["抽象与分层", "数据、接口与状态", "可靠性、安全和成本", "构建与购买的取舍", "技术债与可维护性"],
      agent: ["检索技术选项与案例", "生成原型和测试", "比较性能、成本与依赖", "整理架构决策记录"],
      human: ["定义真实约束和验收标准", "决定取舍与可承受风险", "识别团队长期维护能力", "对安全和外部影响负责"],
      failure: "把“模型能生成代码”误当成“系统可以长期可靠运行”。",
      case: "为客服知识助手选型：先比较数据权限、引用准确率、延迟、维护者和失败回退，再决定自建或采购。",
      checklist: ["目标结果是否可验收", "数据从哪里来、谁能访问", "故障时如何发现和回退", "一年后的维护者是谁", "最贵的失败是什么"],
      skill: "技术方案取舍与验收 Skill",
      topics: [
        ["计算思维", "把问题拆成输入、状态、规则、输出和例外。"],
        ["系统架构", "通过边界、接口、数据流和故障模式理解系统。"],
        ["数据与 AI", "区分原始证据、特征、模型输出、检索和反馈。"],
        ["软件工程", "版本、测试、观测、安全和协作决定长期质量。"],
        ["语言取舍", "Python 重迭代与生态，Java 重稳定治理，C 重硬件控制，TypeScript 重产品交付。"]
      ],
      sources: [
        ["研究证据", "Computational Thinking · Jeannette Wing", "https://doi.org/10.1145/1118178.1118215"],
        ["开源实现", "OSSU Computer Science", "https://github.com/ossu/computer-science"],
        ["开源实现", "System Design Primer", "https://github.com/donnemartin/system-design-primer"],
        ["实践方法", "Designing Data-Intensive Applications · Martin Kleppmann", "https://dataintensive.net/"]
      ]
    },
    {
      id: "business-product",
      title: "商业与产品",
      href: "business-product.html",
      summary: "从客户结果、价值流和证据出发，判断什么值得做、谁会付出成本。",
      image: "images/product/business-value-loop-watercolor.webp",
      modelImage: "images/product/product-discovery-loop-watercolor.webp",
      decision: "用户真正要解决的问题是什么，这个结果是否值得持续投入。",
      essentials: ["客户任务与替代方案", "价值链和单位经济", "产品发现与最小实验", "指标与反指标", "战略选择和机会成本"],
      agent: ["整理访谈和市场资料", "形成原型与实验材料", "分析数据和模式", "生成不同方案的成本收益比较"],
      human: ["选择服务谁与不服务谁", "判断承诺是否真实", "决定价格、定位和投入", "承担客户关系与商业伦理"],
      failure: "因为 AI 让开发变便宜，就跳过需求、渠道和付费证据。",
      case: "验证一项企业 AI 服务：先取得真实问题、数据接入或付费承诺，再扩大自动化范围。",
      checklist: ["最近一次问题何时发生", "当前替代方案和真实代价", "谁拥有预算和决策权", "最小可验证承诺是什么", "什么证据会让我们停止"],
      skill: "客户问题与商业验证 Skill",
      topics: [
        ["客户与市场", "从具体情境、当前做法和付出代价理解需求。"],
        ["商业模型", "看收入、成本、现金、渠道、复购和风险如何连接。"],
        ["产品发现", "用原型和行为证据减少最危险的不确定性。"],
        ["运营流程", "把价值流、等待、返工、责任和数据画在同一张图上。"],
        ["创新创业", "先验证承诺，再投入产品；先缩短证据路径，再追求规模。"]
      ],
      sources: [
        ["实践方法", "The Practice of Management · Peter Drucker", "https://www.harpercollins.com/products/the-practice-of-management-peter-f-drucker"],
        ["实践方法", "Competitive Strategy · Michael Porter", "https://www.hbs.edu/faculty/Pages/item.aspx?num=195"],
        ["实践方法", "Competing Against Luck · Clayton Christensen", "https://www.christenseninstitute.org/books/competing-against-luck/"],
        ["研究证据", "Navigating the Jagged Technological Frontier", "https://aiinstitute.hbs.edu/navigating-the-jagged-technological-frontier/"]
      ]
    },
    {
      id: "human-design",
      title: "人脑与设计",
      href: "human-design.html",
      summary: "理解注意力、记忆、偏差和反馈，让产品顺应人，而不是增加负担。",
      image: "images/product/cognition-design-loop-watercolor.webp",
      modelImage: "images/product/interdisciplinary-constellation-watercolor.webp",
      decision: "这个界面和协作方式，是否帮助人看见关键关系并做出更好的判断。",
      essentials: ["注意力与认知负荷", "工作记忆与长期记忆", "心理模型和类比", "偏差与元认知", "可供性、反馈与可访问性"],
      agent: ["把复杂信息分层和可视化", "生成多种解释与示例", "根据上下文提醒遗漏", "模拟不同用户视角"],
      human: ["定义何为理解和可用", "观察真实行为而非自我报告", "判断说服是否越过操纵边界", "对人的尊严与可访问性负责"],
      failure: "把内容画得好看，却没有减少选择、澄清关系或支持行动。",
      case: "面向全年龄用户的 AI 助手：默认只展示下一步与三个判断，需要时再展开原理和来源。",
      checklist: ["首屏是否只有一个主任务", "信息能否分块和渐进展开", "反馈是否立即且可理解", "错误能否撤回和恢复", "视觉是否在表达关系而非装饰"],
      skill: "认知负荷与可用性审查 Skill",
      topics: [
        ["认知负荷", "让工作记忆只处理当前决策需要的少量信息。"],
        ["记忆与迁移", "通过提取、间隔和真实应用建立可再次调用的连接。"],
        ["心理模型", "先用熟悉结构建立画面，再补抽象术语。"],
        ["人机交互", "清楚的可供性、状态反馈和错误恢复降低学习门槛。"],
        ["行为与伦理", "设计应帮助自主决策，而不是利用注意力和偏差。"]
      ],
      sources: [
        ["研究证据", "Cognitive Load During Problem Solving · John Sweller", "https://doi.org/10.1207/s15516709cog1202_4"],
        ["研究证据", "Multimedia Learning · Richard Mayer", "https://www.cambridge.org/core/books/multimedia-learning/7A62F072A71289E1E2629801F3F0F65E"],
        ["实践方法", "The Design of Everyday Things · Don Norman", "https://mitpress.mit.edu/9780262525671/the-design-of-everyday-things/"],
        ["研究证据", "Make It Stick · retrieval and spaced practice synthesis", "https://www.hup.harvard.edu/books/9780674729018"]
      ]
    },
    {
      id: "organization-decision",
      title: "组织与决策",
      href: "organization-decision.html",
      summary: "把目标、信息、决策权、激励和反馈放进同一个系统里。",
      image: "images/product/organization-decision-map-watercolor.webp",
      modelImage: "images/product/systems-uncertainty-map-watercolor.webp",
      decision: "谁掌握最接近事实的信息、谁有决定权、谁承担后果。",
      essentials: ["目标与决策权", "激励、责任和信任", "系统反馈与延迟", "概率、因果与不确定性", "沟通、冲突和心理安全"],
      agent: ["汇总多方事实和分歧", "模拟情景与风险", "跟踪行动、证据和依赖", "沉淀决策记录与复盘"],
      human: ["设定方向和不可越过的边界", "处理利益、关系和价值冲突", "决定可逆与不可逆行动", "承担组织后果和对外承诺"],
      failure: "把流程自动化，却没有澄清责任、激励和异常情况下的接管权。",
      case: "跨部门上线 Agent：先定义信息源、决策权、人工审批、异常升级和停止条件，再扩展权限。",
      checklist: ["目标和反目标是否明确", "最接近事实的人是谁", "谁决定、谁执行、谁负责", "反馈多久到达、会不会失真", "哪些动作必须人工批准"],
      skill: "组织决策与 Agent 权限 Skill",
      topics: [
        ["管理与组织", "管理不是控制动作，而是让目标、责任和反馈形成闭环。"],
        ["系统思维", "观察反馈、延迟、局部优化和意外后果。"],
        ["决策科学", "区分事实、预测、偏好和不可逆承诺。"],
        ["沟通协作", "从对方的目标、风险和证据标准组织表达。"],
        ["Agent 治理", "权限最小化、可观察、可撤回、可审计并有人接管。"]
      ],
      sources: [
        ["实践方法", "Thinking in Systems · Donella Meadows", "https://www.chelseagreen.com/product/thinking-in-systems/"],
        ["实践方法", "The Fearless Organization · Amy Edmondson", "https://www.hbs.edu/faculty/Pages/item.aspx?num=54851"],
        ["研究证据", "When combinations of humans and AI are useful", "https://www.nature.com/articles/s41562-024-02024-1"],
        ["研究证据", "National Academies · Convergence Research", "https://www.nationalacademies.org/index.php/cdn/materials/9fba1165-56a2-4cfc-b41c-11e8c2418ad2"]
      ]
    }
  ];

  var roles = [
    { id: "product", name: "产品 / 设计", lenses: ["product", "technology", "business", "human"], path: "需求 → 证据 → 取舍 → 实验 → 验收" },
    { id: "operations", name: "运营 / 增长", lenses: ["business", "systems", "product", "organization"], path: "价值流 → 瓶颈 → 数据 → 实验 → 复盘" },
    { id: "manager", name: "管理者", lenses: ["organization", "business", "systems", "human"], path: "目标 → 决策权 → 协作 → 反馈 → 责任" },
    { id: "customer", name: "销售 / 对客", lenses: ["business", "product", "organization", "human"], path: "对象 → 关切 → 价值 → 证据 → 承诺" },
    { id: "founder", name: "创业者", lenses: ["business", "product", "technology", "organization", "systems"], path: "问题 → 承诺 → 交付 → 现金 → 规模" },
    { id: "general", name: "通用职场", lenses: ["product", "business", "human", "systems"], path: "目标 → 材料 → 判断 → Agent 执行 → 验收" }
  ];

  var scenarioLenses = {
    venture: { role: "founder", lenses: ["business", "product", "technology", "systems"] },
    data: { role: "general", lenses: ["technology", "systems", "business"] },
    meeting: { role: "manager", lenses: ["organization", "systems", "human"] },
    job: { role: "general", lenses: ["human", "business", "product"] },
    purchase: { role: "general", lenses: ["systems", "business", "product"] },
    customer: { role: "customer", lenses: ["business", "human", "organization"] },
    cost: { role: "operations", lenses: ["business", "systems", "technology"] },
    document: { role: "product", lenses: ["product", "human", "organization"] },
    general: { role: "general", lenses: ["product", "systems", "human"] }
  };

  var pageLenses = {
    "fundamentals.html": ["technology", "human"],
    "boundaries.html": ["systems", "organization"],
    "learning.html": ["human", "systems"],
    "mindmap.html": ["systems", "human"],
    "history.html": ["technology", "systems"],
    "productivity-revolutions.html": ["business", "systems", "technology", "organization"],
    "glossary.html": ["technology", "human"],
    "architectures.html": ["technology", "systems"],
    "embodied.html": ["technology", "systems"],
    "practice.html": ["business", "product", "organization"],
    "feishu-ai.html": ["organization", "business", "technology"],
    "automotive.html": ["business", "systems", "technology"],
    "innovation.html": ["business", "product", "systems"],
    "data-knowledge.html": ["technology", "systems"],
    "cognitive-management-ai.html": ["human", "organization", "systems"],
    "social-intelligence.html": ["human", "organization"],
    "career-direction.html": ["organization", "business", "human", "systems"],
    "structured-expression.html": ["organization", "human", "systems"]
  };

  return {
    version: 1,
    northStar: "通过跨学科认知，提升人对 AI 与 Agent 的判断力、决策力和驾驭力。",
    lenses: lenses,
    hubs: hubs,
    roles: roles,
    scenarioLenses: scenarioLenses,
    pageLenses: pageLenses
  };
});
