(() => {
  const res = window.__pokelikeShinyHunt?.debug?.() || { error: "Shiny hunt not loaded" };
  console.group("[Pokelike Shiny Hunt] Debug snapshot");
  console.log(res);
  console.groupEnd();
  return res;
})();
