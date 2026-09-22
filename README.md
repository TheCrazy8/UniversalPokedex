# Universal Pokédex

Universal Pokédex is a Pokémon-themed VitePress/Vue site for browsing the National Pokédex, alternate forms, species facts, artwork, and game-specific Pokédex entries.

The site reads a committed generated JSON dataset, so normal visitors do **not** scrape Bulbapedia at runtime. The updater fetches Bulbapedia when a maintainer explicitly refreshes the data and preserves source URLs in the generated records.

## Development

```bash
npm install
npm run dev
```

Open the local VitePress URL and browse `/pokedex/`.

## Refresh Pokémon data from Bulbapedia

```bash
npm run pokedex:update
npm run pokedex:validate
```

The updater:

- reads Bulbapedia's National Pokédex list;
- keeps one primary record per National Dex number;
- nests regional/alternate form rows under their species;
- fetches each species page for facts, artwork provenance, abilities, and Pokédex entries;
- caches fetched HTML under `scripts/.cache/bulbapedia/`;
- uses a small request concurrency/rate limit;
- writes deterministic data to `docs/.vitepress/data/pokemon.json`.

Useful development flags:

```bash
node scripts/update-pokedex.mjs --limit=20
node scripts/update-pokedex.mjs --refresh --concurrency=2
```

`--limit` is for parser/UI development. A release dataset should always be generated without `--limit` and pass the normal validator.

## Verify

```bash
npm test
npm run pokedex:validate
npm run build
```

The production validator currently requires at least 1025 contiguous numbered National Dex species and at least 1028 total species. It also accepts explicitly unassigned `#????` species, matching Bulbapedia’s current Generation X list, and it accepts future additions rather than treating 1028 as a maximum.

If you are applying the scaffold overlay before running the updater, the included generated JSON may contain only a small seed record. You can structurally check that seed with:

```bash
node scripts/validate-pokedex.mjs --allow-scaffold
```

Do not use scaffold-mode validation as a release check.

## Data and attribution

Pokémon names, artwork, and related trademarks belong to their respective rights holders. Encyclopedia information and image source references are gathered from [Bulbapedia](https://bulbapedia.bulbagarden.net/) by the explicit update command. Individual generated records retain Bulbapedia source URLs.

See [`docs/attribution.md`](docs/attribution.md) for the site-facing attribution notice.
