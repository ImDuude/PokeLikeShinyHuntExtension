(() => {
  const VERSION = "2.1.1";
  const OPTIONS = { tickMs: 100, afterActionMs: 250, minResetGapMs: 500, storageKey: "pokelikeShinyHuntAttempts" };

  const visible = el => {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 3 && rect.height > 3;
  };
  const normalizeName = value => String(value || "").trim().toLowerCase();
  const targetNames = () => String(window.__pokelikeShinyHuntConfig?.targetPokemon || "")
    .split(";").map(normalizeName).filter(Boolean);
  const targetLabel = () => {
    const targets = targetNames();
    return targets.length > 1 ? `${targets.length} targets` : targets[0] || "any shiny";
  };
  const matchesTarget = pokemon => pokemon?.isShiny === true &&
    (!targetNames().length || targetNames().includes(normalizeName(pokemon.name)));
  const catchOffers = () => typeof state !== "undefined" && Array.isArray(state?.savedCatch?.instances) ? state.savedCatch.instances : [];
  const activeScreen = id => document.querySelector(`#${id}.active`);
  const pokeballNode = () => [...document.querySelectorAll("#map-screen.active g.map-node--clickable")].find(node =>
    node.querySelector('image[href="img/sprites/g1/pokeball.png"], image[xlink\\:href="img/sprites/g1/pokeball.png"]')
  );
  const resetButton = () => [...document.querySelectorAll('button[aria-label="Reset Run"]')].find(button =>
    visible(button) && button.classList.contains("nav-in-run")
  ) || document.querySelector('[data-menu="reset"]');
  const click = el => {
    if (!el) return false;
    if (typeof el.click === "function") el.click();
    else el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  };

  function ensureBadge() {
    let badge = document.getElementById("pokelike-shiny-hunt-badge");
    if (badge) return badge;
    badge = document.createElement("button");
    badge.type = "button";
    badge.id = "pokelike-shiny-hunt-badge";
    badge.title = "Click to stop the shiny hunt";
    badge.style.cssText = "position:fixed;right:12px;bottom:64px;z-index:2147483647;background:#252118;color:#e0dcd0;padding:8px 10px;border:2px solid #454545;border-radius:0;box-shadow:3px 3px 0 #454545;font:8px/1.6 'Press Start 2P',monospace;cursor:help;white-space:pre-line;text-transform:uppercase";
    document.documentElement.appendChild(badge);
    return badge;
  }

  function setBadge(text, success = false) {
    const badge = ensureBadge();
    badge.textContent = text;
    const targets = targetNames();
    badge.title = targets.length ? `Hunt targets:\n${targets.join("\n")}` : "Hunt target: any shiny";
    badge.style.borderColor = success ? "#d49a10" : "#454545";
    badge.style.color = success ? "#ffd76b" : "#e0dcd0";
  }

  function removeBadge() {
    document.getElementById("pokelike-shiny-hunt-badge")?.remove();
  }

  function createHunt() {
    let running = false;
    let timer;
    let attempts = Number(localStorage.getItem(OPTIONS.storageKey) || 0);
    let lastResetAt = 0;
    let lastOffers = [];
    const schedule = delay => { timer = setTimeout(tick, delay); };

    async function tick() {
      if (!running) return;

      if (activeScreen("catch-screen")) {
        const offers = catchOffers();
        if (!offers.length) return schedule(OPTIONS.tickMs);
        lastOffers = offers.map(pokemon => ({ name: pokemon.name, speciesId: pokemon.speciesId, isShiny: pokemon.isShiny === true }));
        const match = offers.find(matchesTarget);
        if (match) {
          running = false;
          clearTimeout(timer);
          setBadge(`✨ ${match.name} shiny found!\n${attempts} reset(s)`, true);
          const card = [...document.querySelectorAll("#catch-choices .poke-card")]
            .find(el => normalizeName(el.querySelector(".poke-name")?.textContent) === normalizeName(match.name));
          if (card) card.style.outline = "4px solid gold";
          console.log("[Pokelike Shiny Hunt] Matching shiny found", match);
          return;
        }

        if (Date.now() - lastResetAt < OPTIONS.minResetGapMs) return schedule(OPTIONS.tickMs);
        const button = resetButton();
        if (!button) return schedule(OPTIONS.tickMs);
        lastResetAt = Date.now();
        attempts += 1;
        localStorage.setItem(OPTIONS.storageKey, String(attempts));
        setBadge(`Hunting ${targetLabel()}\nreset #${attempts}`);
        click(button);
        return schedule(OPTIONS.afterActionMs);
      }

      if (activeScreen("map-screen")) {
        const ball = pokeballNode();
        if (ball) {
          setBadge(`Hunting ${targetLabel()}\n${attempts} reset(s)`);
          click(ball);
          return schedule(OPTIONS.afterActionMs);
        }
      }
      removeBadge();
      schedule(OPTIONS.tickMs);
    }

    return {
      start() {
        if (running) return;
        running = true;
        schedule(30);
        console.log(`[Pokelike Shiny Hunt] active v${VERSION}`, { targets: targetNames() });
      },
      stop(reason = "stopped") {
        running = false;
        clearTimeout(timer);
        removeBadge();
      },
      resetCounter() {
        attempts = 0;
        localStorage.setItem(OPTIONS.storageKey, "0");
        if (document.getElementById("pokelike-shiny-hunt-badge")) setBadge("Counter reset");
      },
      debug() {
        const snapshot = {
          version: VERSION,
          running,
          attempts,
          targetPokemon: targetNames(),
          activeScreen: document.querySelector(".screen.active")?.id || null,
          offers: catchOffers().map(pokemon => ({ name: pokemon.name, speciesId: pokemon.speciesId, isShiny: pokemon.isShiny === true })),
          lastOffers,
          pokeballFound: Boolean(pokeballNode()),
          resetFound: Boolean(resetButton())
        };
        console.log("[Pokelike Shiny Hunt] Debug", snapshot);
        return snapshot;
      },
      status: () => ({ running, attempts, targetPokemon: targetNames(), offers: lastOffers, version: VERSION })
    };
  }

  window.__pokelikeShinyHunt?.stop?.("reloaded");
  window.__pokelikeShinyHunt = createHunt();
  window.__pokelikeShinyHunt.start();
})();
