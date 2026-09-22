import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Pokedex route mounts the client-side browser without docs chrome constraints', async () => {
  const source = await readFile(new URL('../docs/pokedex/index.md', import.meta.url), 'utf8')
  assert.match(source, /<ClientOnly>/)
  assert.match(source, /<Pokedex\s*\/>/)
  assert.match(source, /aside:\s*false/)
  assert.match(source, /outline:\s*false/)
})

test('Pokedex stylesheet defines responsive grid, focus state, dark mode, and all canonical types', async () => {
  const css = await readFile(new URL('../docs/.vitepress/theme/styles/pokedex.css', import.meta.url), 'utf8')
  assert.match(css, /\.pokemon-grid\s*\{/)
  assert.match(css, /repeat\(auto-fill,\s*minmax\(/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /\.dark\s+\.pokemon-card/)
  assert.match(css, /@media\s*\(max-width:\s*768px\)/)
  for (const type of ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']) {
    assert.match(css, new RegExp(`\\.type-${type}\\b`), `missing ${type} type style`)
  }
  assert.equal((css.match(/{/g) ?? []).length, (css.match(/}/g) ?? []).length)
})
