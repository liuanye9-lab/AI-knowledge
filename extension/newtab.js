(function () {
  "use strict";
  const form = document.getElementById("intent-form");
  const input = document.getElementById("intent-input");
  const label = document.getElementById("time-label");
  const memory = document.getElementById("remember-line");
  const memoryText = document.getElementById("remember-text");
  const dismiss = document.getElementById("dismiss-memory");
  const isExtension = location.protocol === "chrome-extension:" && typeof chrome !== "undefined" && chrome.storage?.local;

  const hour = new Date().getHours();
  label.textContent = hour < 6 ? "夜深了" : hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";

  async function readState() {
    if (isExtension) return chrome.storage.local.get(["savedMethod", "memoryDismissedOn"]);
    return {
      savedMethod: localStorage.getItem("savedMethod"),
      memoryDismissedOn: localStorage.getItem("memoryDismissedOn")
    };
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    await writeState({
      companionContext: { text, title: "新标签页里的当前任务", url: "", capturedAt: Date.now() },
      companionAutoRun: true
    });
    if (isExtension && chrome.sidePanel?.open) {
      const current = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: current.id });
    } else {
      location.href = "sidepanel.html";
    }
  });
})();
