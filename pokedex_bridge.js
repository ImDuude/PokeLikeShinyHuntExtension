(() => {
  if (window.__pokelikePokedexBridge) return;
  window.__pokelikePokedexBridge = true;

  document.addEventListener("pokelike-read-pokedex", () => {
    try {
      if (typeof getShinyDex !== "function" || typeof getSpeciesName !== "function") return;
      const shinyDex = getShinyDex();
      const ids = new Set([
        ...(typeof ALL_CATCHABLE_IDS !== "undefined" ? ALL_CATCHABLE_IDS : []),
        ...(typeof LEGENDARY_IDS !== "undefined" ? LEGENDARY_IDS : [])
      ]);
      const pokemon = [...ids]
        .map(Number)
        .filter(Number.isFinite)
        .filter(speciesId => typeof getEvoLineRoot !== "function" || getEvoLineRoot(speciesId) === speciesId)
        .map(speciesId => ({
          speciesId,
          name: getSpeciesName(speciesId),
          missingShiny: !shinyDex[speciesId],
          legendary: typeof LEGENDARY_ID_SET !== "undefined" && (
            LEGENDARY_ID_SET.has(speciesId) ||
            (typeof getEvoLineRoot === "function" && LEGENDARY_ID_SET.has(getEvoLineRoot(speciesId)))
          )
        }))
        .filter(entry => entry.name)
        .sort((a, b) => a.speciesId - b.speciesId);

      document.documentElement.dataset.pokelikePokedex = JSON.stringify(pokemon);
      document.dispatchEvent(new Event("pokelike-pokedex-ready"));
    } catch (error) {
      console.error("[Pokelike Shiny Hunt] Could not read Pokédex", error);
    }
  });
})();
