const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const calls = [];
const context = {
  setTimeout: (_fn, delay) => calls.push(["timeout", delay]),
  setInterval: (_fn, delay) => calls.push(["interval", delay])
};
context.window = context;

vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "fast_reset.js"), "utf8"), context);
context.setTimeout(() => {}, 500);
context.setTimeout(() => {}, 100);
context.setInterval(() => {}, 1000);

assert.deepEqual(calls, [["timeout", 1], ["timeout", 100], ["interval", 50]]);
console.log("fast_reset tests passed");
