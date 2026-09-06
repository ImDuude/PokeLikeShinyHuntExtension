const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let click;
let renderedWith;
let infoPanel;
const modal = {};
const submit = { before: () => {}, closest: () => modal };
function element(tagName = "div") {
  return {
    tagName, children: [], style: {},
    append(...children) { this.children.push(...children); },
    prepend(...children) { this.children.unshift(...children); },
    addEventListener(_type, listener) { click = listener; }
  };
}
const slot = element();
slot.dataset = { idx: "0" };
slot.querySelector = () => null;
slot.prepend = child => { infoPanel = child; };

const source = fs.readFileSync(path.join(__dirname, "..", "pokesort_solver.js"), "utf8");
assert.doesNotThrow(() => vm.runInNewContext(source, {
  _pcState: null,
  MutationObserver: class { observe() {} },
  document: {
    documentElement: { appendChild: () => {} },
    getElementById: () => null,
    createElement: tagName => element(tagName)
  }
}));

let solvedButton;
let solvedRefresh;
let labelWrites = 0;
vm.runInNewContext(source, {
  _pcState: { solved: true, slots: [] },
  MutationObserver: class {
    constructor(callback) { solvedRefresh = callback; }
    observe() {}
  },
  document: {
    documentElement: { appendChild: () => {} },
    getElementById: id => id === "pc-submit" ? submit : id === "pokelike-pokesort-solve" ? solvedButton : null,
    querySelectorAll: () => [],
    createElement: tagName => {
      const created = element(tagName);
      if (tagName === "button") {
        Object.defineProperty(created, "textContent", {
          get() { return this._textContent; },
          set(value) { labelWrites++; this._textContent = value; }
        });
        solvedButton = created;
      }
      return created;
    }
  }
});
assert.equal(solvedButton.textContent, "Solved ✓");
assert.equal(solvedButton.disabled, true);
solvedRefresh();
assert.equal(labelWrites, 1, "refresh must not trigger another DOM mutation when the label is unchanged");

const context = {
  console,
  _pcState: { solution: [678, 456, 195, 573, 517, 660], slots: [678] },
  pcMon: id => id === 678 && { gen: 6, stage: 1, color: "Blue", types: ["Psychic", "Normal"] },
  pcRenderChain: root => { renderedWith = root; },
  MutationObserver: class { observe() {} },
  document: {
    documentElement: { appendChild: () => {} },
    getElementById: id => id === "pc-submit" ? submit : null,
    querySelectorAll: () => [slot],
    createElement: tagName => element(tagName)
  }
};

vm.runInNewContext(source, context);
const text = infoPanel.children.flatMap(child => child.children).map(child => child.textContent);
assert.deepEqual(text, ["GEN 6", "STAGE 2", "Blue", "PSYCHIC", "NORMAL"]);

click();
assert.deepEqual(context._pcState.slots, context._pcState.solution);
assert.notEqual(context._pcState.slots, context._pcState.solution);
assert.equal(renderedWith, modal);
console.log("pokesort_solver tests passed");
