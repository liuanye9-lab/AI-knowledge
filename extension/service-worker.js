"use strict";

const MENU_ID = "ai-companion-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: "直接给我一个建议", contexts: ["selection"] });
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

async function openPanel(sender) {
  const windowId = sender?.tab?.windowId || (await chrome.windows.getCurrent()).id;
  await chrome.sidePanel.open({ windowId });
}

async function captureActivePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith("chrome-extension://")) return null;
  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString().trim() || "";
      if (selection) return { text: selection.slice(0, 8000), kind: "selection" };
      const description = document.querySelector('meta[name="description"]')?.content?.trim() || "";
      const main = document.querySelector("article, main, [role='main']") || document.body;
      const body = main?.innerText?.replace(/\s+/g, " ").trim() || "";
      const text = [document.title, description, body].filter(Boolean).join("\n").slice(0, 8000);
      return { text, kind: "page" };
    }
  });
  if (!result?.text) return null;
  return { ...result, title: tab.title || "当前页面", url: tab.url || "", capturedAt: Date.now() };
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab) return;
  await chrome.storage.local.set({
    companionContext: {
      text: info.selectionText || "",
      title: tab.title || "当前页面",
      url: tab.url || "",
      kind: "selection",
      capturedAt: Date.now()
    }
  });
  await openPanel({ tab });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "open-newtab") {
    chrome.tabs.create({}).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "open-sidepanel") {
    openPanel(sender).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "capture-page-context") {
    captureActivePage()
      .then(async (context) => {
        if (context) await chrome.storage.local.set({ companionContext: context });
        sendResponse({ ok: Boolean(context), context });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
