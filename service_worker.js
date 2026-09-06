async function getState() {
  const { enabled = false, shinyHunt = false, targetPokemon = "" } = await chrome.storage.local.get(["enabled", "shinyHunt", "targetPokemon"]);
  return { enabled, shinyHunt, targetPokemon };
}
function isPokelikeUrl(url = "") { return /^https:\/\/pokelike\.xyz\//.test(url); }
async function injectFile(tabId, file) {
  return chrome.scripting.executeScript({ target: { tabId }, files: [file], world: "MAIN" });
}
async function injectHuntConfig(tabId, state) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: targetPokemon => { window.__pokelikeShinyHuntConfig = { targetPokemon }; },
    args: [state.targetPokemon || ""]
  });
}
async function applyStateToTab(tabId, url, state) {
  if (!tabId || !isPokelikeUrl(url)) return;
  await injectFile(tabId, state.enabled ? "patch.js" : "unpatch.js");
  await injectHuntConfig(tabId, state);
  await injectFile(tabId, "pokedex_bridge.js");
  await injectFile(tabId, state.shinyHunt ? "shiny_hunt.js" : "shiny_stop.js");
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "GET_STATE") return sendResponse(await getState());
    if (message.type === "TOGGLE_SHINY_HUNT_FROM_PAGE") {
      const current = await getState();
      const next = { ...current, shinyHunt: !current.shinyHunt };
      await chrome.storage.local.set(next);
      if (sender.tab?.id) await applyStateToTab(sender.tab.id, sender.tab.url, next);
      return sendResponse(next);
    }
    if (message.type === "SET_TARGETS_FROM_PAGE") {
      const next = { ...await getState(), targetPokemon: String(message.targetPokemon || "").trim() };
      await chrome.storage.local.set(next);
      if (sender.tab?.id) await applyStateToTab(sender.tab.id, sender.tab.url, next);
      return sendResponse(next);
    }
    if (message.type === "RESET_SHINY_COUNTER_FROM_PAGE") {
      if (!sender.tab?.id || !isPokelikeUrl(sender.tab.url)) return sendResponse({ error: "Open pokelike.xyz" });
      await injectFile(sender.tab.id, "shiny_reset_counter.js");
      return sendResponse({ ok: true });
    }
    if (message.type === "SET_STATE") {
      const current = await getState();
      const next = { ...current };
      if ("enabled" in message) next.enabled = Boolean(message.enabled);
      if ("shinyHunt" in message) next.shinyHunt = Boolean(message.shinyHunt);
      if ("targetPokemon" in message) next.targetPokemon = String(message.targetPokemon || "").trim();
      await chrome.storage.local.set(next);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await applyStateToTab(tab.id, tab.url, next);
      return sendResponse(next);
    }
    if (message.type === "RESET_SHINY_COUNTER" || message.type === "DEBUG_SHINY") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !isPokelikeUrl(tab.url)) return sendResponse({ error: "Open pokelike.xyz" });
      const result = await injectFile(tab.id, message.type === "DEBUG_SHINY" ? "shiny_debug.js" : "shiny_reset_counter.js");
      return sendResponse({ ok: true, result: result?.[0]?.result });
    }
  })().catch(error => sendResponse({ error: String(error) }));
  return true;
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !isPokelikeUrl(tab.url)) return;
  try { await applyStateToTab(tabId, tab.url, await getState()); }
  catch (e) { console.error("[Pokelike] injection failed", e); }
});
