# Universal Pokédex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing `docs/` VitePress site into a Pokémon-themed Universal Pokédex with a complete National Pokédex data pipeline, Bulbapedia-sourced images/information/dex entries, search/filter/sort, and species detail views.

**Architecture:** Keep VitePress/Vue as the application shell. Generate a normalized static `pokemon.json` at build/update time from Bulbapedia, validate it before use, and keep all client-side browsing logic over that committed JSON so the deployed site does not scrape Bulbapedia at runtime. Separate data parsing, validation, filter/sort logic, and presentational Vue components so each can be tested independently.

**Tech Stack:** Node.js ESM, VitePress 1.6.x, Vue 3.5.x, native `fetch`, Cheerio for HTML parsing, Node's built-in `node:test`, existing Vite/PWA stack.

**Spec:** `docs/superpowers/specs/2026-09-22-universal-pokedex-design.md`

## Global Constraints

- The existing `docs/` directory remains the site root.
- National Pokédex species are primary records; alternate/regional/Mega/Gigantamax forms are nested under the owning species.
- Bulbapedia is a build-time/update-time source, not a runtime dependency for normal browsing.
- Every Bulbapedia-derived species record keeps a source URL; images keep image/source provenance.
- Missing optional fields render as unavailable instead of breaking the site.
- Site base path is `/UniversalPokedex/`.
- Existing useful VitePress functionality may remain, but inherited SplatoonDimensions/space branding must not define the Pokédex experience.
- The final production check is `npm run test && npm run pokedex:validate && npm run build`.
- Do not silently invent Pokémon facts when parsing fails; record `null`/empty optional fields and surface parser warnings.
- Do not hard-code the current species count as an equality check; enforce contiguous National Dex numbers and a minimum known baseline of 1028 so future additions are accepted.

## Review Focus

1. **Names with punctuation/Unicode** — `Farfetch'd`, `Mr. Mime`, `Nidoran♀`, `Nidoran♂`, `Flabébé`, etc. must search, slug, and render correctly.
2. **Form rows without their own National Dex number** — they must nest under the immediately preceding numbered species and never create duplicate primary records.
3. **Grouped/reused Pokédex-entry rows** — multiple game labels sharing one text cell must expand predictably without losing the source URL.
4. **Missing image/metadata on a species page** — the updater must still emit a valid species record and the UI must show a fallback, not crash.
5. **Empty/combined client filters** — search + type + generation + sort must compose deterministically and show a clear zero-results state.

---

## File Structure

### New data/update files

- `scripts/lib/pokedex-schema.mjs` — shared type constants and `validatePokemonData(records)`.
- `scripts/lib/bulbapedia.mjs` — URL normalization, list/species HTML parsing, fetch/cache helpers.
- `scripts/update-pokedex.mjs` — orchestration: fetch list, fetch species pages, merge forms, write deterministic JSON.
- `scripts/validate-pokedex.mjs` — CLI wrapper around schema validation.
- `scripts/.gitignore` — ignore local Bulbapedia response cache.
- `tests/fixtures/national-dex.html` — synthetic Bulbapedia-shaped National Dex fixture.
- `tests/fixtures/species.html` — synthetic species-page fixture.
- `tests/pokedex-schema.test.mjs` — data contract tests.
- `tests/bulbapedia-parser.test.mjs` — parser tests.
- `tests/pokedex-update.test.mjs` — mocked update orchestration test.
- `docs/.vitepress/data/pokemon.json` — generated normalized dataset.

### New UI files

- `docs/.vitepress/theme/pokedex-utils.js` — pure search/filter/sort/format helpers.
- `tests/pokedex-utils.test.mjs` — pure client logic tests.
- `docs/.vitepress/theme/components/Pokedex.vue` — owns browser state and selection.
- `docs/.vitepress/theme/components/PokedexToolbar.vue` — search/filter/sort controls.
- `docs/.vitepress/theme/components/PokemonGrid.vue` — list/empty state.
- `docs/.vitepress/theme/components/PokemonCard.vue` — one species summary card.
- `docs/.vitepress/theme/components/PokemonDetails.vue` — selected-species detail panel.
- `docs/.vitepress/theme/components/TypeBadge.vue` — accessible type badge.
- `docs/.vitepress/theme/components/DexEntry.vue` — one game/dex-entry row.
- `docs/.vitepress/theme/styles/pokedex.css` — Pokédex-specific theme and responsive styles.
- `docs/pokedex/index.md` — Pokédex browser route.
- `docs/attribution.md` — source/rights/attribution information.

### Existing files to modify

- `package.json` — add parser dependency and test/update/validate scripts.
- `docs/index.md` — Pokémon landing page.
- `docs/.vitepress/config.mjs` — replace inherited SplatoonDimensions metadata/base/PWA/repo links.
- `docs/.vitepress/theme/index.js` — register Pokédex and remove inherited wrong-repo/visual behavior.
- `docs/.vitepress/theme/styles/main.css` — remove space-theme brand tokens/animations and keep only generic site styling plus Pokémon brand tokens.

---

### Task 1: Correct Site Identity and Establish the Pokémon Theme

**Files:**
- Modify: `package.json`
- Modify: `docs/.vitepress/config.mjs`
- Modify: `docs/.vitepress/theme/index.js`
- Modify: `docs/.vitepress/theme/styles/main.css`
- Create: `docs/.vitepress/theme/styles/pokedex.css`
- Modify: `docs/index.md`
- Create: `docs/attribution.md`
- Create: `tests/site-identity.test.mjs`

**Interfaces:**
- Consumes: existing VitePress theme/config.
- Produces: correct `/UniversalPokedex/` site identity and stable global CSS tokens used by all later Pokédex components.

- [ ] **Step 1: Write the failing site-identity test**

Create `tests/site-identity.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('site metadata is Universal Pokédex and contains no inherited project identity', async () => {
  const [config, theme, css] = await Promise.all([
    read('docs/.vitepress/config.mjs'),
    read('docs/.vitepress/theme/index.js'),
    read('docs/.vitepress/theme/styles/main.css'),
  ])

  assert.match(config, /title:\s*["']Universal Pokédex["']/)
  assert.match(config, /base:\s*["']\/UniversalPokedex\/["']/)
  assert.match(config, /TheCrazy8\/UniversalPokedex/)
  assert.doesNotMatch(config, /SplatoonDimensions/)
  assert.doesNotMatch(theme, /repo:\s*['"]TheCrazy8\/SplatoonDimensions/)
  assert.doesNotMatch(css, /BLAZE & COMPANY SPACE THEME|nebulaGlow|auroraShimmer/)
})
```

- [ ] **Step 2: Add test/update commands and Cheerio dependency**

Update `package.json` scripts to include:

```json
{
  "test": "node --test tests/*.test.mjs",
  "pokedex:update": "node scripts/update-pokedex.mjs",
  "pokedex:validate": "node scripts/validate-pokedex.mjs"
}
```

Add dependency:

```json
"cheerio": "^1.1.2"
```

Then run:

```bash
npm install
npm test
```

Expected: the identity test fails because the current config/CSS still references SplatoonDimensions and the space theme.

- [ ] **Step 3: Replace inherited VitePress identity**

In `docs/.vitepress/config.mjs`, set these exact values:

```js
title: 'Universal Pokédex',
description: 'A searchable universal Pokémon encyclopedia and Pokédex.',
base: '/UniversalPokedex/',
```

Set the edit link and social link to:

```js
editLink: {
  pattern: 'https://github.com/TheCrazy8/UniversalPokedex/edit/main/docs/:path',
  text: '✏️ Edit this page',
},

socialLinks: [
  { icon: 'github', link: 'https://github.com/TheCrazy8/UniversalPokedex' },
],
```

Set the footer to:

```js
footer: {
  message: 'Pokémon and related imagery belong to their respective rights holders. Encyclopedia data is attributed to Bulbapedia.',
  copyright: 'Universal Pokédex is an unofficial fan project.',
},
```

Set PWA identity:

```js
manifest: {
  name: 'Universal Pokédex',
  short_name: 'Pokédex',
  description: 'A searchable universal Pokémon encyclopedia and Pokédex.',
  theme_color: '#d62828',
  background_color: '#f7f7f7',
  display: 'standalone',
  scope: '/UniversalPokedex/',
  start_url: '/UniversalPokedex/',
  shortcuts: [
    {
      name: 'Open Pokédex',
      short_name: 'Pokédex',
      url: '/UniversalPokedex/pokedex/',
      description: 'Browse the National Pokédex',
    },
  ],
}
```

Change the Git changelog URL to `https://github.com/TheCrazy8/UniversalPokedex`.

Add a Workbox cache rule for Bulbagarden Archives artwork:

```js
{
  urlPattern: /^https:\/\/archives\.bulbagarden\.net\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'bulbapedia-artwork',
    expiration: {
      maxEntries: 300,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
    cacheableResponse: { statuses: [0, 200] },
  },
},
```

- [ ] **Step 4: Remove inherited wrong-repo and ambient-effect behavior**

In `docs/.vitepress/theme/index.js`:

- remove the `giscusTalk` import and the hard-coded `TheCrazy8/SplatoonDimensions` `giscusTalk(...)` call;
- remove `FireParticles` and `CursorTrail` from `layout-bottom`;
- import `./styles/pokedex.css`.

Do not remove generic accessibility/readability plugins.

- [ ] **Step 5: Replace the space-theme tokens/animations**

In `main.css`, preserve generic VitePress fixes such as social-link spacing/back-to-top behavior, but replace the inherited violet/cyan/nebula brand section with:

```css
:root {
  --vp-c-brand-1: #d62828;
  --vp-c-brand-2: #b91c1c;
  --vp-c-brand-3: #991b1b;
  --vp-c-brand-soft: rgba(214, 40, 40, 0.14);
  --pokedex-red: #d62828;
  --pokedex-red-dark: #991b1b;
  --pokedex-ink: #171717;
  --pokedex-panel: #ffffff;
  --pokedex-screen: #dff4ff;
}

.dark {
  --vp-c-brand-1: #ff5a5f;
  --vp-c-brand-2: #ef4444;
  --vp-c-brand-3: #dc2626;
  --vp-c-brand-soft: rgba(239, 68, 68, 0.18);
  --pokedex-panel: #18181b;
  --pokedex-screen: #102633;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Remove the ambient star/nebula pseudo-background and hero shimmer animations.

- [ ] **Step 6: Build the landing and attribution pages**

Replace `docs/index.md` with VitePress home frontmatter:

```md
---
layout: home

hero:
  name: Universal Pokédex
  text: Every Pokémon. One Pokédex.
  tagline: Browse the National Pokédex, forms, species information, and game Pokédex entries.
  actions:
    - theme: brand
      text: Browse the Pokédex
      link: /pokedex/
    - theme: alt
      text: Sources & Attribution
      link: /attribution
---
```

Create `docs/attribution.md` with concise project attribution, a Bulbapedia link, and a statement that Pokémon names/artwork are the property of their respective rights holders.

- [ ] **Step 7: Run the identity test and build**

```bash
npm test
npm run build
```

Expected: `tests/site-identity.test.mjs` passes and VitePress builds.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json docs tests/site-identity.test.mjs
git commit -m "feat: rebrand site as Universal Pokedex"
```

---

### Task 2: Define and Validate the Pokémon Data Contract

**Files:**
- Create: `scripts/lib/pokedex-schema.mjs`
- Create: `scripts/validate-pokedex.mjs`
- Create: `tests/pokedex-schema.test.mjs`
- Create: `docs/.vitepress/data/pokemon.json`

**Interfaces:**
- Produces: `validatePokemonData(records) -> { errors: string[], warnings: string[] }`.
- Produces: `POKEMON_TYPES`, `MIN_EXPECTED_SPECIES`.
- Later tasks must emit records accepted by this validator.

- [ ] **Step 1: Write failing validator tests**

Create `tests/pokedex-schema.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePokemonData } from '../scripts/lib/pokedex-schema.mjs'

const bulbasaur = {
  nationalDex: 1,
  name: 'Bulbasaur',
  slug: 'bulbasaur',
  generation: 1,
  types: ['Grass', 'Poison'],
  category: 'Seed Pokémon',
  height: '0.7 m',
  weight: '6.9 kg',
  abilities: [{ name: 'Overgrow', hidden: false }],
  image: {
    url: 'https://archives.bulbagarden.net/example.png',
    alt: 'Bulbasaur',
    source: 'Bulbapedia',
    sourceUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)',
  },
  forms: [],
  evolution: { stage: 1, next: [] },
  dexEntries: [{
    game: 'Red',
    generation: 1,
    text: 'Synthetic test entry.',
    sourceUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)',
  }],
  bulbapediaUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)',
}

test('accepts a structurally valid record', () => {
  const result = validatePokemonData([bulbasaur], { requireCompleteDex: false })
  assert.deepEqual(result.errors, [])
})

test('rejects duplicate National Dex numbers and slugs', () => {
  const result = validatePokemonData([bulbasaur, { ...bulbasaur }], { requireCompleteDex: false })
  assert.ok(result.errors.some((message) => message.includes('duplicate National Dex #1')))
  assert.ok(result.errors.some((message) => message.includes('duplicate slug "bulbasaur"')))
})

test('rejects unknown types', () => {
  const bad = { ...bulbasaur, types: ['Grass', 'Cosmic'] }
  const result = validatePokemonData([bad], { requireCompleteDex: false })
  assert.ok(result.errors.some((message) => message.includes('unknown type "Cosmic"')))
})

test('allows missing optional image metadata with a warning', () => {
  const record = { ...bulbasaur, image: null }
  const result = validatePokemonData([record], { requireCompleteDex: false })
  assert.deepEqual(result.errors, [])
  assert.ok(result.warnings.some((message) => message.includes('missing image')))
})
```

Run:

```bash
npm test
```

Expected: FAIL because the schema module does not exist.

- [ ] **Step 2: Implement schema constants and validation**

Create `scripts/lib/pokedex-schema.mjs` with:

```js
export const POKEMON_TYPES = Object.freeze([
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy',
])

export const MIN_EXPECTED_SPECIES = 1028

export function validatePokemonData(records, { requireCompleteDex = true } = {}) {
  const errors = []
  const warnings = []
  const numbers = new Set()
  const slugs = new Set()

  if (!Array.isArray(records)) {
    return { errors: ['root value must be an array'], warnings }
  }

  for (const [index, record] of records.entries()) {
    const label = record?.name || `record ${index + 1}`

    if (!Number.isInteger(record?.nationalDex) || record.nationalDex < 1) {
      errors.push(`${label}: nationalDex must be a positive integer`)
    } else if (numbers.has(record.nationalDex)) {
      errors.push(`${label}: duplicate National Dex #${record.nationalDex}`)
    } else {
      numbers.add(record.nationalDex)
    }

    if (!record?.name || typeof record.name !== 'string') {
      errors.push(`${label}: name is required`)
    }

    if (!record?.slug || typeof record.slug !== 'string') {
      errors.push(`${label}: slug is required`)
    } else if (slugs.has(record.slug)) {
      errors.push(`${label}: duplicate slug "${record.slug}"`)
    } else {
      slugs.add(record.slug)
    }

    if (!Array.isArray(record?.types) || record.types.length < 1) {
      errors.push(`${label}: at least one type is required`)
    } else {
      for (const type of record.types) {
        if (!POKEMON_TYPES.includes(type)) {
          errors.push(`${label}: unknown type "${type}"`)
        }
      }
    }

    if (!Number.isInteger(record?.generation) || record.generation < 1) {
      errors.push(`${label}: generation must be a positive integer`)
    }

    if (!record?.bulbapediaUrl?.startsWith('https://bulbapedia.bulbagarden.net/')) {
      errors.push(`${label}: bulbapediaUrl is required`)
    }

    if (!record?.image?.url) warnings.push(`${label}: missing image`)
    if (!record?.category) warnings.push(`${label}: missing category`)
    if (!record?.height) warnings.push(`${label}: missing height`)
    if (!record?.weight) warnings.push(`${label}: missing weight`)
    if (!Array.isArray(record?.dexEntries) || record.dexEntries.length === 0) {
      warnings.push(`${label}: missing Pokédex entries`)
    }
  }

  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  for (let expected = 1; expected <= sortedNumbers.length; expected += 1) {
    if (sortedNumbers[expected - 1] !== expected) {
      errors.push(`National Dex is not contiguous at #${expected}`)
      break
    }
  }

  if (requireCompleteDex && records.length < MIN_EXPECTED_SPECIES) {
    errors.push(`expected at least ${MIN_EXPECTED_SPECIES} National Dex species, received ${records.length}`)
  }

  return { errors, warnings }
}
```

- [ ] **Step 3: Implement the CLI validator**

Create `scripts/validate-pokedex.mjs`:

```js
import { readFile } from 'node:fs/promises'
import { validatePokemonData } from './lib/pokedex-schema.mjs'

const path = new URL('../docs/.vitepress/data/pokemon.json', import.meta.url)
const records = JSON.parse(await readFile(path, 'utf8'))
const { errors, warnings } = validatePokemonData(records)

for (const warning of warnings) console.warn(`warning: ${warning}`)
for (const error of errors) console.error(`error: ${error}`)

if (errors.length) process.exitCode = 1
else console.log(`Validated ${records.length} Pokémon records.`)
```

Seed `pokemon.json` temporarily with the Bulbasaur-shaped test record, knowing `pokedex:validate` must fail completeness until Task 4 generates the full dataset.

- [ ] **Step 4: Run unit tests**

```bash
npm test
```

Expected: all schema tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts tests docs/.vitepress/data/pokemon.json
git commit -m "test: define Pokedex data contract"
```

---

### Task 3: Parse Bulbapedia National-Dex and Species HTML

**Files:**
- Create: `scripts/lib/bulbapedia.mjs`
- Create: `tests/fixtures/national-dex.html`
- Create: `tests/fixtures/species.html`
- Create: `tests/bulbapedia-parser.test.mjs`

**Interfaces:**
- Produces: `parseNationalDexPage(html) -> Array<{ nationalDex, name, slug, generation, types, forms, bulbapediaUrl }>`
- Produces: `parseSpeciesPage(html, baseRecord) -> normalized species record`
- Produces: `slugifyPokemonName(name) -> string`
- Produces: `absoluteBulbapediaUrl(href) -> string`

- [ ] **Step 1: Create synthetic Bulbapedia-shaped fixtures**

`tests/fixtures/national-dex.html` must include:
- a Generation I heading;
- numbered Bulbasaur and Rattata rows;
- an unnumbered Alolan Rattata form row;
- a Unicode/punctuation species such as Nidoran♀.

Use invented HTML text, not copied Pokédex prose.

`tests/fixtures/species.html` must include:
- an infobox with category, abilities, height, weight, and image;
- a `Pokédex entries` heading;
- generation-marker rows;
- a row with multiple game links sharing one synthetic entry.

- [ ] **Step 2: Write failing parser tests**

Create `tests/bulbapedia-parser.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  parseNationalDexPage,
  parseSpeciesPage,
  slugifyPokemonName,
} from '../scripts/lib/bulbapedia.mjs'

const fixture = async (name) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

test('slugifies punctuation and Unicode names predictably', () => {
  assert.equal(slugifyPokemonName("Farfetch'd"), 'farfetchd')
  assert.equal(slugifyPokemonName('Nidoran♀'), 'nidoran-f')
  assert.equal(slugifyPokemonName('Nidoran♂'), 'nidoran-m')
  assert.equal(slugifyPokemonName('Flabébé'), 'flabebe')
})

test('parses numbered species and nests unnumbered form rows', async () => {
  const records = parseNationalDexPage(await fixture('national-dex.html'))
  assert.equal(records[0].nationalDex, 1)
  assert.equal(records[0].name, 'Bulbasaur')

  const rattata = records.find((record) => record.name === 'Rattata')
  assert.deepEqual(rattata.forms[0].name, 'Alolan Form')
  assert.deepEqual(rattata.forms[0].types, ['Dark', 'Normal'])
})

test('parses species facts, image provenance, and grouped dex entries', async () => {
  const base = {
    nationalDex: 1,
    name: 'Bulbasaur',
    slug: 'bulbasaur',
    generation: 1,
    types: ['Grass', 'Poison'],
    forms: [],
    bulbapediaUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pokémon)',
  }

  const record = parseSpeciesPage(await fixture('species.html'), base)
  assert.equal(record.category, 'Seed Pokémon')
  assert.equal(record.height, '0.7 m')
  assert.equal(record.weight, '6.9 kg')
  assert.equal(record.image.source, 'Bulbapedia')
  assert.ok(record.dexEntries.some((entry) => entry.game === 'Red'))
  assert.ok(record.dexEntries.some((entry) => entry.game === 'Blue'))
})
```

Run:

```bash
npm test
```

Expected: FAIL because parser functions do not exist.

- [ ] **Step 3: Implement URL and slug helpers**

In `scripts/lib/bulbapedia.mjs`:

```js
import * as cheerio from 'cheerio'

const BULBAPEDIA = 'https://bulbapedia.bulbagarden.net'
const ARCHIVES = 'https://archives.bulbagarden.net'

export function absoluteBulbapediaUrl(href = '') {
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  return new URL(href, BULBAPEDIA).href
}

export function slugifyPokemonName(name) {
  return name
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['’.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
```

- [ ] **Step 4: Implement National Dex parsing by labeled row content**

Use Cheerio to walk `h3` and table rows in document order. Update `currentGeneration` whenever a heading text matches `Generation <Roman numeral>`. For each row:
- first cell matching `#\d{4}` starts a primary species;
- species link text comes from the first `/wiki/..._(Pokémon)` link;
- type names are filtered through `POKEMON_TYPES`;
- rows without a number but with a species/form name attach to the most recent primary record;
- form rows never add to the returned primary array.

Use a local Roman-numeral map:

```js
const GENERATIONS = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
}
```

- [ ] **Step 5: Implement species-page fact parsing using labels, not cell positions**

Add a helper:

```js
function labeledRow($, label) {
  return $('tr').filter((_, row) => {
    const heading = $(row).find('th, td').first().text().replace(/\s+/g, ' ').trim()
    return heading === label
  }).first()
}
```

Use it to parse `Abilities`, `Height`, and `Weight`; find category from the species infobox header/summary; select artwork from the first infobox image whose URL resolves to `archives.bulbagarden.net`.

The returned `image` object must be:

```js
{
  url: absoluteBulbapediaUrl(src),
  alt: baseRecord.name,
  source: 'Bulbapedia',
  sourceUrl: baseRecord.bulbapediaUrl,
}
```

If no image exists, return `image: null`.

- [ ] **Step 6: Implement Pokédex-entry parsing**

Find the main game-data heading with an id/text equivalent to `Pokédex entries`, then walk sibling nodes until the next same-or-higher-level heading.

Maintain `currentGeneration` when a row/header includes `Generation I` through `Generation X`.

For data rows:
- collect game labels from links in the first meaningful cell;
- normalize the final text cell with whitespace collapsed;
- ignore rows whose text says the species has no Pokédex entries;
- emit one entry per game label sharing the same entry text;
- set each entry's `sourceUrl` to the species page.

This produces:

```js
{
  game: 'Red',
  generation: 1,
  text: 'Synthetic test entry.',
  sourceUrl: baseRecord.bulbapediaUrl,
}
```

- [ ] **Step 7: Run parser tests**

```bash
npm test
```

Expected: all parser tests pass, including punctuation/Unicode, nested form rows, and grouped entries.

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/bulbapedia.mjs tests/fixtures tests/bulbapedia-parser.test.mjs
git commit -m "feat: parse Bulbapedia Pokedex data"
```

---

### Task 4: Build the Repeatable Full-Dex Updater

**Files:**
- Create: `scripts/update-pokedex.mjs`
- Create: `tests/pokedex-update.test.mjs`
- Create: `scripts/.gitignore`
- Replace generated: `docs/.vitepress/data/pokemon.json`

**Interfaces:**
- Consumes: `parseNationalDexPage`, `parseSpeciesPage`, `validatePokemonData`.
- Produces: deterministic full National Dex JSON.
- CLI accepts optional `--limit=N`, `--refresh`, and `--concurrency=N` for safe development/testing.

- [ ] **Step 1: Write a mocked orchestration test**

Factor the updater to export the exact signature
`buildPokedex({ fetchHtml, listUrl, limit, concurrency = 3 })`, returning
`Promise<{ records: object[], warnings: string[] }>`. Create the test with a
fake `fetchHtml(url)` returning the synthetic list/species fixtures. Assert:
- records remain National-Dex sorted;
- form rows remain nested;
- missing optional fields do not abort generation;
- a failed species fetch produces a warning and a base record instead of dropping the species.

- [ ] **Step 2: Run test and confirm failure**

```bash
npm test
```

Expected: FAIL because `buildPokedex` does not exist.

- [ ] **Step 3: Implement cached fetching**

Use a cache directory under `scripts/.cache/bulbapedia`.

Implementation requirements:
- cache key is a SHA-256 hash of URL;
- normal run reuses cached HTML;
- `--refresh` bypasses cached reads;
- request headers include a descriptive `User-Agent`;
- default concurrency is 3;
- each network request waits at least 250 ms after the prior request started in that worker;
- response non-2xx status throws a descriptive error.

Add `scripts/.gitignore`:

```gitignore
.cache/
```

- [ ] **Step 4: Implement build orchestration**

Use:

```js
const NATIONAL_DEX_URL =
  'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number'
```

Algorithm:
1. fetch/parse National Dex list;
2. optionally slice with `--limit`;
3. process species with a small worker pool;
4. merge species detail fields into the base record while preserving list-derived `nationalDex`, `name`, `slug`, `generation`, `types`, and `forms`;
5. sort ascending;
6. validate with `requireCompleteDex: !limit`;
7. write formatted JSON with a trailing newline.

Do not write the output when validation returns errors.

- [ ] **Step 5: Add safe CLI argument parsing**

Support:

```bash
npm run pokedex:update
node scripts/update-pokedex.mjs -- --limit=20
node scripts/update-pokedex.mjs -- --refresh --concurrency=2
```

Reject concurrency outside `1..6`.

- [ ] **Step 6: Run fixture-backed tests**

```bash
npm test
```

Expected: updater orchestration test passes without live network.

- [ ] **Step 7: Generate the full dataset from Bulbapedia**

Run:

```bash
npm run pokedex:update
npm run pokedex:validate
```

Expected:
- at least 1028 primary species records;
- National Dex numbers contiguous from 1 through the current maximum;
- no duplicate primary numbers/slugs;
- warnings are printed for incomplete optional fields but no structural errors.

Bulbapedia's current National Dex page states there are 1028 Pokémon as of Pokémon Day 2026; the validator uses this only as a minimum baseline, not a fixed maximum. The list page also includes unnumbered form rows, which is why forms are nested rather than counted separately.

- [ ] **Step 8: Commit generated data and updater**

```bash
git add scripts docs/.vitepress/data/pokemon.json tests/pokedex-update.test.mjs
git commit -m "feat: generate full Bulbapedia Pokedex dataset"
```

---

### Task 5: Implement Search, Filtering, Sorting, and Formatting Logic

**Files:**
- Create: `docs/.vitepress/theme/pokedex-utils.js`
- Create: `tests/pokedex-utils.test.mjs`

**Interfaces:**
- Produces:
  - `formatDexNumber(number) -> '#0001'`
  - `filterAndSortPokemon(records, state) -> records[]`
  - `allTypes(records) -> string[]`
  - `allGenerations(records) -> number[]`

- [ ] **Step 1: Write failing client-logic tests**

Create tests covering:
- partial case-insensitive name search;
- number search with and without leading zeroes;
- punctuation/Unicode names;
- type + generation combined filters;
- ascending/descending Dex order;
- A-Z/Z-A;
- zero results.

Example:

```js
test('number search accepts leading zeroes', () => {
  const result = filterAndSortPokemon(sample, {
    query: '0001',
    type: 'all',
    generation: 'all',
    sort: 'dex-asc',
  })
  assert.deepEqual(result.map((p) => p.name), ['Bulbasaur'])
})
```

- [ ] **Step 2: Run test and confirm failure**

```bash
npm test
```

- [ ] **Step 3: Implement pure utilities**

`filterAndSortPokemon` must:
- trim the query;
- treat an all-digit query as a numeric National Dex lookup using `Number(query)`;
- otherwise search `name.toLocaleLowerCase()` and `slug`;
- combine type and generation filters;
- return a new sorted array without mutating source data.

Use `Intl.Collator('en', { sensitivity: 'base' })` for name sorting.

- [ ] **Step 4: Run unit tests**

```bash
npm test
```

Expected: all filter/sort review-focus cases pass.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/pokedex-utils.js tests/pokedex-utils.test.mjs
git commit -m "feat: add Pokedex search and filter logic"
```

---

### Task 6: Build the Pokédex Vue Components

**Files:**
- Create: `docs/.vitepress/theme/components/TypeBadge.vue`
- Create: `docs/.vitepress/theme/components/DexEntry.vue`
- Create: `docs/.vitepress/theme/components/PokemonCard.vue`
- Create: `docs/.vitepress/theme/components/PokedexToolbar.vue`
- Create: `docs/.vitepress/theme/components/PokemonGrid.vue`
- Create: `docs/.vitepress/theme/components/PokemonDetails.vue`
- Create: `docs/.vitepress/theme/components/Pokedex.vue`
- Modify: `docs/.vitepress/theme/index.js`

**Interfaces:**
- `PokemonCard` props: `{ pokemon }`; emits `select`.
- `PokedexToolbar` props: `{ query, type, generation, sort, types, generations }`; emits `update:*` and `reset`.
- `PokemonGrid` props: `{ pokemon }`; emits `select`.
- `PokemonDetails` props: `{ pokemon, previousPokemon, nextPokemon }`; emits `close`, `navigate`.
- `Pokedex` imports `pokemon.json` and owns all state.

- [ ] **Step 1: Implement `TypeBadge.vue`**

Render a text badge with class derived from normalized type:

```vue
<template>
  <span class="type-badge" :class="`type-${type.toLowerCase()}`">{{ type }}</span>
</template>

<script setup>
defineProps({ type: { type: String, required: true } })
</script>
```

Type-specific colors live in `pokedex.css`; never rely on color alone because the label text is always present.

- [ ] **Step 2: Implement `DexEntry.vue`**

Render game + entry + source link. If text is missing, render `No entry text available.` instead of an empty row.

- [ ] **Step 3: Implement an accessible `PokemonCard.vue`**

Use a real `<button>` for the whole card so keyboard activation comes for free.

Requirements:
- `#0001` formatting via `formatDexNumber`;
- image with `loading="lazy"` and meaningful alt;
- fallback visual when `pokemon.image?.url` is absent;
- type badges;
- no nested interactive elements inside the card button.

- [ ] **Step 4: Implement `PokedexToolbar.vue`**

Use:
- `<input type="search">` with `aria-label="Search Pokémon by name or National Dex number"`;
- type `<select>`;
- generation `<select>`;
- sort `<select>`;
- Reset button.

Every control emits immediately on change/input.

- [ ] **Step 5: Implement `PokemonGrid.vue`**

Render cards in a semantic list. For `pokemon.length === 0`, render:

```html
<p class="pokedex-empty" role="status">
  No Pokémon match those filters.
</p>
```

- [ ] **Step 6: Implement `PokemonDetails.vue`**

Sections:
- close/back control;
- number/name/types;
- primary artwork/fallback;
- category, height, weight;
- abilities with hidden-ability annotation;
- forms as cards/chips with form-specific type badges;
- evolution scaffold;
- dex entries grouped by generation;
- Bulbapedia source link;
- Previous/Next controls.

If optional metadata is missing, show `Unknown` rather than omitting the label entirely.

- [ ] **Step 7: Implement `Pokedex.vue` state**

Use Vue `ref`/`computed`.

State:
```js
const query = ref('')
const type = ref('all')
const generation = ref('all')
const sort = ref('dex-asc')
const selectedDex = ref(null)
```

Computed:
- `filteredPokemon`;
- `selectedPokemon`;
- `previousPokemon`;
- `nextPokemon`;
- available types/generations.

When navigation changes selected Pokémon, update `selectedDex` only; filters remain intact.

- [ ] **Step 8: Register the component globally**

In `theme/index.js`:

```js
import Pokedex from './components/Pokedex.vue'
```

and in `enhanceApp`:

```js
ctx.app.component('Pokedex', Pokedex)
```

- [ ] **Step 9: Run unit tests and VitePress build**

```bash
npm test
npm run build
```

Expected: no Vue/template/SSR import errors.

- [ ] **Step 10: Commit**

```bash
git add docs/.vitepress/theme/components docs/.vitepress/theme/index.js
git commit -m "feat: add interactive Pokedex components"
```

---

### Task 7: Add Pokémon-Themed Responsive Styling and Pokédex Route

**Files:**
- Modify: `docs/.vitepress/theme/styles/pokedex.css`
- Create: `docs/pokedex/index.md`

**Interfaces:**
- Consumes component class names from Task 6.
- Produces responsive light/dark presentation with accessible focus states.

- [ ] **Step 1: Add the Pokédex route**

Create:

```md
---
title: National Pokédex
layout: page
aside: false
outline: false
---

<ClientOnly>
  <Pokedex />
</ClientOnly>
```

- [ ] **Step 2: Define the Pokédex shell and grid**

Use CSS custom properties and responsive grid:

```css
.pokedex-shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 1rem;
}
```

- [ ] **Step 3: Define type colors**

Add classes for all 18 canonical types. Use foreground colors that remain readable and keep text labels visible.

- [ ] **Step 4: Style cards as modern Pokédex panels**

Requirements:
- red/black structural accent;
- neutral content surface;
- artwork area with subtle screen-like tint;
- visible `:focus-visible` outline;
- hover transforms disabled under reduced motion;
- mobile cards remain at least 44px touch-target friendly.

- [ ] **Step 5: Style toolbar and detail layout**

Desktop detail view uses two columns for artwork/facts vs. entries; under `768px`, use one column.

Toolbar wraps instead of horizontally scrolling.

- [ ] **Step 6: Add dark mode**

Use `.dark` variable overrides; do not hard-code unreadable white backgrounds inside components.

- [ ] **Step 7: Build and manually inspect key widths**

Run:

```bash
npm run dev
```

Inspect at approximately:
- 375 px;
- 768 px;
- 1280 px.

Verify:
- no horizontal overflow;
- toolbar controls remain usable;
- cards remain legible;
- detail view collapses cleanly;
- focus ring is visible.

- [ ] **Step 8: Commit**

```bash
git add docs/pokedex/index.md docs/.vitepress/theme/styles/pokedex.css
git commit -m "feat: style responsive Pokemon Pokedex"
```

---

### Task 8: Final Data/UI Integration and Regression Verification

**Files:**
- Modify only files required by failures found in verification.
- Update: `README.md`

**Interfaces:**
- Validates the complete feature across updater, validator, UI, VitePress build, and documentation.

- [ ] **Step 1: Replace the placeholder README**

Document:

```md
# Universal Pokédex

A VitePress/Vue Pokédex sourced from Bulbapedia.

## Development

npm install
npm run dev

## Refresh Pokémon data

npm run pokedex:update
npm run pokedex:validate

## Verify

npm test
npm run pokedex:validate
npm run build
```

Also explain that the generated JSON is committed so normal site visitors do not query Bulbapedia directly.

- [ ] **Step 2: Run the full automated verification**

```bash
npm test
npm run pokedex:validate
npm run build
```

Expected:
- all Node tests pass;
- validator reports at least 1028 records and zero structural errors;
- VitePress production build succeeds.

- [ ] **Step 3: Verify representative difficult species**

In the running site, search for and open at least:
- `Nidoran♀`;
- `Nidoran♂`;
- `Farfetch'd`;
- `Mr. Mime`;
- a species with a regional form;
- a species with a Mega or comparable alternate form if present in generated data.

Confirm name rendering, slug/search behavior, image fallback behavior, nested forms, and dex entries.

- [ ] **Step 4: Verify combined filters and zero-results state**

Set:
- a text query;
- a type filter;
- a generation filter;
- each sort mode.

Confirm the list is deterministic and reset restores defaults.

Then choose an impossible combination and confirm `No Pokémon match those filters.` appears.

- [ ] **Step 5: Verify attribution paths**

For at least three species:
- Pokémon detail source link opens the correct Bulbapedia species page;
- image metadata points back to Bulbapedia/source context;
- dex entry records carry the species source URL.

- [ ] **Step 6: Verify inherited identity is gone**

Run:

```bash
grep -RniE 'SplatoonDimensions|BLAZE & COMPANY SPACE THEME|nebulaGlow|auroraShimmer' docs package.json
```

Expected: no active site/config/style references.

- [ ] **Step 7: Commit final documentation/fixes**

```bash
git add README.md docs scripts tests package.json package-lock.json
git commit -m "docs: finish Universal Pokedex scaffold"
```

- [ ] **Step 8: Whole-branch review**

Review the complete diff against:
`docs/superpowers/specs/2026-09-22-universal-pokedex-design.md`

Reject completion if any of these are missing:
- full National Dex output;
- Bulbapedia source attribution;
- dex entries;
- nested alternate forms;
- search/filter/sort;
- responsive Pokémon styling;
- successful test/validate/build commands.
