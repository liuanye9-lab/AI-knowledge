(function () {
  "use strict";
  const label = document.getElementById("time-label");
  const memory = document.getElementById("remember-line");
  const memoryText = document.getElementById("remember-text");
  const dismiss = document.getElementById("dismiss-memory");
  const openButton = document.getElementById("open-companion");
  const isExtension = location.protocol === "chrome-extension:" && typeof chrome !== "undefined" && chrome.storage?.local;

  const hour = new Date().getHours();
  label.textContent = hour < 6 ? "夜深了" : hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";

  async function readState() {
    if (isExtension) return chrome.storage.local.get(["savedMethod", "memoryDismissedOn"]);
    return { savedMethod: localStorage.getItem("savedMethod"), memoryDismissedOn: localStorage.getItem("memoryDismissedOn") };
  }

  async function writeState(value) {
    if (isExtension) return chrome.storage.local.set(value);
    Object.entries(value).forEach(([key, val]) => localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val)));
  }

  readState().then((state) => {
    if (state.savedMethod) memoryText.textContent = state.savedMethod;
    if (state.memoryDismissedOn === new Date().toDateString()) memory.hidden = true;
  });

  dismiss.addEventListener("click", async () => {
    await writeState({ memoryDismissedOn: new Date().toDateString() });
    memory.hidden = true;
  });

  openButton.addEventListener("click", async () => {
    if (!isExtension) return location.assign("sidepanel.html");
    chrome.runtime.sendMessage({ type: "open-sidepanel" });
  });
})();
