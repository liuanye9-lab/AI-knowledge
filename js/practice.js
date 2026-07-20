(function () {
  "use strict";

  var filterRoot = document.querySelector("[data-problem-filter]");
  var filterButtons = filterRoot
    ? Array.from(filterRoot.querySelectorAll("[data-filter]"))
    : [];
  var problemCards = Array.from(document.querySelectorAll("[data-problem]"));

  function setProblemFilter(filter) {
    filterButtons.forEach(function (button) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.filter === filter ? "true" : "false",
      );
    });

    problemCards.forEach(function (card) {
      var matches = filter === "all" || card.dataset.problem === filter;
      card.classList.toggle("is-muted", !matches);
    });
  }

  if (filterRoot) {
    filterRoot.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button || !filterRoot.contains(button)) return;
      setProblemFilter(button.dataset.filter || "all");
    });
  }

  async function copyCommand(button) {
    var block = button.closest(".copy-block");
    var code = block ? block.querySelector("code") : null;
    if (!code) return;

    var original = button.textContent;
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      button.textContent = "已复制";
    } catch (error) {
      button.textContent = "复制失败";
    }

    window.setTimeout(function () {
      button.textContent = original;
    }, 1600);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy-command]");
    if (button) copyCommand(button);
  });
})();
