import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const component = (name) => readFile(new URL(`../docs/.vitepress/theme/components/${name}.vue`, import.meta.url), 'utf8')

test('PokemonCard is a keyboard-native button with lazy artwork and fallback', async () => {
  const source = await component('PokemonCard')
  assert.match(source, /<button\b/)
  assert.match(source, /loading="lazy"/)
  assert.match(source, /pokemon\.image\?\.url/)
  assert.match(source, /pokemon-artwork-fallback/)
})

test('PokedexToolbar labels search and exposes all filter controls', async () => {
  const source = await component('PokedexToolbar')
  assert.match(source, /aria-label="Search Pokémon by name or National Dex number"/)
  assert.match(source, /Type/)
  assert.match(source, /Generation/)
  assert.match(source, /Sort/)
  assert.match(source, /Reset/)
})

test('PokemonGrid exposes a status message for zero results', async () => {
  const source = await component('PokemonGrid')
  assert.match(source, /No Pokémon match those filters\./)
  assert.match(source, /role="status"/)
})

test('PokemonDetails includes forms, dex entries, attribution, and navigation', async () => {
  const source = await component('PokemonDetails')
  assert.match(source, /Forms/)
  assert.match(source, /Pokédex entries/)
  assert.match(source, /Bulbapedia/)
  assert.match(source, /Previous/)
  assert.match(source, /Next/)
  assert.match(source, /Unknown/)
})

test('theme registers the Pokedex component globally', async () => {
  const source = await readFile(new URL('../docs/.vitepress/theme/index.js', import.meta.url), 'utf8')
  assert.match(source, /import Pokedex from '.\/components\/Pokedex\.vue'/)
  assert.match(source, /ctx\.app\.component\('Pokedex', Pokedex\)/)
})

test('unassigned National Dex species use slug identity instead of nullable dex identity', async () => {
  const [pokedex, grid, details] = await Promise.all([
    component('Pokedex'),
    component('PokemonGrid'),
    component('PokemonDetails'),
  ])
  assert.match(pokedex, /selectedSlug/)
  assert.match(pokedex, /pokemon\.slug === selectedSlug\.value/)
  assert.match(pokedex, /pokemon\.slug === selectedPokemon\.value\.slug/)
  assert.match(grid, /:key="item\.slug"/)
  assert.match(details, /pokemon\.slug.*title/)
})
