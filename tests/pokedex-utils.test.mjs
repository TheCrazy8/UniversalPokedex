import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allGenerations,
  allTypes,
  filterAndSortPokemon,
  formatDexNumber,
} from '../docs/.vitepress/theme/pokedex-utils.js'

const sample = [
  { nationalDex: 1, name: 'Bulbasaur', slug: 'bulbasaur', generation: 1, types: ['Grass', 'Poison'] },
  { nationalDex: 29, name: 'Nidoran♀', slug: 'nidoran-f', generation: 1, types: ['Poison'] },
  { nationalDex: 83, name: "Farfetch'd", slug: 'farfetchd', generation: 1, types: ['Normal', 'Flying'] },
  { nationalDex: 122, name: 'Mr. Mime', slug: 'mr-mime', generation: 1, types: ['Psychic', 'Fairy'] },
  { nationalDex: 669, name: 'Flabébé', slug: 'flabebe', generation: 6, types: ['Fairy'] },
]

const defaults = { query: '', type: 'all', generation: 'all', sort: 'dex-asc' }

test('formats National Dex numbers with at least four digits', () => {
  assert.equal(formatDexNumber(1), '#0001')
  assert.equal(formatDexNumber(1028), '#1028')
})

test('number search accepts leading zeroes', () => {
  const result = filterAndSortPokemon(sample, { ...defaults, query: '0001' })
  assert.deepEqual(result.map((p) => p.name), ['Bulbasaur'])
})

test('name search is case-insensitive and supports punctuation-normalized slugs', () => {
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, query: 'FLABEBE' }).map((p) => p.name), ['Flabébé'])
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, query: 'farfetch' }).map((p) => p.name), ["Farfetch'd"])
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, query: 'nidoran-f' }).map((p) => p.name), ['Nidoran♀'])
})

test('type and generation filters compose', () => {
  const result = filterAndSortPokemon(sample, { ...defaults, type: 'Fairy', generation: '1' })
  assert.deepEqual(result.map((p) => p.name), ['Mr. Mime'])
})

test('supports all sort modes without mutating source data', () => {
  const original = sample.map((p) => p.nationalDex)
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, sort: 'dex-desc' }).map((p) => p.nationalDex), [669, 122, 83, 29, 1])
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, sort: 'name-asc' }).map((p) => p.name), ['Bulbasaur', "Farfetch'd", 'Flabébé', 'Mr. Mime', 'Nidoran♀'])
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, sort: 'name-desc' }).map((p) => p.name), ['Nidoran♀', 'Mr. Mime', 'Flabébé', "Farfetch'd", 'Bulbasaur'])
  assert.deepEqual(sample.map((p) => p.nationalDex), original)
})

test('returns a clean zero-results array for impossible combinations', () => {
  assert.deepEqual(filterAndSortPokemon(sample, { ...defaults, query: 'bulba', type: 'Fire' }), [])
})

test('derives sorted filter options', () => {
  assert.deepEqual(allGenerations(sample), [1, 6])
  assert.deepEqual(allTypes(sample), ['Fairy', 'Flying', 'Grass', 'Normal', 'Poison', 'Psychic'])
})

test('formats and sorts unassigned National Dex species after numbered species', () => {
  const records = [...sample, { nationalDex: null, dexStatus: 'unassigned', name: 'Browt', slug: 'browt', generation: 10, types: ['Grass'] }]
  assert.equal(formatDexNumber(null), '#????')
  assert.deepEqual(
    filterAndSortPokemon(records, { ...defaults, sort: 'dex-asc' }).map((p) => p.name).slice(-2),
    ['Flabébé', 'Browt'],
  )
})
