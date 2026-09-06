(() => {
  const PANEL_ID = "pokelike-shiny-panel";
  let state = { shinyHunt: false, targetPokemon: "" };
  let catalog = [];
  let draftTargets = new Set();

  const send = (message, callback = () => {}) => chrome.runtime.sendMessage(message, response => {
    if (!chrome.runtime.lastError && response && !response.error) callback(response);
  });
  const isRunReady = () => Boolean(document.querySelector("#team-bar .team-slot"));
  const selectedTargets = () => new Set(String(state.targetPokemon || "").split(";").map(name => name.trim()).filter(Boolean));

  function setSettingsOpen(panel, open) {
    panel.querySelector("[data-main]").style.display = open ? "none" : "grid";
    panel.querySelector("[data-settings]").hidden = !open;
    const badge = document.getElementById("pokelike-shiny-hunt-badge");
    if (badge) badge.style.display = open ? "none" : "";
  }

  function ensureStyles() {
    if (document.getElementById("pokelike-shiny-panel-style")) return;
    const style = document.createElement("style");
    style.id = "pokelike-shiny-panel-style";
    style.textContent = `
      #${PANEL_ID}{position:fixed;right:12px;bottom:12px;z-index:2147483646;width:min(480px,calc(100vw - 24px));box-sizing:border-box;padding:8px;background:#252118;color:#e0dcd0;border:2px solid #454545;box-shadow:3px 3px 0 #454545;font:8px/1.6 "Press Start 2P",monospace}
      #${PANEL_ID} [data-main]{display:grid;grid-template-columns:1fr auto auto;gap:7px}
      #${PANEL_ID} [data-settings]{padding-top:3px}
      #${PANEL_ID} header{display:flex;justify-content:space-between;gap:10px;margin-bottom:9px;color:#f0ece0;font-size:9px;text-transform:uppercase}
      #${PANEL_ID} .filters{display:grid;grid-template-columns:1fr;gap:8px}
      #${PANEL_ID} .filters label,#${PANEL_ID} [data-list] label{display:flex;align-items:center;gap:6px;cursor:pointer}
      #${PANEL_ID} input[type="search"]{box-sizing:border-box;width:100%;padding:9px;background:#0e0e0e;color:#f0ece0;border:2px solid #454545;border-radius:0;font:8px/1.4 "Press Start 2P",monospace;outline:none}
      #${PANEL_ID} input[type="search"]:focus{border-color:#d49a10;box-shadow:2px 2px 0 #d49a10}
      #${PANEL_ID} input[type="checkbox"]{accent-color:#d49a10}
      #${PANEL_ID} button{padding:8px 10px;background:#252118;color:#e0dcd0;border:2px solid #454545;border-radius:0;box-shadow:3px 3px 0 #454545;cursor:pointer;font:8px/1.4 "Press Start 2P",monospace;text-transform:uppercase}
      #${PANEL_ID} button:hover{color:#ffd76b;border-color:#d49a10}
      #${PANEL_ID} button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #454545}
      #${PANEL_ID} button:disabled{opacity:.55;cursor:wait}
      #${PANEL_ID} [data-action="toggle"].is-on{color:#ffd76b;border-color:#d49a10}
      #${PANEL_ID} [data-list]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px;max-height:300px;overflow-y:auto;margin-top:9px;padding:7px;background:#0e0e0e;border:2px solid #454545;scrollbar-color:#d49a10 #252118}
      #${PANEL_ID} [data-list] label{padding:5px;border:1px solid transparent}
      #${PANEL_ID} [data-list] label:hover{color:#ffd76b;border-color:#454545;background:#252118}
      #${PANEL_ID} .legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:7px;color:#aaa;font-size:7px}
      #${PANEL_ID} .bulk,#${PANEL_ID} .actions{display:flex;gap:8px;margin-top:9px}
      #${PANEL_ID} .actions [data-action="save"]{color:#ffd76b;border-color:#d49a10}
      @media(max-width:600px){#${PANEL_ID} [data-list]{grid-template-columns:1fr}#${PANEL_ID} [data-main]{grid-template-columns:1fr} }
    `;
    document.documentElement.appendChild(style);
  }

  function createPanel() {
    ensureStyles();
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div data-main>
        <button type="button" data-action="toggle"></button>
        <button type="button" data-action="counter">Reset counter</button>
        <button type="button" data-action="settings">Select Pokémon</button>
      </div>
      <section data-settings hidden>
        <header><strong>Select hunt targets</strong><span data-selected></span></header>
        <div class="filters">
          <input type="search" data-search placeholder="Search by Pokémon or Pokédex number…">
          <label><input type="checkbox" data-missing checked> Missing shinies only</label>
          <label><input type="checkbox" data-ignore-legendaries checked> Ignore legendaries</label>
        </div>
        <div class="bulk">
          <button type="button" data-action="select-all">Select all</button>
          <button type="button" data-action="clear">Deselect all</button>
        </div>
        <div data-list>Reading Pokédex…</div>
        <div class="legend"><span>◆ Legendary</span><span>✓ Shiny already owned</span></div>
        <div class="actions">
          <button type="button" data-action="save">Save selection</button>
          <button type="button" data-action="cancel">Cancel</button>
        </div>
      </section>`;
    const settings = panel.querySelector("[data-settings]");

    panel.querySelector('[data-action="toggle"]').addEventListener("click", event => {
      event.currentTarget.disabled = true;
      send({ type: "TOGGLE_SHINY_HUNT_FROM_PAGE" }, next => { state = next; renderPanel(); });
    });
    panel.querySelector('[data-action="counter"]').addEventListener("click", () => send({ type: "RESET_SHINY_COUNTER_FROM_PAGE" }, renderPanel));
    panel.querySelector('[data-action="settings"]').addEventListener("click", () => {
      draftTargets = selectedTargets();
      setSettingsOpen(panel, true);
      settings.querySelector('[data-search]').value = "";
      settings.querySelector('[data-list]').textContent = "Reading Pokédex…";
      document.dispatchEvent(new Event("pokelike-read-pokedex"));
    });
    settings.querySelector('[data-search]').addEventListener("input", renderPokemonList);
    settings.querySelector('[data-missing]').addEventListener("change", renderPokemonList);
    settings.querySelector('[data-ignore-legendaries]').addEventListener("change", event => {
      if (event.currentTarget.checked) {
        const legendaryNames = new Set(catalog.filter(pokemon => pokemon.legendary).map(pokemon => pokemon.name));
        for (const name of draftTargets) if (legendaryNames.has(name)) draftTargets.delete(name);
      }
      renderPokemonList();
    });
    panel.querySelector('[data-action="select-all"]').addEventListener("click", () => {
      for (const input of settings.querySelectorAll('[data-list] input[type="checkbox"]')) draftTargets.add(input.value);
      renderPokemonList();
    });
    panel.querySelector('[data-action="clear"]').addEventListener("click", () => { draftTargets.clear(); renderPokemonList(); });
    panel.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      setSettingsOpen(panel, false);
    });
    panel.querySelector('[data-action="save"]').addEventListener("click", () => {
      send({ type: "SET_TARGETS_FROM_PAGE", targetPokemon: [...draftTargets].join("; ") }, next => {
        state = next;
        setSettingsOpen(panel, false);
        renderPanel();
      });
    });
    document.documentElement.appendChild(panel);
    return panel;
  }

  function renderPokemonList() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const settings = panel.querySelector("[data-settings]");
    const list = settings.querySelector("[data-list]");
    const query = settings.querySelector('[data-search]').value.trim().toLowerCase();
    const missingOnly = settings.querySelector('[data-missing]').checked;
    const ignoreLegendaries = settings.querySelector('[data-ignore-legendaries]').checked;
    const visible = catalog.filter(pokemon => (!missingOnly || pokemon.missingShiny) &&
      (!ignoreLegendaries || !pokemon.legendary) &&
      (!query || pokemon.name.toLowerCase().includes(query) || String(pokemon.speciesId).includes(query)));
    list.textContent = "";
    for (const pokemon of visible) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = pokemon.name;
      checkbox.checked = draftTargets.has(pokemon.name);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? draftTargets.add(pokemon.name) : draftTargets.delete(pokemon.name);
        updateSelectedCount(settings);
      });
      label.append(checkbox, ` ${pokemon.legendary ? "◆ " : ""}#${pokemon.speciesId} ${pokemon.name}${pokemon.missingShiny ? "" : " ✓"}`);
      label.title = pokemon.missingShiny ? "Shiny missing" : "Shiny already in Pokédex";
      if (!pokemon.missingShiny) label.style.opacity = ".6";
      list.appendChild(label);
    }
    if (!visible.length) list.textContent = "No Pokémon match these filters.";
    updateSelectedCount(settings);
  }

  function updateSelectedCount(settings) {
    settings.querySelector("[data-selected]").textContent = `${draftTargets.size} selected`;
  }

  function renderPanel() {
    let panel = document.getElementById(PANEL_ID);
    panel ||= createPanel();
    const toggle = panel.querySelector('[data-action="toggle"]');
    const ready = isRunReady();
    const label = ready ? `Shiny Hunt: ${state.shinyHunt ? "ON" : "OFF"}` : "Start a run to hunt";
    if (toggle.textContent !== label) toggle.textContent = label;
    toggle.disabled = !ready;
    toggle.classList.toggle("is-on", ready && state.shinyHunt);
    panel.querySelector('[data-action="settings"]').title = state.targetPokemon ? `Targets: ${state.targetPokemon}` : "Target: any shiny";
  }

  chrome.storage.local.get({ shinyHunt: false, targetPokemon: "" }, saved => { state = saved; renderPanel(); });
  chrome.storage.onChanged.addListener(changes => {
    if (changes.shinyHunt) state.shinyHunt = Boolean(changes.shinyHunt.newValue);
    if (changes.targetPokemon) state.targetPokemon = changes.targetPokemon.newValue || "";
    renderPanel();
  });
  document.addEventListener("pokelike-pokedex-ready", () => {
    try {
      catalog = JSON.parse(document.documentElement.dataset.pokelikePokedex || "[]");
      delete document.documentElement.dataset.pokelikePokedex;
      renderPokemonList();
    } catch {}
  });
  new MutationObserver(renderPanel).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(renderPanel, 500);
})();
