import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildPokedex } from '../scripts/update-pokedex.mjs'

const fixture = async (name) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

test('buildPokedex keeps species sorted, preserves forms, and degrades failed detail fetches', async () => {
  const listHtml = await fixture('national-dex.html')
  const speciesHtml = await fixture('species.html')
  const calls = []

  const fetchHtml = async (url) => {
    calls.push(url)
    if (url.includes('List_of_Pok')) return listHtml
    if (url.includes('Rattata_')) throw new Error('synthetic network failure')
    return speciesHtml
  }

  const { records, warnings } = await buildPokedex({
    fetchHtml,
    listUrl: 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number',
    concurrency: 2,
  })

  assert.deepEqual(records.map((record) => record.nationalDex), [1, 19, 29, null, null, null])
  assert.deepEqual(records.slice(-3).map((record) => record.name), ['Browt', 'Pombon', 'Gecqua'])
  assert.equal(records.find((record) => record.name === 'Rattata').forms[0].name, 'Alolan Form')
  assert.equal(records.find((record) => record.name === 'Rattata').image, null)
  assert.ok(warnings.some((warning) => warning.includes('Rattata') && warning.includes('synthetic network failure')))
  assert.equal(calls.length, 7)
})

test('buildPokedex limit is applied before species detail fetches', async () => {
  const listHtml = await fixture('national-dex.html')
  const speciesHtml = await fixture('species.html')
  let detailCalls = 0
  const fetchHtml = async (url) => {
    if (url.includes('List_of_Pok')) return listHtml
    detailCalls += 1
    return speciesHtml
  }

  const { records } = await buildPokedex({ fetchHtml, limit: 1 })
  assert.equal(records.length, 1)
  assert.equal(detailCalls, 1)
})
