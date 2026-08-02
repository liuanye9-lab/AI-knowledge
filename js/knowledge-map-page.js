(function () {
  "use strict";
  var map = window.AI_KNOWLEDGE_MAP;
  if (!map) return;
  var hubRoot = document.getElementById("hub-bands");

  hubRoot.innerHTML = map.hubs.map(function (hub, index) {
    return '<a class="hub-band" href="' + hub.href + '"><span>0' + (index + 1) + '</span><div><h2>' + hub.title + '</h2><p>' + hub.summary + '</p></div><img src="' + hub.image + '" alt="" width="1536" height="1024" loading="lazy" /><b>进入 →</b></a>';
  }).join("");

})();
