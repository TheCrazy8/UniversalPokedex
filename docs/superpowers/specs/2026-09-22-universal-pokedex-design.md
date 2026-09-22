# Universal Pokédex Site Design

Date: 2026-09-22
Status: Approved design, pending implementation-plan review

## Goal

Turn the existing `docs/` VitePress site into a Pokémon-themed Universal Pokédex that can list the complete National Pokédex, search and filter species, show artwork and structured species information, and display Pokédex entries sourced from Bulbapedia.

The site remains a VitePress/Vue application. Pokémon data is generated ahead of time and committed as local JSON so the deployed site is fast, works with the existing PWA setup, and does not depend on live Bulbapedia requests from every visitor.

## Scope

### Included in the first implementation

- Make `docs/` the canonical Universal Pokédex site.
- Replace inherited SplatoonDimensions branding/configuration with Universal Pokédex branding.
- Add a Pokémon-themed landing page.
- Add a complete National Pokédex browser scaffold.
- Represent one primary record per National Pokédex species.
- Keep alternate forms nested under their base species rather than assigning synthetic National Pokédex numbers.
- Support search by name and National Pokédex number.
- Support generation and type filters.
- Support sorting by National Pokédex number and name.
- Show responsive Pokémon cards with artwork, number, name, types, and generation.
- Show a species detail view with core facts, abilities, forms, source links, and game-specific Pokédex entries.
- Add previous/next species navigation.
- Provide a build-time data-generation scaffold for Bulbapedia-derived content.
- Preserve source attribution on imported data and image metadata.
- Preserve useful existing VitePress functionality where it does not conflict with the Pokédex experience.

### Not required for the first implementation

- User accounts or cloud synchronization.
- Editing Pokémon data in the browser.
- Competitive moveset generation.
- Team building.
- Live runtime scraping of Bulbapedia.
- Creating a separate numbered National Dex record for every form.
- Replacing the project with a different frontend framework.

These can be added later without changing the core data contract.

## Existing Project Constraints

The repository already uses VitePress, Vue 3, Sass, PWA support, and a custom VitePress theme. The site content lives under `docs/`, and the existing home page is essentially empty.

`docs/.vitepress/config.mjs` still contains inherited SplatoonDimensions values for the site title, base path, GitHub links, PWA metadata, and shortcuts. Those values must be corrected as part of the Pokédex work.

`docs/.vitepress/theme/index.js` already supports global Vue components and a custom layout. The Pokédex will integrate through this theme instead of creating a second application root.

## Architecture

### Pages

#### `docs/index.md`

Pokémon-themed home/landing page containing:

- Universal Pokédex title and introductory copy.
- Primary call to action into the Pokédex browser.
- Small feature summary.
- Data/source attribution summary.

#### `docs/pokedex/index.md`

Hosts the interactive Pokédex browser component.

The page itself remains lightweight. Filtering, selection, and detail presentation live in Vue components so VitePress can keep handling routing, metadata, and deployment.

### Vue components

Initial component boundaries:

- `Pokedex.vue`: loads local generated data, owns search/filter/sort state, and coordinates list/detail views.
- `PokedexToolbar.vue`: search, type filter, generation filter, sort, reset.
- `PokemonGrid.vue`: responsive species grid and empty states.
- `PokemonCard.vue`: artwork, number, name, types, generation.
- `PokemonDetails.vue`: selected Pokémon record, forms, evolution scaffold, dex entries, sources, navigation.
- `TypeBadge.vue`: consistent type presentation.
- `DexEntry.vue`: game/version label and entry text.

Components should remain small and focused so the data source can evolve independently of the UI.

## Data Model

Generated data lives at `docs/.vitepress/data/pokemon.json`.

Each primary National Dex species record follows this shape:

```json
{
  "nationalDex": 1,
  "name": "Bulbasaur",
  "slug": "bulbasaur",
  "generation": 1,
  "types": ["Grass", "Poison"],
  "category": "Seed Pokémon",
  "height": "0.7 m",
  "weight": "6.9 kg",
  "abilities": [{ "name": "Overgrow", "hidden": false }],
  "image": {
    "url": "https://archives.bulbagarden.net/...",
    "alt": "Bulbasaur",
    "source": "Bulbapedia",
    "sourceUrl": "https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)"
  },
  "forms": [],
  "evolution": { "stage": 1, "next": [] },
  "dexEntries": [
    {
      "game": "Red",
      "generation": 1,
      "text": "Pokédex entry text from the cited game/source",
      "sourceUrl": "https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)"
    }
  ],
  "bulbapediaUrl": "https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)"
}
```

### Forms

Regional variants, Mega Evolutions, Gigantamax forms, alternate formes, and comparable variants are nested under `forms` on their owning species record.

A form may override display name, types, artwork, abilities, height/weight, category, notes, and source URL. The primary list still contains one item for each National Pokédex number.

## Bulbapedia Data Pipeline

Bulbapedia is a build-time source, not a runtime dependency. A Node script at `scripts/update-pokedex.mjs` generates normalized project data.

The updater should:

1. Obtain the National Pokédex species ordering from Bulbapedia.
2. Resolve each species' Bulbapedia page.
3. Extract or map supported schema fields.
4. Preserve the source page URL for every species.
5. Preserve source metadata for images.
6. Normalize game-specific Pokédex entries.
7. Normalize nested forms when available.
8. Write deterministic JSON sorted by National Pokédex number.
9. Report incomplete records rather than inventing values.
10. Support cached/intermediate data where practical to avoid unnecessary requests.

Prefer stable Bulbapedia/MediaWiki interfaces where possible instead of fragile presentation markup. HTML parsing may be used where structured source does not expose the needed data cleanly. The updater should avoid aggressive parallel request rates and fail with a useful message when Bulbapedia cannot be reached.

The UI must tolerate incomplete optional records. Missing fields render as unavailable rather than breaking the grid or detail view.

## Attribution and Content Handling

Bulbapedia-derived article text and metadata must keep clear source attribution. The interface should include:

- A direct Bulbapedia link on each Pokémon detail view.
- Source URLs attached to individual Pokédex entries in generated data.
- Image source metadata.
- A site-level attribution notice explaining that Pokémon and related imagery belong to their respective rights holders and that Bulbapedia is the source for imported encyclopedia information.

The project must not imply ownership of Pokémon artwork sourced through Bulbapedia.

## UI Design

The Pokédex should look like a modern digital Pokédex rather than a generic documentation site.

Core visual language:

- Pokédex red as the main accent.
- White/light information surfaces.
- Near-black structural accents and text.
- Pokémon type colors for badges and contextual accents.
- Full support for VitePress light and dark modes.

### List view

Desktop uses a search/filter toolbar and multi-column responsive grid. Mobile stacks controls, reduces columns, avoids horizontal scrolling, and keeps touch targets comfortable.

Each card shows a `#0001` style number, artwork, species name, type badge(s), and optional generation marker. Cards are interactive and keyboard accessible.

### Detail view

Opening a record shows:

1. Identity/header.
2. Artwork and types.
3. Category, height, weight, and abilities.
4. Alternate forms.
5. Evolution area.
6. Pokédex entries grouped by generation/game.
7. Source links and attribution.
8. Previous/next species navigation.

Narrow screens collapse to one column.

## Search, Filtering, and Sorting

All filtering is client-side over committed JSON.

Search matches full or partial Pokémon names and National Dex numbers with or without leading zeroes.

Filters:

- Type.
- Generation.

Sort modes:

- National Dex ascending.
- National Dex descending.
- Name A-Z.
- Name Z-A.

Filtering and sorting are deterministic and composable.

## Site Configuration Cleanup

Update `docs/.vitepress/config.mjs` to:

- use `Universal Pokédex` as the title;
- use a Pokémon encyclopedia description;
- set the GitHub Pages base to `/UniversalPokedex/`;
- point edit links and social links at `TheCrazy8/UniversalPokedex`;
- rename PWA metadata to Universal Pokédex;
- set PWA scope/start URL to `/UniversalPokedex/`;
- use a Pokédex-red theme color;
- remove SplatoonDimensions-specific PWA shortcuts;
- add a Pokédex shortcut if shortcuts remain;
- correct footer/attribution wording;
- correct Open Graph asset paths and metadata;
- correct the Git changelog repository URL.

Existing generic VitePress functionality can remain unless it visibly conflicts with the Pokédex.

## Theme Integration

Pokédex-specific CSS should live in `docs/.vitepress/theme/styles/pokedex.css` instead of placing all new styles into the existing large `main.css`.

The current custom theme contains inherited effects/components. Preserve generic useful features, while preventing unrelated Splatoon-specific presentation from defining Pokédex pages.

## Accessibility

- Artwork has useful alt text.
- Interactive cards are keyboard navigable.
- Search/filter inputs have accessible names.
- Type colors are accompanied by text labels.
- Focus states remain visible.
- Text/background combinations maintain reasonable contrast.
- Reduced-motion preferences are respected.

## Error and Empty States

Handle:

- no search results;
- missing optional metadata;
- missing artwork;
- missing dex entries;
- malformed generated records during development.

The data-generation script should fail clearly on structural errors and summarize incomplete optional data.

## Testing and Validation

### Data validation

Add `scripts/validate-pokedex.mjs` to check at minimum:

- National Dex numbers are unique.
- Primary records are sorted.
- Required fields exist.
- Slugs are unique.
- Types use recognized labels.
- Source URLs are present for Bulbapedia-backed records.

### UI validation

Test name search, number search, combined filters, every sort mode, empty results, detail opening, previous/next navigation, mobile layout, dark mode, and keyboard navigation.

### Build verification

`npm run build` must complete successfully after implementation.

## Expected File Additions/Changes

Likely additions:

- `docs/pokedex/index.md`
- `docs/.vitepress/data/pokemon.json`
- `docs/.vitepress/theme/components/Pokedex.vue`
- `docs/.vitepress/theme/components/PokedexToolbar.vue`
- `docs/.vitepress/theme/components/PokemonGrid.vue`
- `docs/.vitepress/theme/components/PokemonCard.vue`
- `docs/.vitepress/theme/components/PokemonDetails.vue`
- `docs/.vitepress/theme/components/TypeBadge.vue`
- `docs/.vitepress/theme/components/DexEntry.vue`
- `docs/.vitepress/theme/styles/pokedex.css`
- `scripts/update-pokedex.mjs`
- `scripts/validate-pokedex.mjs`

Likely modifications:

- `docs/index.md`
- `docs/.vitepress/config.mjs`
- `docs/.vitepress/theme/index.js`
- `package.json`
- PWA/public metadata assets where existing SplatoonDimensions assets are referenced.

Exact component splitting may change slightly during the implementation plan if a simpler boundary produces cleaner code, but the behavior and data contract remain the target.

## Success Criteria

The first implementation is complete when:

1. The deployed VitePress site is branded Universal Pokédex rather than SplatoonDimensions.
2. A visitor can open a complete National Dex list scaffold and browse it responsively.
3. Search by name or number works.
4. Type/generation filtering and sorting work.
5. A visitor can open a Pokémon detail record and view available Bulbapedia-sourced information and dex entries.
6. Alternate forms are associated with the correct National Dex species.
7. Source attribution remains visible and traceable.
8. The data updater/validator provides a repeatable path for filling and refreshing the complete Pokédex dataset.
9. The production VitePress build passes.
