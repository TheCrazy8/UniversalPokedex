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
    sourceUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)',
  },
  forms: [],
  evolution: { stage: 1, next: [] },
  dexEntries: [{
    game: 'Red',
    generation: 1,
    text: 'Synthetic test entry.',
    sourceUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)',
  }],
  bulbapediaUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)',
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

test('full validation requires a contiguous baseline rather than a fixed maximum', () => {
  const result = validatePokemonData([bulbasaur])
  assert.ok(result.errors.some((message) => message.includes('expected at least 1028')))
})

test('accepts unassigned National Dex species when explicitly marked', () => {
  const browt = {
    ...bulbasaur,
    nationalDex: null,
    dexStatus: 'unassigned',
    name: 'Browt',
    slug: 'browt',
    generation: 10,
    types: ['Grass'],
    bulbapediaUrl: 'https://bulbapedia.bulbagarden.net/wiki/Browt_(Pok%C3%A9mon)',
  }
  const result = validatePokemonData([bulbasaur, browt], { requireCompleteDex: false })
  assert.deepEqual(result.errors, [])
})

test('full validation accepts 1025 contiguous numbered species plus three unassigned species', () => {
  const records = Array.from({ length: 1025 }, (_, index) => ({
    ...bulbasaur,
    nationalDex: index + 1,
    name: `Species ${index + 1}`,
    slug: `species-${index + 1}`,
    types: ['Normal'],
    bulbapediaUrl: `https://bulbapedia.bulbagarden.net/wiki/Species_${index + 1}_(Pok%C3%A9mon)`,
  }))
  records.push(...['Browt', 'Pombon', 'Gecqua'].map((name) => ({
    ...bulbasaur,
    nationalDex: null,
    dexStatus: 'unassigned',
    name,
    slug: name.toLowerCase(),
    generation: 10,
    types: ['Normal'],
    bulbapediaUrl: `https://bulbapedia.bulbagarden.net/wiki/${name}_(Pok%C3%A9mon)`,
  })))

  const result = validatePokemonData(records)
  assert.deepEqual(result.errors, [])
})
