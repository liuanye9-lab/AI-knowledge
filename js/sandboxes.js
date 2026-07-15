/* AI 通识 · 内嵌沙盒（本地、无 API） */
(function () {
  "use strict";

  var KB = [
    { id: "llm", title: "LLM", text: "大语言模型用海量文本训练，核心是预测下一个 token。擅长写作与编程辅助，但不是事实数据库，可能幻觉。" },
    { id: "rag", title: "RAG", text: "检索增强生成：先从知识库找出相关片段，再让模型基于资料回答，降低瞎编、贴合私有文档。" },
    { id: "agent", title: "Agent", text: "智能体在循环中规划、调用工具、观察结果并迭代，直到完成目标或触发停止条件。" },
    { id: "skill", title: "Skill", text: "可复用能力包：说明 + 工具 + 步骤模板 + 约束。像岗位技能证书，可被多个流程调用。" },
    { id: "workflow", title: "Workflow", text: "有顺序的步骤网络：分支、人审、重试。适合稳定、合规的业务流程。" },
    { id: "memory", title: "Memory", text: "短期像便签（当前任务状态），长期像档案柜（跨会话偏好与事实）。" },
    { id: "hallucination", title: "幻觉", text: "模型生成流畅但错误或无中生有的内容。需检索、工具校验与人工终审缓解。" },
    { id: "boundary", title: "能力边界", text: "模型在特定任务与约束下能稳定做对的范围。超出需工具、RAG 或人接管。" },
  ];

  function el(id) { return document.getElementById(id); }

  function approxTokens(str) {
    if (!str) return 0;
    var cjk = (str.match(/[\u4e00-\u9fff]/g) || []).length;
    var rest = str.length - cjk;
    return Math.max(1, Math.round(cjk + rest / 4));
  }

  function scoreDoc(query, doc) {
    var q = query.toLowerCase().trim();
    if (!q) return 0;
    var hay = (doc.title + " " + doc.text).toLowerCase();
    var score = 0;
    q.split(/\s+/).forEach(function (w) {
      if (!w) return;
      if (hay.indexOf(w) !== -1) score += 3;
      for (var i = 0; i < w.length; i++) {
        if (hay.indexOf(w[i]) !== -1) score += 0.5;
      }
    });
    if (hay.indexOf(q) !== -1) score += 5;
    return score;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initPromptLab() {
    var task = el("sb-prompt-task");
    var role = el("sb-prompt-role");
    var format = el("sb-prompt-format");
    var out = el("sb-prompt-out");
    var btn = el("sb-prompt-run");
    if (!task || !out || !btn) return;

    function build() {
      var t = task.value.trim() || "（请先写你的任务）";
      var r = role ? role.value : "专业助手";
      var f = format ? format.value : "条理清晰的中文";
      var prompt =
        "【角色】你是" + r + "。\n" +
        "【任务】" + t + "\n" +
        "【输出要求】" + f + "。\n" +
        "【约束】不确定时请明确说明不知道，不要编造事实。\n" +
        "【开始】请直接给出结果。";
      out.classList.add("is-live");
      out.innerHTML =
        '<div class="out-title">拼好的提示词（可复制）</div>' +
        escapeHtml(prompt) +
        "\n\n约 " + approxTokens(prompt) + " tokens（粗估）";
    }

    btn.addEventListener("click", build);
    document.querySelectorAll("[data-prompt-example]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        task.value = chip.getAttribute("data-prompt-example");
        document.querySelectorAll("[data-prompt-example]").forEach(function (c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        build();
      });
    });
  }

  function initTokenMeter() {
    var input = el("sb-token-input");
    var out = el("sb-token-out");
    var meter = el("sb-token-meter");
    var fill = meter ? meter.querySelector("i") : null;
    var windowSel = el("sb-token-window");
    if (!input || !out) return;

    function run() {
      var text = input.value || "";
      var tokens = approxTokens(text);
      var win = windowSel ? parseInt(windowSel.value, 10) : 32000;
      var pct = Math.min(100, Math.round((tokens / win) * 1000) / 10);
      if (fill) fill.style.width = pct + "%";
      if (meter) {
        meter.classList.remove("warn", "danger");
        if (pct > 85) meter.classList.add("danger");
        else if (pct > 60) meter.classList.add("warn");
      }
      out.classList.add("is-live");
      out.innerHTML =
        '<div class="out-title">上下文占用（本地粗估）</div>' +
        "约 <b>" + tokens + "</b> tokens · 窗口 <b>" + win + "</b> · 占用 <b>" + pct + "%</b>\n" +
        (pct > 70
          ? "建议：先摘要，或把长资料交给 RAG，别把整本手册塞进提示。"
          : "还算宽裕。复杂任务仍建议结构化提示。");
    }
    input.addEventListener("input", run);
    if (windowSel) windowSel.addEventListener("change", run);
    run();
  }

  function initRag() {
    var q = el("sb-rag-q");
    var btn = el("sb-rag-run");
    var out = el("sb-rag-out");
    var kbEl = el("sb-rag-kb");
    if (!q || !btn || !out) return;

    if (kbEl) {
      kbEl.innerHTML = KB.map(function (d) {
        return "<div><b>" + d.title + "</b> — " + escapeHtml(d.text) + "</div>";
      }).join("");
    }

    function run() {
      var query = q.value.trim();
      if (!query) {
        out.classList.add("is-live");
        out.textContent = "先输入问题，例如：什么是 RAG？";
        return;
      }
      var ranked = KB.map(function (d) {
        return { doc: d, score: scoreDoc(query, d) };
      })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 3);

      if (!ranked.length) {
        out.classList.add("is-live");
        out.textContent =
          "知识库没有相关片段。正确姿态是：拒答 / 换检索 / 联网——而不是编造。";
        return;
      }

      var chunks = ranked.map(function (x, i) {
        return "[" + (i + 1) + "] " + x.doc.title + "（相关度 " + x.score.toFixed(1) + "）\n" + x.doc.text;
      }).join("\n\n");

      var answer =
        "基于检索资料：\n" +
        ranked.map(function (x) { return "· " + x.doc.text; }).join("\n") +
        "\n\n（演示：真实系统会把片段塞进提示再调 LLM；此处只做检索与拼接。）";

      out.classList.add("is-live");
      out.innerHTML =
        '<div class="out-title">① 检索片段</div>' + escapeHtml(chunks) +
        '\n\n<div class="out-title">② 回答草稿</div>' + escapeHtml(answer);
    }

    btn.addEventListener("click", run);
    document.querySelectorAll("[data-rag-q]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        q.value = chip.getAttribute("data-rag-q");
        run();
      });
    });
  }

  function initAgentLoop() {
    var btn = el("sb-agent-run");
    var reset = el("sb-agent-reset");
    var goal = el("sb-agent-goal");
    var steps = document.querySelectorAll("#sb-agent-steps .sandbox-step");
    if (!btn || !steps.length) return;
    var timer = null;
    var idx = -1;

    function clear() {
      if (timer) clearInterval(timer);
      timer = null;
      idx = -1;
      steps.forEach(function (s) { s.classList.remove("on"); });
    }

    function play() {
      clear();
      var g = goal && goal.value.trim() ? goal.value.trim() : "调研竞品并整理三点结论";
      var bodies = [
        { t: "思考", d: "拆解「" + g + "」→ 要搜索、阅读、汇总。" },
        { t: "行动", d: "调用工具：搜索 / 读文档（模拟）。" },
        { t: "观察", d: "得到 3 段摘要（模拟返回）。" },
        { t: "再思考", d: "够不够？不够再搜；够则起草并检查是否跑题。" },
        { t: "停止", d: "满足停止条件 → 交付用户（关键事实需人审）。" },
      ];
      steps.forEach(function (s, i) {
        if (!bodies[i]) return;
        var st = s.querySelector(".st");
        var sd = s.querySelector(".sd");
        if (st) st.textContent = bodies[i].t;
        if (sd) sd.textContent = bodies[i].d;
      });
      timer = setInterval(function () {
        idx += 1;
        if (idx >= steps.length) {
          clearInterval(timer);
          timer = null;
          return;
        }
        steps[idx].classList.add("on");
      }, 700);
    }

    btn.addEventListener("click", play);
    if (reset) reset.addEventListener("click", clear);
  }

  function initSkillWorkflow() {
    var mode = "skill";
    var out = el("sb-sw-out");
    var btns = document.querySelectorAll("[data-sw-mode]");
    if (!out || !btns.length) return;

    function render() {
      btns.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-sw-mode") === mode);
      });
      out.classList.add("is-live");
      if (mode === "skill") {
        out.innerHTML =
          '<div class="out-title">Skill = 本事包</div>' +
          "名称：竞品摘要\n工具：搜索、读网页\n模板：对比表\n约束：无来源不写死数据\n\n可被多个流程反复调用。";
      } else {
        out.innerHTML =
          '<div class="out-title">Workflow = 流水线</div>' +
          "1 收需求 → 2 调「竞品摘要」技能 → 3 人审 → 4 排版 → 5 发送\n\n步骤固定；第 2 步用的是 Skill。";
      }
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-sw-mode");
        render();
      });
    });
    render();
  }

  function initTierRouter() {
    var sel = el("sb-tier-task");
    var out = el("sb-tier-out");
    var btn = el("sb-tier-run");
    if (!sel || !out) return;
    var map = {
      draft: { tier: "Luna（快省）", why: "轻任务优先省钱省延迟。" },
      daily: { tier: "Terra（均衡）", why: "日常默认档，性价比通常最好。" },
      hard: { tier: "Sol（旗舰）", why: "难题才上最强档。" },
      agent: { tier: "中档为主 + 难关旗舰", why: "Agent 别全程旗舰，按步路由。" },
      factual: { tier: "任意档 + 必须 RAG/联网", why: "时效与事实靠检索，不靠「更强」。" },
    };
    function run() {
      var r = map[sel.value] || map.daily;
      out.classList.add("is-live");
      out.innerHTML =
        '<div class="out-title">推荐（演示规则）</div>建议：<b>' +
        r.tier + "</b>\n" + r.why;
    }
    if (btn) btn.addEventListener("click", run);
    sel.addEventListener("change", run);
    run();
  }

  function initQuiz() {
    var root = el("sb-quiz");
    if (!root) return;
    root.querySelectorAll("[data-quiz]").forEach(function (item) {
      item.querySelectorAll("button[data-ok]").forEach(function (b) {
        b.addEventListener("click", function () {
          var ok = b.getAttribute("data-ok") === "1";
          var feedback = item.querySelector(".sandbox-out");
          item.querySelectorAll("button[data-ok]").forEach(function (x) {
            x.disabled = true;
          });
          if (feedback) {
            feedback.classList.add("is-live");
            feedback.textContent = ok
              ? "✓ 对。关键事实与对外动作，不能只靠模型自信。"
              : "✗ 再想想。流畅 ≠ 正确。";
          }
        });
      });
    });
  }

  function initAll() {
    initPromptLab();
    initTokenMeter();
    initRag();
    initAgentLoop();
    initSkillWorkflow();
    initTierRouter();
    initQuiz();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
