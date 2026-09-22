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
    bulbapediaUrl: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur_(Pok%C3%A9mon)',
  }

  const record = parseSpeciesPage(await fixture('species.html'), base)
  assert.equal(record.category, 'Seed Pokémon')
  assert.equal(record.height, '0.7 m')
  assert.equal(record.weight, '6.9 kg')
  assert.equal(record.image.source, 'Bulbapedia')
  assert.deepEqual(record.abilities, [
    { name: 'Overgrow', hidden: false },
    { name: 'Chlorophyll', hidden: true },
  ])
  assert.ok(record.dexEntries.some((entry) => entry.game === 'Red'))
  assert.ok(record.dexEntries.some((entry) => entry.game === 'Blue'))
  assert.equal(record.dexEntries.filter((entry) => entry.text.includes('synthetic entry used')).length, 2)
})

test('keeps Generation X Pokémon with unassigned National Dex numbers as primary species', async () => {
  const records = parseNationalDexPage(await fixture('national-dex.html'))
  const unassigned = records.filter((record) => record.dexStatus === 'unassigned')
  assert.deepEqual(unassigned.map((record) => record.name), ['Browt', 'Pombon', 'Gecqua'])
  assert.ok(unassigned.every((record) => record.nationalDex === null && record.generation === 10))
  assert.equal(records.find((record) => record.name === 'Nidoran♀').forms.length, 0)
})
