(function () {
  "use strict";
  const card = document.getElementById("work-card");
  const picker = document.getElementById("owner-picker");
  const confirm = document.getElementById("confirm-actions");
  const summary = document.getElementById("card-summary");
  let activeOwnerButton = null;

  document.querySelectorAll(".owner-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeOwnerButton = button;
      picker.classList.add("is-open");
    });
  });

  document.querySelectorAll(".owner-options button").forEach((option) => {
    option.addEventListener("click", () => {
      if (!activeOwnerButton) return;
      activeOwnerButton.textContent = `负责人：${option.textContent}`;
      activeOwnerButton.dataset.assigned = "true";
      picker.classList.remove("is-open");
      const remaining = document.querySelectorAll('.owner-button:not([data-assigned="true"])').length;
      summary.textContent = remaining ? `还有 ${remaining} 个行动项需要负责人。` : "负责人已经补齐，可以确认进入任务流。";
    });
  });

  confirm.addEventListener("click", () => {
    const next = document.querySelector('.owner-button:not([data-assigned="true"])');
    if (next) {
      next.click();
      summary.textContent = "先补上负责人，避免行动在会后失去承接。";
      return;
    }
    card.classList.add("is-done");
    summary.textContent = "4 个行动项已确认，并保留在原有协作流程中。";
    confirm.textContent = "已确认 · 回到对话";
    confirm.disabled = true;
    document.getElementById("later-action").hidden = true;
  });

  document.getElementById("later-action").addEventListener("click", (event) => {
    event.currentTarget.textContent = "已设为明天上午提醒";
    event.currentTarget.disabled = true;
  });
})();
