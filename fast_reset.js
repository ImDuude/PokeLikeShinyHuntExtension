(() => {
  if (window.__pokelikeFastReset) return;

  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  window.__pokelikeFastReset = { originalSetTimeout, originalSetInterval };

  window.setTimeout = function (fn, delay, ...args) {
    return originalSetTimeout(fn, typeof delay === "number" && delay >= 300 && delay <= 3000 ? 1 : delay, ...args);
  };
  window.setInterval = function (fn, delay, ...args) {
    return originalSetInterval(fn, typeof delay === "number" && delay >= 300 && delay <= 3000 ? 50 : delay, ...args);
  };
})();
