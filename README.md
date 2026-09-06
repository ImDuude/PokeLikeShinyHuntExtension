# Pokelike Shiny Hunt

An unofficial Chrome extension for [pokelike.xyz](https://pokelike.xyz/) that automates shiny hunting in every run mode.

Tested with the latest Pokelike version: **v3.0.1**.

## Features

- Reads the offered Pokémon name and `isShiny` value directly from the game's state instead of using image recognition.
- Automatically selects the Pokéball node and resets the run until a matching shiny appears.
- Lets you hunt any shiny or select multiple target Pokémon.
- Provides a searchable, scrollable Pokémon list with Select all and Deselect all controls.
- Can show only missing shiny base forms and optionally exclude Legendary Pokémon.
- Marks Legendary Pokémon and already-owned shinies in the list.
- Adds compact hunt controls to the bottom-right in every game mode.
- Keeps target selection available on the start page while disabling the hunt button until a run is active.
- Stores settings and the reset counter locally in Chrome.

## Install manually

1. Download this repository as a ZIP and extract it, or clone it:

   ```bash
   git clone https://github.com/ImDuude/PokeLikeShinyHuntExtension.git
   ```

2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Open or refresh [pokelike.xyz](https://pokelike.xyz/).

## Usage

1. Start any run mode and select a starter.
2. Use the bottom-right **Settings** button to choose Pokémon from the list.
3. Optionally enable **Missing shinies only** or **Ignore legendaries**.
4. Save the selection and switch **Shiny Hunt** on.
5. Leave the run open. The extension resets automatically until it finds a selected shiny, then stops and highlights the result.

The compact target summary shows the number of selected Pokémon. Hover over it to see the full list. The hunt status and reset count appear only while hunting. Use **Reset counter** to clear the local reset count.

## Updating

Pull or download the newest files, click the reload button for the extension on `chrome://extensions/`, and refresh Pokelike.

## Troubleshooting

- On the start page, settings remain available but hunting cannot start until a run is active.
- The Pokéball map node must be available for the hunt to continue.
- Reload both the extension and the Pokelike tab after updating files.
- Pokelike updates may change internal game data and temporarily break the extension.

## Privacy

The extension does not collect, sell, or transmit personal data. It runs only on `https://pokelike.xyz/*` and uses Chrome's local extension storage for settings and the reset counter.

## Credits

Created and maintained by [ImDuude](https://github.com/ImDuude).

Repository: [ImDuude/PokeLikeShinyHuntExtension](https://github.com/ImDuude/PokeLikeShinyHuntExtension)

## Disclaimer

This is an unofficial fan-made tool and is not affiliated with Pokelike, Pokémon, Nintendo, Game Freak, or The Pokémon Company. Use it at your own discretion.
