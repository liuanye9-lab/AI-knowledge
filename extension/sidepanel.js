(function () {
  "use strict";

  const isExtension = location.protocol === "chrome-extension:" && typeof chrome !== "undefined" && chrome.storage?.local;
  const API_URL = isExtension
    ? "https://ai-knowledge-sigma.vercel.app/api/companion"
    : `${location.origin}/api/companion`;

  const selected = document.getElementById("selected-text");
  const source = document.getElementById("source-line");
  const status = document.getElementById("context-status");
  const modelLabel = document.getElementById("model-label");
  const analysisAction = document.getElementById("analysis-action");
  const suggestionBlock = document.getElementById("suggestion-block");
  const title = document.getElementById("suggestion-title");
  const rewrite = document.getElementById("rewrite-text");
  const why = document.getElementById("why-text");
  const analyzeButton = document.getElementById("analyze-btn");
  const applyButton = document.getElementById("apply-btn");
  const toast = document.getElementById("toast");
  let currentMode = "clarify";
  let modelConnected = false;
  let lastResult = null;

  const localSuggestions = {
    clarify: {
      title: "先补上读者和决策目标",
      build(text) {
        return `面向需要参与这件事的人，清楚说明：${text.replace(/[。！？!?]+$/, "")}。目标是让对方知道为什么做、下一步做什么，以及怎样算完成。`;
      },
      why: "明确读者和目标，会让 AI 自动调整信息粒度。",
      method: "先说读者和目标，再补背景，最后约束输出。"
    },
    check: {
      title: "先找出最可能被误解的一处",
      build(text) {
        return `检查下面内容是否存在事实缺口、模糊指代或无法验收的表述；只指出影响最大的一处并给出修订：${text}`;
      },
      why: "一次只查一个高风险点，比泛泛地全面检查更容易落实。",
      method: "先找影响最大的一个事实或歧义。"
    },
    action: {
      title: "把描述变成可交接的下一步",
      build(text) {
        return `把这件事拆成 3 个以内的行动项：${text}。每项写明负责人角色、截止时间和完成标准；不确定处标记待确认。`;
      },
      why: "负责人、时间和完成标准能把理解变成协作。",
      method: "行动项要有负责人、时间和完成标准。"
    }
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

  function renderResult(result) {
    lastResult = result;
    title.textContent = result.title;
    rewrite.textContent = result.rewrite;
    why.textContent = result.risk ? `${result.why} · 请注意：${result.risk}` : result.why;
    suggestionBlock.hidden = false;
    suggestionBlock.classList.remove("is-loading", "is-stale");
    analysisAction.classList.add("is-complete");
    applyButton.disabled = false;
  }

  function renderLocal() {
    const item = localSuggestions[currentMode];
    const text = selected.value.trim();
    renderResult({ title: item.title, rewrite: item.build(text), why: item.why, method: item.method, risk: "" });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1900);
  }

  async function checkConnection() {
    try {
      const response = await fetch(API_URL, { headers: { "Accept": "application/json" } });
      const data = await response.json();
      modelConnected = Boolean(data.configured);
      status.textContent = modelConnected ? "模型已连接" : "本地模式";
      modelLabel.textContent = modelConnected ? `${data.model} · 仅发送选中文字` : "模型未配置 · 自动使用本地方法";
    } catch {
      modelConnected = false;
      status.textContent = "本地模式";
      modelLabel.textContent = "连接不可用 · 自动使用本地方法";
    }
  }

  async function runAnalysis() {
    const text = selected.value.trim();
    if (!text) {
      selected.focus();
      return showToast("先放进一小段正在处理的内容");
    }
    if (text.length > 8000) return showToast("内容有点长，请先缩到 8000 字以内");

    analyzeButton.disabled = true;
    analyzeButton.textContent = "正在找最值得改的一点…";
    suggestionBlock.classList.add("is-loading");
    status.textContent = modelConnected ? "模型思考中" : "本地分析中";

    try {
      if (!modelConnected) throw new Error("offline");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: currentMode, source: source.textContent })
      });
      if (!response.ok) throw new Error("upstream");
      const data = await response.json();
      if (!data.ok || !data.result) throw new Error("invalid");
      renderResult(data.result);
      status.textContent = "建议已就绪";
      modelLabel.textContent = `${data.meta?.model || "模型"} · 仅发送选中文字`;
    } catch {
      renderLocal();
      status.textContent = "本地方法";
      modelLabel.textContent = "模型暂不可用 · 本次未上传内容";
      showToast("模型没有连上，已用本地方法继续完成");
    } finally {
      analyzeButton.disabled = false;
      analyzeButton.textContent = "生成一个新的建议";
      suggestionBlock.classList.remove("is-loading");
    }
  }

  async function loadContext() {
    const { companionContext, companionAutoRun } = await getLocal(["companionContext", "companionAutoRun"]);
    if (companionContext?.text) {
      selected.value = companionContext.text;
      source.textContent = companionContext.title || "当前任务";
    }
    await checkConnection();
    if (companionAutoRun) {
      await setLocal({ companionAutoRun: false });
      await runAnalysis();
    }
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      currentMode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      suggestionBlock.hidden = true;
      analysisAction.classList.remove("is-complete");
      analyzeButton.textContent = "生成这个版本";
    });
  });

  document.getElementById("capture-btn").addEventListener("click", async () => {
    if (!isExtension) return showToast("网页预览使用示例文字；加载扩展后可读取选区");
    chrome.runtime.sendMessage({ type: "capture-selection" }, async (response) => {
      if (!response?.ok || !response.context?.text) return showToast("请先在网页中选中一段文字");
      selected.value = response.context.text;
      source.textContent = response.context.title;
      renderLocal();
      await runAnalysis();
    });
  });

  selected.addEventListener("input", () => {
    suggestionBlock.classList.add("is-stale");
    analysisAction.classList.remove("is-complete");
    applyButton.disabled = true;
    analyzeButton.textContent = "根据修改重新生成";
  });

  analyzeButton.addEventListener("click", runAnalysis);
  document.getElementById("retry-btn").addEventListener("click", runAnalysis);

  document.getElementById("apply-btn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(rewrite.textContent).catch(() => {});
    showToast("已复制。现在回到原任务里采用它");
  });

  document.getElementById("save-method").addEventListener("click", async () => {
    const method = lastResult?.method || localSuggestions[currentMode].method;
    await setLocal({ savedMethod: method });
    showToast("方法已留下，会在相似任务里再出现");
  });

  loadContext();
})();
