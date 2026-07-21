(function () {
  "use strict";

  var cards = [
    {
      q: "如果模型的目标是‘预测下一个更可能出现的词’，为什么它可能说得流畅却不一定真实？",
      a: "LLM 优先生成在上下文中概率合理的续写，并不是从一个保证真实的事实库里复制答案。上下文不足、知识冲突或任务超出能力时，它仍可能继续生成连贯文本。"
    },
    {
      q: "给 LLM 接上 RAG，解决的是哪一类问题？它为什么仍不能保证百分之百正确？",
      a: "RAG 先检索指定资料再生成，主要改善知识缺失、时效和可追溯性。但检索可能漏召回或召回错，模型也可能误读资料，因此仍需引用与人工验收。"
    },
    {
      q: "什么时候应该用 Workflow，什么时候才需要 Agent？",
      a: "路径稳定、步骤可预先写清时优先 Workflow；环境开放、需要根据中间结果动态选择下一步时才考虑 Agent。高风险动作都应保留权限和人工门。"
    }
  ];

  var index = 0;
  var reviewed = 0;
  var question = document.getElementById("recall-question");
  var modelAnswer = document.getElementById("model-answer");
  var answerPanel = document.getElementById("answer-panel");
  var userAnswer = document.getElementById("recall-answer");
  var reviewCount = document.getElementById("review-count");
  var nextReview = document.getElementById("next-review");

  document.querySelectorAll("[data-minutes]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-minutes]").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      var minutes = button.getAttribute("data-minutes");
      var start = document.getElementById("start-session");
      if (start) start.textContent = "开始 " + minutes + " 分钟";
      try { localStorage.setItem("ai-learning-session", minutes); } catch (e) {}
    });
  });

  var storedMinutes;
  try { storedMinutes = localStorage.getItem("ai-learning-session"); } catch (e) {}
  if (storedMinutes) {
    var storedButton = document.querySelector('[data-minutes="' + storedMinutes + '"]');
    if (storedButton) storedButton.click();
  }

  document.querySelectorAll("[data-analogy]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-analogy]").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      var type = button.getAttribute("data-analogy");
      var feedback = document.getElementById("analogy-feedback");
      if (!feedback) return;
      if (type === "autocomplete") feedback.innerHTML = "<strong>这个类比最接近。</strong>像：都根据前文预测后续；不像：LLM 的规模、上下文和能力远强于普通输入法，但仍不等于事实数据库。";
      else feedback.innerHTML = "<strong>这个类比容易误导。</strong>搜索引擎和数据库以查找已有内容为主；LLM 的核心动作是生成。接上 RAG 或工具后，它才更像‘先查再答’。";
    });
  });

  function reveal() {
    if (!answerPanel) return;
    answerPanel.hidden = false;
    answerPanel.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }
  var revealButton = document.getElementById("reveal-answer");
  var skipButton = document.getElementById("skip-answer");
  if (revealButton) revealButton.addEventListener("click", reveal);
  if (skipButton) skipButton.addEventListener("click", function () { document.getElementById("concept-map").scrollIntoView({ behavior: "smooth" }); });

  document.querySelectorAll("[data-rating]").forEach(function (button) {
    button.addEventListener("click", function () {
      var rating = button.getAttribute("data-rating");
      var days = rating === "again" ? 1 : rating === "hard" ? 3 : 7;
      var due = new Date();
      due.setDate(due.getDate() + days);
      var record = { card: index, rating: rating, due: due.toISOString(), reviewedAt: new Date().toISOString() };
      try {
        var history = JSON.parse(localStorage.getItem("ai-learning-reviews") || "[]");
        history.push(record);
        localStorage.setItem("ai-learning-reviews", JSON.stringify(history.slice(-100)));
      } catch (e) {}
      reviewed += 1;
      if (reviewCount) reviewCount.textContent = "今日 " + Math.min(reviewed, 3) + " / 3";
      if (nextReview) nextReview.textContent = "已安排：" + days + " 天后再次取回。现在进入下一题。";
      window.setTimeout(function () {
        index = (index + 1) % cards.length;
        if (question) question.textContent = cards[index].q;
        if (modelAnswer) modelAnswer.textContent = cards[index].a;
        if (userAnswer) userAnswer.value = "";
        if (answerPanel) answerPanel.hidden = true;
        if (nextReview) nextReview.textContent = "";
      }, 850);
    });
  });

  var sizeButton = document.getElementById("text-size-toggle");
  if (sizeButton) {
    sizeButton.addEventListener("click", function () {
      var large = document.body.classList.toggle("large-reading-text");
      sizeButton.textContent = large ? "字 A−" : "字 A+";
      sizeButton.setAttribute("aria-pressed", large ? "true" : "false");
    });
  }
})();
