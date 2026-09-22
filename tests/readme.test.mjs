import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('README documents development, data refresh, validation, build, and Bulbapedia source', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')
  assert.match(readme, /^# Universal Pokédex/m)
  assert.match(readme, /npm run dev/)
  assert.match(readme, /npm run pokedex:update/)
  assert.match(readme, /npm run pokedex:validate/)
  assert.match(readme, /npm run build/)
  assert.match(readme, /Bulbapedia/)
  assert.match(readme, /generated JSON/i)
})
