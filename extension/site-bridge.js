(function () {
  "use strict";
  document.documentElement.dataset.aiCompanionInstalled = chrome.runtime.getManifest().version;
  document.dispatchEvent(new CustomEvent("ai-companion-ready"));
  document.addEventListener("ai-companion-open-sidepanel", () => chrome.runtime.sendMessage({ type: "open-sidepanel" }));
  document.addEventListener("ai-companion-open-newtab", () => chrome.runtime.sendMessage({ type: "open-newtab" }));
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("[data-companion-surface]");
    if (!link) return;
    event.preventDefault();
    const type = link.dataset.companionSurface === "newtab" ? "open-newtab" : "open-sidepanel";
    chrome.runtime.sendMessage({ type });
  });
})();
