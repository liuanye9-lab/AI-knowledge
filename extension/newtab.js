(function () {
  "use strict";

  const label = document.getElementById("time-label");
  const form = document.getElementById("web-search");
  const query = document.getElementById("search-query");
  const frequentList = document.getElementById("frequent-list");
  const openKnowledgeMap = document.getElementById("open-knowledge-map");
  const isExtension = location.protocol === "chrome-extension:" && typeof chrome !== "undefined";

  const hour = new Date().getHours();
  label.textContent = hour < 6 ? "夜深了" : hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";

  function looksLikeAddress(value) {
    return /^https?:\/\//i.test(value) || (/^[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:\/.*)?$/i.test(value) && !value.includes(" "));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = query.value.trim();
    if (!value) return query.focus();
    const target = looksLikeAddress(value)
      ? (/^https?:\/\//i.test(value) ? value : `https://${value}`)
      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
    location.assign(target);
  });

  function renderFrequent(sites) {
    frequentList.textContent = "";
    sites.slice(0, 8).forEach((site) => {
      const link = document.createElement("a");
      link.href = site.url;
      link.textContent = site.title || new URL(site.url).hostname.replace(/^www\./, "");
      link.title = site.url;
      frequentList.appendChild(link);
    });
    if (!frequentList.children.length) {
      const hint = document.createElement("span");
      hint.className = "frequent-loading";
      hint.textContent = "常用页面会在这里自动出现";
      frequentList.appendChild(hint);
    }
  }

  if (isExtension && chrome.topSites?.get) {
    chrome.topSites.get().then(renderFrequent).catch(() => renderFrequent([]));
  } else {
    renderFrequent([
      { title: "飞书", url: "https://www.feishu.cn/" },
      { title: "GitHub", url: "https://github.com/" },
      { title: "邮箱", url: "https://mail.google.com/" }
    ]);
  }

  openKnowledgeMap.addEventListener("click", () => {
    location.assign("https://ai-knowledge-sigma.vercel.app/knowledge-map#map-task-input");
  });
})();
