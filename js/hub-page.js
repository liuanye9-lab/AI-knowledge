(function () {
  "use strict";
  var map = window.AI_KNOWLEDGE_MAP;
  var root = document.querySelector("[data-hub-id]");
  if (!map || !root) return;
  var hub = map.hubs.find(function (item) { return item.id === root.dataset.hubId; });
  if (!hub) return;

  document.title = hub.title + " · 跨学科判断力知识库";
  root.innerHTML =
    '<section class="judgment-hero">' +
      '<div class="judgment-hero-copy"><a class="back-map" href="knowledge-map.html">← 返回判断力地图</a>' +
      '<h1>' + hub.title + '</h1><p>' + hub.summary + '</p>' +
      '<div class="three-judgments"><strong>进入这个领域，先判断三件事</strong>' +
      '<ol><li>真正要改善的结果是什么？</li><li>最关键的约束与失败代价是什么？</li><li>Agent 做到哪里，必须由谁验收？</li></ol></div></div>' +
      '<figure><img src="' + hub.image + '" alt="' + hub.title + '的水彩判断模型" width="1536" height="1024" fetchpriority="high" /></figure>' +
    '</section>' +
    '<section class="judgment-unit" aria-labelledby="decision-title">' +
      '<div class="judgment-unit-head"><span>01</span><div><p>现实决定</p><h2 id="decision-title">' + hub.decision + '</h2></div></div>' +
      '<div class="essential-rail"><h3>只掌握最关键的 20%</h3>' +
      '<ol>' + hub.essentials.map(function (item) { return '<li>' + item + '</li>'; }).join("") + '</ol></div>' +
    '</section>' +
    '<section class="mental-model"><figure><img src="' + hub.modelImage + '" alt="' + hub.title + '的可视化心理模型" width="1536" height="1024" loading="lazy" /></figure>' +
      '<div><p>一张心理模型</p><h2>不追求学透，而是能看见关系、取舍和边界。</h2>' +
      '<div class="topic-lines">' + hub.topics.map(function (topic) { return '<article><strong>' + topic[0] + '</strong><span>' + topic[1] + '</span></article>'; }).join("") + '</div></div></section>' +
    '<section class="human-agent-split"><article><p>可以交给 Agent</p><ul>' + hub.agent.map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ul></article>' +
      '<article><p>必须由人判断</p><ul>' + hub.human.map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ul></article></section>' +
    '<section class="case-band"><div><p>常见误判</p><h2>' + hub.failure + '</h2></div><div><p>真实项目</p><h2>' + hub.case + '</h2></div></section>' +
    '<section class="checklist-skill"><div><p>直接使用的检查表</p><ol>' + hub.checklist.map(function (x) { return '<li><label><input type="checkbox" /> <span>' + x + '</span></label></li>'; }).join("") + '</ol></div>' +
      '<aside><p>完成后沉淀</p><h2>' + hub.skill + '</h2><span>保存触发条件、输入、步骤、检查项和必须审批的外部动作。</span><a href="knowledge-map.html#map-task-input">带着真实任务回到能力地图 →</a></aside></section>' +
    '<section class="evidence-sources"><header><p>证据与来源</p><h2>研究、实践与开源实现分开标注</h2></header>' +
      '<div>' + hub.sources.map(function (source) { return '<a href="' + source[2] + '" target="_blank" rel="noopener"><small>' + source[0] + '</small><strong>' + source[1] + '</strong></a>'; }).join("") + '</div></section>';
})();
