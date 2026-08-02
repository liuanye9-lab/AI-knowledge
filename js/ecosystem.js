(function () {
  "use strict";

  var list = document.getElementById("scenario-list");
  var search = document.getElementById("ecosystem-search");
  var query = document.getElementById("ecosystem-query");
  var showToday = document.getElementById("show-today");
  var empty = document.getElementById("scenario-empty");
  if (!list) return;

  function setOpen(row, open) {
    var button = row.querySelector(".scenario-toggle");
    var detail = row.querySelector(".scenario-detail");
    var label = row.querySelector(".scenario-open");
    row.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    detail.hidden = !open;
    label.textContent = open ? "收起" : "展开";
  }

  list.addEventListener("click", function (event) {
    var button = event.target.closest(".scenario-toggle");
    if (!button) return;
    var row = button.closest(".scenario-row");
    setOpen(row, !row.classList.contains("is-open"));
  });

  showToday.addEventListener("click", function () {
    var active = list.querySelector(".scenario-row.is-open") || list.querySelector(".scenario-row");
    setOpen(active, true);
    active.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function filterScenarios(shouldScroll) {
    var term = query.value.trim().toLowerCase();
    var visible = 0;
    list.querySelectorAll(".scenario-row").forEach(function (row) {
      var match = !term || (row.dataset.search + " " + row.textContent).toLowerCase().includes(term);
      row.hidden = !match;
      if (match) visible += 1;
    });
    empty.hidden = visible > 0;
    if (visible) {
      var first = list.querySelector(".scenario-row:not([hidden])");
      setOpen(first, true);
      if (shouldScroll) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  query.addEventListener("input", function () {
    filterScenarios(false);
  });

  search.addEventListener("submit", function (event) {
    event.preventDefault();
    filterScenarios(true);
  });
})();
