import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('site metadata is Universal Pokédex and contains no inherited project identity', async () => {
  const [config, theme, css, packageJsonText] = await Promise.all([
    read('docs/.vitepress/config.mjs'),
    read('docs/.vitepress/theme/index.js'),
    read('docs/.vitepress/theme/styles/main.css'),
    read('package.json'),
  ])
  const packageJson = JSON.parse(packageJsonText)

  assert.match(config, /title:\s*["']Universal Pokédex["']/)
  assert.match(config, /base:\s*["']\/UniversalPokedex\/["']/)
  assert.match(config, /TheCrazy8\/UniversalPokedex/)
  assert.doesNotMatch(config, /SplatoonDimensions/)
  assert.doesNotMatch(theme, /repo:\s*['"]TheCrazy8\/SplatoonDimensions/)
  assert.doesNotMatch(css, /BLAZE & COMPANY SPACE THEME|nebulaGlow|auroraShimmer/)
  assert.equal(packageJson.type, 'module')
})
