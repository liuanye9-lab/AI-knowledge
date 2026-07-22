(function () {
  "use strict";

  const isExtension = location.protocol === "chrome-extension:" && typeof chrome !== "undefined" && chrome.storage?.local;
  const API_URL = isExtension ? "https://ai-knowledge-sigma.vercel.app/api/companion" : `${location.origin}/api/companion`;
  const contextSummary = document.getElementById("context-summary");
  const source = document.getElementById("source-line");
  const status = document.getElementById("context-status");
  const modelLabel = document.getElementById("model-label");
  const suggestionBlock = document.getElementById("suggestion-block");
  const title = document.getElementById("suggestion-title");
  const rewrite = document.getElementById("rewrite-text");
  const why = document.getElementById("why-text");
  const applyButton = document.getElementById("apply-btn");
  const saveButton = document.getElementById("save-method");
  const retryButton = document.getElementById("retry-btn");
  const toast = document.getElementById("toast");
  let currentContext = null;
  let modelConnected = false;
  let lastResult = null;

  const localSuggestion = {
    title: "先明确谁需要作出什么决定",
    build(text) {
      const clean = text.replace(/\s+/g, " ").slice(0, 900).replace(/[。！？!?]+$/, "");
      return `面向需要参与这件事的人，清楚说明：${clean}。补上希望对方作出的决定、下一步行动，以及怎样算完成。`;
    },
    why: "读者和决策目标明确后，信息才知道应该保留到什么粒度。",
    method: "先定读者和决定，再组织内容。"
  };

  function getLocal(keys) {
    if (isExtension) return chrome.storage.local.get(keys);
    const result = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (!value) return;
      try { result[key] = JSON.parse(value); } catch { result[key] = value; }
    });
    return Promise.resolve(result);
  }

  function setLocal(value) {
    if (isExtension) return chrome.storage.local.set(value);
    Object.entries(value).forEach(([key, val]) => localStorage.setItem(key, typeof val === "string" ? val : JSON.stringify(val)));
    return Promise.resolve();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function summarize(text) {
    const compact = String(text || "").replace(/\s+/g, " ").trim();
    if (!compact) return "当前页面没有可处理的正文。";
    return compact.length > 96 ? `${compact.slice(0, 96)}…` : compact;
  }

  function renderResult(result) {
    lastResult = result;
    title.textContent = result.title;
    rewrite.textContent = result.rewrite;
    why.textContent = result.risk ? `${result.why} · 请注意：${result.risk}` : result.why;
    suggestionBlock.classList.remove("is-loading");
    applyButton.disabled = false;
    saveButton.disabled = false;
  }

  function renderLocal(text) {
    renderResult({
      title: localSuggestion.title,
      rewrite: localSuggestion.build(text),
      why: localSuggestion.why,
      method: localSuggestion.method,
      risk: ""
    });
  }

  async function checkConnection() {
    try {
      const response = await fetch(API_URL, { headers: { "Accept": "application/json" } });
      const data = await response.json();
      modelConnected = Boolean(data.configured);
      modelLabel.textContent = modelConnected ? `${data.model} · 已连接` : "模型未配置 · 使用本地方法";
    } catch {
      modelConnected = false;
      modelLabel.textContent = "连接不可用 · 使用本地方法";
    }
  }

  async function captureContext() {
    if (!isExtension) {
      return {
        text: "我们计划在下个季度推出新的协作功能，以提升团队在跨部门项目中的效率。",
        title: "网页体验示例",
        url: "",
        kind: "sample"
      };
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "capture-page-context" }, async (response) => {
        if (response?.ok && response.context?.text) return resolve(response.context);
        const { companionContext } = await getLocal(["companionContext"]);
        resolve(companionContext?.text ? companionContext : null);
      });
    });
  }

  async function runAnalysis() {
    suggestionBlock.classList.add("is-loading");
    applyButton.disabled = true;
    saveButton.disabled = true;
    title.textContent = "正在找到一个最值得采用的建议…";
    rewrite.textContent = "稍等片刻，我会把结果直接放在这里。";
    status.textContent = "正在看当前页面";

    currentContext = await captureContext();
    if (!currentContext?.text) {
      status.textContent = "等待当前内容";
      contextSummary.textContent = "打开正在处理的页面，再点击浏览器工具栏里的 AI 伴学。";
      source.textContent = "没有读取整页，也没有上传内容";
      title.textContent = "打开页面后，我会直接给你建议";
      rewrite.textContent = "不需要复制粘贴，也不需要写提示词。";
      suggestionBlock.classList.remove("is-loading");
      return;
    }

    contextSummary.textContent = summarize(currentContext.text);
    source.textContent = `${currentContext.title || "当前页面"}${currentContext.kind === "selection" ? " · 已选文字" : " · 页面摘要"}`;
    await setLocal({ companionContext: currentContext });
    await checkConnection();

    try {
      if (!modelConnected) throw new Error("offline");
      status.textContent = "正在生成建议";
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentContext.text, mode: "clarify", source: currentContext.title || "当前页面" })
      });
      if (!response.ok) throw new Error("upstream");
      const data = await response.json();
      if (!data.ok || !data.result) throw new Error("invalid");
      renderResult(data.result);
      status.textContent = "已看过当前页面";
      modelLabel.textContent = `${data.meta?.model || "模型"} · 只处理当前内容`;
    } catch {
      renderLocal(currentContext.text);
      status.textContent = "已看过当前页面";
      modelLabel.textContent = "模型暂不可用 · 本次使用本地方法";
    }
  }

  applyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(rewrite.textContent).catch(() => {});
    showToast("已复制，可以直接回到原页面采用");
  });

  saveButton.addEventListener("click", async () => {
    await setLocal({ savedMethod: lastResult?.method || localSuggestion.method });
    showToast("已经留给下次");
  });

  retryButton.addEventListener("click", runAnalysis);
  runAnalysis();
})();
