(() => {
  const BUTTON_ID = "pokelike-pokesort-solve";
  const STYLE_ID = "pokelike-pokesort-styles";
  const TYPE_COLORS = {
    normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#f8d030", grass: "#78c850", ice: "#98d8d8",
    fighting: "#c03028", poison: "#a040a0", ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820",
    rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#b8b8d0", fairy: "#ee99ac"
  };
  const BODY_COLORS = {
    black: "#333", blue: "#4f83d1", brown: "#98623d", gray: "#999", green: "#65a94d",
    pink: "#df83a7", purple: "#8c55ad", red: "#d75454", white: "#eee", yellow: "#e8c83a"
  };

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .pokelike-pokesort-info { position:absolute;left:50%;bottom:calc(100% + 9px);z-index:4;display:grid;gap:3px;justify-items:center;box-sizing:border-box;width:86px;padding:5px 4px;color:#e0dcd0;background:linear-gradient(180deg,#302a1d,#17140e);border:1px solid #b58a28;border-radius:3px;box-shadow:inset 0 0 0 1px #0d0c09,2px 2px 0 #0008;transform:translateX(-50%);font:6px/1.4 "Press Start 2P",monospace;pointer-events:none }
      .pokelike-pokesort-info::after { content:"";position:absolute;left:50%;bottom:-5px;width:7px;height:7px;background:#17140e;border-right:1px solid #b58a28;border-bottom:1px solid #b58a28;transform:translateX(-50%) rotate(45deg) }
      .pokelike-pokesort-facts,.pokelike-pokesort-types { display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:3px }
      .pokelike-pokesort-fact { white-space:nowrap;color:#d7c894 }
      .pokelike-pokesort-color-dot { display:inline-block;width:7px;height:7px;margin-right:2px;border:1px solid #111;border-radius:50%;vertical-align:-1px }
      .pokelike-pokesort-type { padding:2px 4px;color:#fff;border:1px solid #ffffff55;border-radius:2px;box-shadow:1px 1px 0 #0009;text-shadow:1px 1px #000;white-space:nowrap }
    `;
    document.documentElement.appendChild(style);
  }

  function makeElement(className, text) {
    const element = document.createElement("span");
    element.className = className;
    element.textContent = text;
    return element;
  }

  function decorateSlots() {
    if (typeof _pcState === "undefined" || !_pcState || !Array.isArray(_pcState.slots) || typeof pcMon !== "function") return;
    document.querySelectorAll("#pc-chain .pc-slot").forEach(slot => {
      if (slot.querySelector(".pokelike-pokesort-info")) return;
      const pokemon = pcMon(_pcState.slots[Number(slot.dataset.idx)]);
      if (!pokemon) return;

      const info = document.createElement("div");
      info.className = "pokelike-pokesort-info";
      const facts = document.createElement("div");
      facts.className = "pokelike-pokesort-facts";
      facts.append(
        makeElement("pokelike-pokesort-fact", `GEN ${pokemon.gen}`),
        makeElement("pokelike-pokesort-fact", `STAGE ${Number(pokemon.stage) + 1}`)
      );

      const color = makeElement("pokelike-pokesort-fact", String(pokemon.color || "Unknown"));
      const dot = document.createElement("span");
      dot.className = "pokelike-pokesort-color-dot";
      dot.style.backgroundColor = BODY_COLORS[String(pokemon.color).toLowerCase()] || "#777";
      color.prepend(dot);
      facts.append(color);

      const types = document.createElement("div");
      types.className = "pokelike-pokesort-types";
      (pokemon.types || []).forEach(type => {
        const badge = makeElement("pokelike-pokesort-type", String(type).toUpperCase());
        badge.style.backgroundColor = TYPE_COLORS[String(type).toLowerCase()] || "#666";
        types.append(badge);
      });
      info.append(facts, types);
      slot.prepend(info);
    });
  }

  function installButton() {
    const submit = document.getElementById("pc-submit");
    if (!submit) return;
    let button = document.getElementById(BUTTON_ID);
    if (!button) {
      button = document.createElement("button");
      button.id = BUTTON_ID;
      button.type = "button";
      button.className = "btn-primary btn-md pc-solve";
      button.style.marginBottom = "8px";
      button.addEventListener("click", () => {
        try {
          if (typeof _pcState === "undefined" || !_pcState || !Array.isArray(_pcState.solution)) throw new Error("Puzzle solution unavailable");
          _pcState.slots = _pcState.solution.slice();
          if (typeof pcRenderChain !== "function") throw new Error("Puzzle renderer unavailable");
          pcRenderChain(submit.closest(".game-modal-box") || document);
          decorateSlots();
          button.textContent = "Solved ✓";
          button.disabled = true;
        } catch (error) {
          button.textContent = "Could not solve";
          console.error("[Pokelike Pokésort]", error);
        }
      });
      submit.before(button);
    }
    const solved = typeof _pcState !== "undefined" && _pcState && _pcState.solved;
    const label = solved ? "Solved ✓" : "Solve";
    if (button.textContent !== label) button.textContent = label;
    if (button.disabled !== Boolean(solved)) button.disabled = Boolean(solved);
  }

  function refresh() {
    ensureStyles();
    installButton();
    decorateSlots();
  }
  refresh();
  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
})();
