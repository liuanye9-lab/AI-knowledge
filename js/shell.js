/* 全站知识导航与 80/20 判断单元 */
(function () {
  "use strict";

  var map = window.AI_KNOWLEDGE_MAP;
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (path && path.indexOf(".") === -1) path += ".html";
  if (!path) path = "index.html";

  function active(href) {
    return href.split("#")[0].toLowerCase() === path ? " is-active" : "";
  }

  function link(href, label, mark) {
    return '<a class="sidebar-link' + active(href) + '" href="' + href + '">' +
      (mark ? '<span class="sl-num">' + mark + '</span>' : "") + label + "</a>";
  }

  function sidebarHtml() {
    var hubs = map ? map.hubs : [];
    return '<div class="sidebar-inner">' +
      '<a class="sidebar-brand" href="index.html"><span class="nav-logo">AI</span><span>判断力知识库</span></a>' +
      '<p class="sidebar-tagline">理解 → 判断 → 应用 → 复盘</p>' +
      '<div class="sidebar-group"><div class="sidebar-group-title">从真实任务开始</div>' +
      link("knowledge-map.html", "跨学科判断力地图", "图") +
      "</div>" +
      '<div class="sidebar-group"><div class="sidebar-group-title">四个知识枢纽</div>' +
      hubs.map(function (hub, index) { return link(hub.href, hub.title, "0" + (index + 1)); }).join("") +
      "</div>" +
      '<div class="sidebar-group"><div class="sidebar-group-title">技术与系统节点</div>' +
      link("fundamentals.html", "AI 心智模型", "技") +
      link("architectures.html", "架构与 Agent", "架") +
      link("data-knowledge.html", "数据与知识沉淀", "数") +
      link("boundaries.html", "风险、权限与边界", "界") +
      "</div>" +
      '<div class="sidebar-group"><div class="sidebar-group-title">商业、产品与行业节点</div>' +
      link("productivity-revolutions.html", "生产力革命与资本", "势") +
      link("innovation.html", "创新创业", "创") +
      link("practice.html", "企业 AI 提效", "企") +
      link("automotive.html", "快速看懂一个行业", "行") +
      link("feishu-ai.html", "飞书协同生态", "协") +
      "</div>" +
      '<div class="sidebar-group"><div class="sidebar-group-title">人、组织与表达节点</div>' +
      link("learning.html", "学习与认知", "学") +
      link("cognitive-management-ai.html", "脑科学 × 管理 × AI", "智") +
      link("social-intelligence.html", "社会认知与关系协作", "人") +
      link("career-direction.html", "职业发展与引路人网络", "路") +
      link("structured-expression.html", "结构化表达", "构") +
      "</div>" +
      '<div class="sidebar-group"><div class="sidebar-group-title">随查</div>' +
      link("mindmap.html", "原有 AI 结构地图") +
      link("history.html", "发展史与时间线") +
      link("glossary.html", "专有词库") +
      "</div>" +
      '<div class="sidebar-foot"><a href="knowledge-map.html">判断不是天赋，而是可以被组织的能力 →</a></div></div>';
  }

  function mount() {
    var root = document.getElementById("sidebar-root");
    if (!root) return;
    root.setAttribute("aria-label", "跨学科知识目录");
    root.innerHTML = sidebarHtml();
    document.querySelectorAll("body > .nav, .main-col > .nav, .mobile-dock").forEach(function (node) {
      node.style.display = "none";
    });
    root.querySelectorAll("a").forEach(function (anchor) {
      anchor.addEventListener("click", function () {
        document.body.classList.remove("sidebar-open");
        var toggle = document.querySelector(".sidebar-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function ensureShell() {
    if (document.getElementById("sidebar-root")) return mount();
    var oldNav = document.querySelector("body > .nav");
    var main = document.querySelector("body > main");
    var footer = document.querySelector("body > footer");
    if (!main) return;

    document.body.classList.add("has-sidebar");
    var shell = document.createElement("div");
    shell.className = "app-shell";
    var aside = document.createElement("aside");
    aside.id = "sidebar-root";
    aside.className = "sidebar";
    var column = document.createElement("div");
    column.className = "main-col";
    var top = document.createElement("header");
    top.className = "topbar";
    top.innerHTML =
      '<button type="button" class="sidebar-toggle" aria-label="打开目录" aria-expanded="false">☰ 目录</button>' +
      '<div class="topbar-title">跨学科判断力知识库</div>' +
      '<a class="topbar-cta" href="knowledge-map.html">打开能力地图</a>';
    if (oldNav) oldNav.remove();
    var dock = document.querySelector(".mobile-dock");
    if (dock) dock.remove();
    main.parentNode.insertBefore(shell, main);
    shell.append(aside, column);
    column.append(top, main);
    if (footer) column.appendChild(footer);
    mount();
  }

  function bindToggle() {
    var button = document.querySelector(".sidebar-toggle");
    if (!button || button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", function () {
      var open = document.body.classList.toggle("sidebar-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var mask = document.querySelector(".sidebar-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.className = "sidebar-mask";
      document.body.appendChild(mask);
    }
    mask.addEventListener("click", function () {
      document.body.classList.remove("sidebar-open");
      button.setAttribute("aria-expanded", "false");
    });
  }

  function pageVisual(lensIds) {
    var specific = {
      "fundamentals.html": "images/product/technology-layers-watercolor.webp",
      "boundaries.html": "images/product/systems-uncertainty-map-watercolor.webp",
      "learning.html": "images/product/cognition-design-loop-watercolor.webp",
      "architectures.html": "images/product/technology-layers-watercolor.webp",
      "practice.html": "images/product/tech-business-product-triangle-watercolor.webp",
      "automotive.html": "images/illustrations/industry-discovery-watercolor.png",
      "innovation.html": "images/product/business-value-loop-watercolor.webp",
      "data-knowledge.html": "images/product/technology-layers-watercolor.webp",
      "cognitive-management-ai.html": "images/product/cognition-design-loop-watercolor.webp",
      "social-intelligence.html": "images/product/organization-decision-map-watercolor.webp",
      "career-direction.html": "images/product/role-capability-paths-watercolor.webp",
      "structured-expression.html": "images/product/systems-uncertainty-map-watercolor.webp"
      ,"productivity-revolutions.html": "images/product/productivity-revolutions-watercolor.webp"
    };
    if (specific[path]) return specific[path];
    var first = lensIds[0];
    if (first === "technology") return "images/product/technology-layers-watercolor.webp";
    if (first === "business" || first === "product") return "images/product/business-value-loop-watercolor.webp";
    if (first === "organization") return "images/product/organization-decision-map-watercolor.webp";
    if (first === "systems") return "images/product/systems-uncertainty-map-watercolor.webp";
    return "images/product/cognition-design-loop-watercolor.webp";
  }

  function addJudgmentUnit() {
    if (!map || path === "index.html" || document.querySelector(".global-judgment-unit")) return;
    var lensIds = map.pageLenses[path];
    if (!lensIds || !lensIds.length) return;
    var main = document.querySelector(".main-col main, body > main");
    if (!main) return;
    var lenses = lensIds.map(function (id) { return map.lenses[id]; }).filter(Boolean);
    var primary = lenses[0];
    var section = document.createElement("section");
    section.className = "global-judgment-unit";
    section.setAttribute("aria-label", "本页 80/20 判断单元");
    section.innerHTML =
      '<figure><img src="' + pageVisual(lensIds) + '" alt="' + lenses.map(function (x) { return x.name; }).join("、") + '的水彩判断模型" width="1536" height="1024" loading="lazy" /></figure>' +
      '<div class="global-judgment-copy"><p class="eyebrow">一张图 · 三个判断</p>' +
      '<h2>这页不是要求学完，而是帮助你做出更好的决定。</h2>' +
      '<div class="global-lens-list">' + lenses.map(function (lens) { return '<a href="' + lens.hub + '"><strong>' + lens.name + '</strong><span>' + lens.short + '</span></a>'; }).join("") + '</div>' +
      '<ol><li>现实中要改善的结果是什么？</li><li>Agent 可以执行什么，哪里容易失真？</li><li>哪些取舍、权限和责任必须由人保留？</li></ol>' +
      '<a class="global-unit-action" href="' + primary.hub + '">进入对应知识枢纽 →</a></div>';
    var hero = main.querySelector(":scope > header.page-hero, :scope > section[class*='hero']");
    var firstSection = main.querySelector(":scope > section");
    if (hero) hero.insertAdjacentElement("afterend", section);
    else if (firstSection) firstSection.insertAdjacentElement("afterend", section);
    else main.insertBefore(section, main.firstChild);
  }

  function init() {
    ensureShell();
    bindToggle();
    addJudgmentUnit();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
