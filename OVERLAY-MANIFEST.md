# Universal Pokédex overlay

This archive contains the new and modified files for the Pokémon-themed Universal Pokédex scaffold.

Local implementation commit: `878d9db3dec13f9188b9c26ee509d6e11e4ddca9`

## Apply

Extract this archive into the root of `TheCrazy8/UniversalPokedex`, allowing it to replace matching files.

Then run:

```bash
npm install
npm test
npm run pokedex:update
npm run pokedex:validate
npm run build
```

`docs/.vitepress/data/pokemon.json` is deliberately a small offline scaffold in this archive. `npm run pokedex:update` fills it from Bulbapedia. The strict validator will reject the scaffold until that update succeeds.

## Files

- `README.md`
- `docs/.vitepress/config.mjs`
- `docs/.vitepress/data/pokemon.json`
- `docs/.vitepress/theme/components/DexEntry.vue`
- `docs/.vitepress/theme/components/Pokedex.vue`
- `docs/.vitepress/theme/components/PokedexToolbar.vue`
- `docs/.vitepress/theme/components/PokemonCard.vue`
- `docs/.vitepress/theme/components/PokemonDetails.vue`
- `docs/.vitepress/theme/components/PokemonGrid.vue`
- `docs/.vitepress/theme/components/TypeBadge.vue`
- `docs/.vitepress/theme/index.js`
- `docs/.vitepress/theme/pokedex-utils.js`
- `docs/.vitepress/theme/styles/main.css`
- `docs/.vitepress/theme/styles/pokedex.css`
- `docs/attribution.md`
- `docs/index.md`
- `docs/pokedex/index.md`
- `package.json`
- `scripts/.gitignore`
- `scripts/lib/bulbapedia.mjs`
- `scripts/lib/pokedex-schema.mjs`
- `scripts/update-pokedex.mjs`
- `scripts/validate-pokedex.mjs`
- `tests/bulbapedia-parser.test.mjs`
- `tests/fixtures/national-dex.html`
- `tests/fixtures/species.html`
- `tests/pokedex-components.test.mjs`
- `tests/pokedex-schema.test.mjs`
- `tests/pokedex-style.test.mjs`
- `tests/pokedex-update.test.mjs`
- `tests/pokedex-utils.test.mjs`
- `tests/readme.test.mjs`
- `tests/site-identity.test.mjs`
- `docs/superpowers/specs/2026-09-22-universal-pokedex-design.md`
- `docs/superpowers/plans/2026-09-22-universal-pokedex.md`
