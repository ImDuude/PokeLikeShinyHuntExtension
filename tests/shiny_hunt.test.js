const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const huntSource = fs.readFileSync(path.join(__dirname, "..", "shiny_hunt.js"), "utf8");
const panelSource = fs.readFileSync(path.join(__dirname, "..", "content_bridge.js"), "utf8");

async function run(targetPokemon, offers) {
  const timers = [];
  let resetClicked = false;
  const badge = { style: {}, textContent: "", remove: () => {} };
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
  vm.runInNewContext(huntSource, context);
  await timers.shift()();
  return { status: context.__pokelikeShinyHunt.status(), resetClicked, badge };
}

function testSvgClickFallback() {
  assert.match(huntSource, /typeof el\.click === "function"/);
  assert.match(huntSource, /dispatchEvent\(new MouseEvent\("click"/);
}

function testPanelSupportsEveryMode() {
  assert.doesNotMatch(panelSource, /Challenge Stage/);
  assert.match(panelSource, /Start a run to hunt/);
  assert.doesNotMatch(panelSource, /pokelikeShinyHuntAttempts.*toggle/);
}

(async () => {
  testSvgClickFallback();
  testPanelSupportsEveryMode();
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
