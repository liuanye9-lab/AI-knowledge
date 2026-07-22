"use strict";

const MENU_ID = "ai-companion-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "交给 AI 伴学",
      contexts: ["selection"]
    });
  });

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab) return;
  await chrome.storage.local.set({
    companionContext: {
      text: info.selectionText || "",
      title: tab.title || "当前页面",
      url: tab.url || "",
      capturedAt: Date.now()
    },
    companionAutoRun: true
  });
  if (tab.windowId) await chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "capture-selection") return false;

  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("没有可读取的当前页面");
    const [{ result = "" } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() || ""
    });
    const context = {
      text: result,
      title: tab.title || "当前页面",
      url: tab.url || "",
      capturedAt: Date.now()
    };
    await chrome.storage.local.set({ companionContext: context });
    sendResponse({ ok: true, context });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
