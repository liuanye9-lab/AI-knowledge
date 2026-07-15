/* AI 通识知识库 · 导航 / 响应式 / 动效 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav drawer
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "✕" : "☰";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      });
    });
  }

  // Desktop "更多" dropdown
  var moreBtn = document.querySelector(".nav-more-btn");
  var morePanel = document.querySelector(".nav-more-panel");
  if (moreBtn && morePanel) {
    moreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = morePanel.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      morePanel.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    });
    morePanel.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Active nav
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var href = (link.getAttribute("href") || "").toLowerCase().split("#")[0];
    if (href === path || (path === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  // Scroll progress
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);
  function updateProgress() {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (height > 0 ? (scrollTop / height) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Back to top
  var back = document.createElement("button");
  back.type = "button";
  back.className = "back-top";
  back.setAttribute("aria-label", "回到顶部");
  back.textContent = "↑";
  document.body.appendChild(back);
  back.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener(
    "scroll",
    function () {
      var y = document.documentElement.scrollTop || document.body.scrollTop;
      back.classList.toggle("show", y > 480);
    },
    { passive: true }
  );

  // Reveal
  var selectors = [
    ".section", ".page-hero", ".hero", ".card", ".station", ".figure",
    ".pyramid", ".sandbox", ".you-box", ".triad", ".group", ".timeline-item",
    ".term-card", ".fw-card", ".path-node", ".freq-bar"
  ];
  document.querySelectorAll(selectors.join(",")).forEach(function (el) {
    if (!el.classList.contains("reveal") && !el.classList.contains("animate-in")) {
      el.classList.add("reveal");
    }
  });
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Glossary filter
  var searchInput = document.getElementById("glossary-search");
  var chips = document.querySelectorAll(".chip[data-cat]");
  var terms = document.querySelectorAll(".term-card");
  var activeCat = "all";
  function filterTerms() {
    var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
    var visible = 0;
    terms.forEach(function (card) {
      var cat = card.getAttribute("data-cat") || "";
      var text = (card.textContent || "").toLowerCase();
      var show = (activeCat === "all" || cat === activeCat) && (!q || text.indexOf(q) !== -1);
      card.classList.toggle("hidden", !show);
      if (show) visible += 1;
    });
    var empty = document.getElementById("glossary-empty");
    if (empty) empty.hidden = visible > 0;
  }
  if (searchInput) searchInput.addEventListener("input", filterTerms);
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      activeCat = chip.getAttribute("data-cat") || "all";
      filterTerms();
    });
  });

  // External links
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (!a.target) a.target = "_blank";
    if (!a.rel || a.rel.indexOf("noopener") === -1) {
      a.rel = (a.rel ? a.rel + " " : "") + "noopener noreferrer";
    }
  });

  // Spine station highlight
  var spine = document.getElementById("spine-nav");
  if (spine && "IntersectionObserver" in window) {
    var linkMap = {};
    spine.querySelectorAll("a").forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace("#", "");
      if (id) linkMap[id] = a;
    });
    var sio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          spine.querySelectorAll("a").forEach(function (l) { l.classList.remove("is-active"); });
          if (linkMap[e.target.id]) linkMap[e.target.id].classList.add("is-active");
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    Object.keys(linkMap).forEach(function (id) {
      var n = document.getElementById(id);
      if (n) sio.observe(n);
    });
  }
})();
