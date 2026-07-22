(function () {
  "use strict";

  const status = document.getElementById("install-status");
  const action = document.getElementById("install-action");
  const note = document.getElementById("install-note");
  const installedActions = document.getElementById("installed-actions");
  const openButton = document.getElementById("open-sidepanel");
  const storeUrl = document.body.dataset.storeUrl;
  const surface = new URLSearchParams(window.location.search).get("surface");

  function markInstalled() {
    status.textContent = "扩展已连接";
    action.hidden = true;
    note.textContent = "配置已经完成：新标签页已接管，工具栏图标会直接打开侧边栏。";
    openButton.textContent = surface === "newtab" ? "打开新标签页" : "打开浏览器侧边栏";
    installedActions.hidden = false;
  }

  if (storeUrl) {
    action.href = storeUrl;
    action.removeAttribute("download");
    action.textContent = "在 Chrome 中安装";
  }

  if (document.documentElement.dataset.aiCompanionInstalled) markInstalled();
  document.addEventListener("ai-companion-ready", markInstalled, { once: true });
  openButton.addEventListener("click", () => {
    const eventName = surface === "newtab" ? "ai-companion-open-newtab" : "ai-companion-open-sidepanel";
    document.dispatchEvent(new CustomEvent(eventName));
  });

  window.setTimeout(() => {
    if (!document.documentElement.dataset.aiCompanionInstalled) status.textContent = "尚未安装";
  }, 700);
})();
