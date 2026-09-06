const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function run(targetPokemon, offers) {
  const timers = [];
  let resetClicked = false;
  const badge = { style: {}, textContent: "" };
  const reset = {
    classList: { contains: name => name === "nav-in-run" },
    getBoundingClientRect: () => ({ width: 20, height: 20 }),
    click: () => { resetClicked = true; }
  };
  const context = {
    console,
    state: { savedCatch: { instances: offers } },
    localStorage: { getItem: () => "0", setItem: () => {} },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    setTimeout: callback => (timers.push(callback), timers.length),
    clearTimeout: () => {},
    document: {
      documentElement: { appendChild: () => {} },
      createElement: () => badge,
      getElementById: id => id === "pokelike-shiny-hunt-badge" ? badge : null,
      querySelector: selector => selector === "#catch-screen.active" ? {} : null,
      querySelectorAll: selector => selector === 'button[aria-label="Reset Run"]' ? [reset] : []
    }
  };
  context.window = context;
  context.__pokelikeShinyHuntConfig = { targetPokemon };
  vm.runInNewContext(fs.readFileSync("shiny_hunt.js", "utf8"), context);
  await timers.shift()();
  return { status: context.__pokelikeShinyHunt.status(), resetClicked, badge };
}

function testSvgClickFallback() {
  const source = require("node:fs").readFileSync("shiny_hunt.js", "utf8");
  assert.match(source, /typeof el\.click === "function"/);
  assert.match(source, /dispatchEvent\(new MouseEvent\("click"/);
}

(async () => {
  testSvgClickFallback();
  const found = await run("Alomomola", [
    { name: "Spheal", isShiny: true },
    { name: "Alomomola", speciesId: 594, isShiny: true }
  ]);
  assert.equal(found.status.running, false);
  assert.equal(found.resetClicked, false);
  assert.match(found.badge.textContent, /Alomomola shiny found/);

  const alternative = await run("Feebas; Spheal", [{ name: "Spheal", isShiny: true }]);
  assert.equal(alternative.status.running, false);
  assert.equal(alternative.resetClicked, false);

  const missed = await run("Alomomola", [{ name: "Spheal", isShiny: true }]);
  assert.equal(missed.status.running, true);
  assert.equal(missed.resetClicked, true);
  console.log("shiny_hunt tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
