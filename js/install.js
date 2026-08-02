(function () {
  "use strict";

  const status = document.getElementById("install-status");
  const action = document.getElementById("install-action");
  const note = document.getElementById("install-note");
  const installedActions = document.getElementById("installed-actions");
  const openButton = document.getElementById("open-knowledge-map");
  const storeUrl = document.body.dataset.storeUrl;

  function markInstalled() {
    status.textContent = "扩展已连接";
    action.hidden = true;
    note.textContent = "配置已经完成：新标签页已接管，需要时可直接进入能力地图。";
    openButton.textContent = "打开能力地图";
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
    location.assign("knowledge-map.html#map-task-input");
  });

  window.setTimeout(() => {
    if (!document.documentElement.dataset.aiCompanionInstalled) status.textContent = "尚未安装";
  }, 700);
})();
