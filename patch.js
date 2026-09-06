(() => {
  if (window.__pokelikeSpeedPatch) return;
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  window.__pokelikeSpeedPatch = {
    originalSetTimeout,
    originalSetInterval,
    disable() {
      window.setTimeout = originalSetTimeout;
      window.setInterval = originalSetInterval;
      delete window.__pokelikeSpeedPatch;
      console.log("[Pokelike] Speed patch disabled");
    }
  };
  window.setTimeout = function (fn, delay, ...args) {
    if (typeof delay === "number" && delay >= 300 && delay <= 3000) delay = 1;
    return originalSetTimeout(fn, delay, ...args);
  };
  window.setInterval = function (fn, delay, ...args) {
    if (typeof delay === "number" && delay >= 300 && delay <= 3000) delay = 50;
    return originalSetInterval(fn, delay, ...args);
  };
  console.log("[Pokelike] Speed patch active");
})();
