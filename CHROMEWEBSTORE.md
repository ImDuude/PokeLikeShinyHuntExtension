# Chrome Web Store listing draft

## Extension name

Pokelike Shiny Hunt

## Version

2.1.1

## Short description

Automatic shiny hunting for every run mode on pokelike.xyz.

## Detailed description

Pokelike Shiny Hunt adds compact controls directly to Pokelike in every run mode.

The extension reads offered Pokémon names and shiny status directly from the game's current state. It selects the Pokéball node, checks the available starters, and resets the run until one of your selected Pokémon appears as a shiny. When a match is found, the hunt stops and highlights it.

The built-in Pokémon selector includes:

- Searchable and scrollable Pokémon list
- Multiple target selection
- Select all and Deselect all actions
- Missing shinies only filter
- Optional Legendary Pokémon exclusion
- Legendary and owned-shiny indicators
- Local reset counter

The controls appear in the bottom-right of the game. Target settings are also available on the start page, while hunting can only be enabled during an active run. No popup configuration is required.

Created and maintained by ImDuude:
https://github.com/ImDuude

Source code and support:
https://github.com/ImDuude/PokeLikeShinyHuntExtension

This is an unofficial fan-made helper and is not affiliated with Pokelike, Pokémon, Nintendo, Game Freak, or The Pokémon Company.

## Privacy disclosure

This extension does not collect, sell, or transmit personal data and does not use external analytics. It runs only on `https://pokelike.xyz/*`. Hunt settings and the reset counter are stored locally using Chrome extension storage.

## Permissions explanation

- `storage`: Saves hunt settings, selected Pokémon, and the reset counter locally.
- `scripting`: Injects the shiny-hunt logic into pokelike.xyz.
- Host access to `https://pokelike.xyz/*`: Restricts game integration to Pokelike.

## Suggested category

Fun

## Support URL

https://github.com/ImDuude/PokeLikeShinyHuntExtension/issues

## Homepage URL

https://github.com/ImDuude/PokeLikeShinyHuntExtension

## Suggested first-release visibility

Unlisted for initial testing, then Public after validation.
