(() => {
  window.__pokelikeShinyHunt?.resetCounter?.();
  localStorage.setItem("pokelikeShinyHuntAttempts", "0");
  console.log("[Pokelike Shiny Hunt] counter reset");
})();
