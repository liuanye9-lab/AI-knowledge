/* 左侧课程目录 · 全站统一 */
(function () {
  "use strict";

  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!path || path === "") path = "index.html";

  function active(href) {
    var h = href.split("#")[0].toLowerCase();
    return h === path ? " is-active" : "";
  }

  var html =
    '<div class="sidebar-inner">' +
    '<a class="sidebar-brand" href="index.html">' +
    '<span class="nav-logo">AI</span><span>通识知识库</span></a>' +
    '<p class="sidebar-tagline">连接 · 回忆 · 应用 · 复习</p>' +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">开始</div>' +
    '<a class="sidebar-link' + active("index.html") + '" href="index.html">首页概览</a>' +
    '<a class="sidebar-link' + active("learning.html") + '" href="learning.html"><span class="sl-num">学</span>今天怎么学</a>' +
    "</div>" +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">三条逻辑线</div>' +
    '<a class="sidebar-link' + active("mindmap.html") + '" href="mindmap.html"><span class="sl-num">结</span>结构地图</a>' +
    '<a class="sidebar-link' + active("history.html") + '" href="history.html"><span class="sl-num">时</span>发展史 · 时间线</a>' +
    '<a class="sidebar-link' + active("fundamentals.html") + '" href="fundamentals.html"><span class="sl-num">功</span>通识主线 · 含沙盒</a>' +
    "</div>" +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">主线章节（功能）</div>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s1">1. LLM 大脑</a>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s2">2. 对话 · 提示沙盒</a>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s3">3. 开卷 · RAG 沙盒</a>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s4">4. 工具 / Skill 沙盒</a>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s5">5. 多步 · Agent 沙盒</a>' +
    '<a class="sidebar-link sub" href="fundamentals.html#s6">6. 边界 · 分档沙盒</a>' +
    "</div>" +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">巩固</div>' +
    '<a class="sidebar-link' + active("boundaries.html") + '" href="boundaries.html">能力边界 · 排行榜</a>' +
    '<a class="sidebar-link' + active("glossary.html") + '" href="glossary.html">专有词库</a>' +
    "</div>" +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">实操 · 企业</div>' +
    '<a class="sidebar-link' + active("practice.html") + '" href="practice.html"><span class="sl-num">企</span>企业专栏 · ToB 提效</a>' +
    '<a class="sidebar-link' + active("feishu-ai.html") + '" href="feishu-ai.html"><span class="sl-num">飞</span>飞书 AI 生态</a>' +
    '<a class="sidebar-link' + active("automotive.html") + '" href="automotive.html"><span class="sl-num">车</span>汽车制造行业</a>' +
    '<a class="sidebar-link sub" href="practice.html#feishu">飞书 AI 生态</a>' +
    '<a class="sidebar-link sub" href="practice.html#site">AI Coding 做网站</a>' +
    '<a class="sidebar-link sub" href="practice.html#app">AI Coding 做应用</a>' +
    '<a class="sidebar-link sub" href="practice.html#daily">日常工种清单</a>' +
    '<a class="sidebar-link sub" href="practice.html#refs">开源与论文引用</a>' +
    "</div>" +
    '<div class="sidebar-group">' +
    '<div class="sidebar-group-title">进阶专题</div>' +
    '<a class="sidebar-link' + active("architectures.html") + '" href="architectures.html">架构与框架</a>' +
    '<a class="sidebar-link' + active("embodied.html") + '" href="embodied.html">具身 · 无人驾驶</a>' +
    "</div>" +
    '<div class="sidebar-foot">' +
    '<a href="practice.html">企业实操专栏 →</a>' +
    "</div></div>";

  function mount() {
    var root = document.getElementById("sidebar-root");
    if (!root) return;
    root.innerHTML = html;
    // 隐藏旧顶栏，避免双导航
    document.querySelectorAll("body > .nav, .main-col > .nav").forEach(function (n) {
      n.style.display = "none";
    });
    document.querySelectorAll(".mobile-dock").forEach(function (n) {
      n.style.display = "none";
    });
    root.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("sidebar-open");
        var t = document.querySelector(".sidebar-toggle");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    });
  }

  function ensureShell() {
    if (document.getElementById("sidebar-root")) {
      mount();
      return;
    }
    // Auto-wrap legacy pages that still use top nav only
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
    aside.setAttribute("aria-label", "课程目录");
    var col = document.createElement("div");
    col.className = "main-col";

    var top = document.createElement("header");
    top.className = "topbar";
    top.innerHTML =
      '<button type="button" class="sidebar-toggle" aria-label="打开目录" aria-expanded="false">☰ 目录</button>' +
      '<div class="topbar-title">AI 通识知识库</div>' +
      '<a class="topbar-cta" href="fundamentals.html">通识主线</a>';

    if (oldNav) oldNav.remove();
    var dock = document.querySelector(".mobile-dock");
    if (dock) dock.remove();

    var parent = main.parentNode;
    parent.insertBefore(shell, main);
    shell.appendChild(aside);
    shell.appendChild(col);
    col.appendChild(top);
    col.appendChild(main);
    if (footer) col.appendChild(footer);

    mount();
    bindToggle();
  }

  function bindToggle() {
    var btn = document.querySelector(".sidebar-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("sidebar-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var mask = document.querySelector(".sidebar-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.className = "sidebar-mask";
      document.body.appendChild(mask);
    }
    mask.addEventListener("click", function () {
      document.body.classList.remove("sidebar-open");
      btn.setAttribute("aria-expanded", "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      ensureShell();
      bindToggle();
    });
  } else {
    ensureShell();
    bindToggle();
  }
})();
