const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const huntSource = fs.readFileSync(path.join(__dirname, "..", "shiny_hunt.js"), "utf8");
const panelSource = fs.readFileSync(path.join(__dirname, "..", "content_bridge.js"), "utf8");

async function run(targetPokemon, offers, skipCurrentOffers = false) {
  const timers = [];
  const events = [];
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
    Event: class { constructor(type) { this.type = type; } },
    document: {
      documentElement: { appendChild: () => {} },
      createElement: () => badge,
      getElementById: id => id === "pokelike-shiny-hunt-badge" ? badge : null,
      dispatchEvent: event => events.push(event.type),
      querySelector: selector => selector === "#catch-screen.active" ? {} : null,
      querySelectorAll: selector => selector === 'button[aria-label="Reset Run"]' ? [reset] : []
    }
  };
  context.window = context;
  if (skipCurrentOffers) context.__pokelikeShinyHuntLastFoundOffers = offers;
  context.__pokelikeShinyHuntConfig = { targetPokemon };
  vm.runInNewContext(huntSource, context);
  await timers.shift()();
  return { status: context.__pokelikeShinyHunt.status(), resetClicked, badge, events };
}

function testSvgClickFallback() {
  assert.match(huntSource, /typeof el\.click === "function"/);
  assert.match(huntSource, /dispatchEvent\(new MouseEvent\("click"/);
}

function testPanelSupportsEveryMode() {
  assert.doesNotMatch(panelSource, /Challenge Stage/);
  assert.match(panelSource, /Start a run to hunt/);
  assert.match(panelSource, /\[data-action="counter"\]'\)\.hidden = !ready/);
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
  assert.deepEqual(found.events, ["pokelike-shiny-found"]);

  const alternative = await run("Feebas; Spheal", [{ name: "Spheal", isShiny: true }]);
  assert.equal(alternative.status.running, false);
  assert.equal(alternative.resetClicked, false);

  const restarted = await run("Alomomola", [{ name: "Alomomola", speciesId: 594, isShiny: true }], true);
  assert.equal(restarted.status.running, true);
  assert.equal(restarted.resetClicked, true);
  assert.deepEqual(restarted.events, []);

  const missed = await run("Alomomola", [{ name: "Spheal", isShiny: true }]);
  assert.equal(missed.status.running, true);
  assert.equal(missed.resetClicked, true);
  console.log("shiny_hunt tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
