import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseNationalDexPage, parseSpeciesPage } from './lib/bulbapedia.mjs'
import { validatePokemonData } from './lib/pokedex-schema.mjs'

export const NATIONAL_DEX_URL =
  'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cacheDir = resolve(root, 'scripts/.cache/bulbapedia')
const outputPath = resolve(root, 'docs/.vitepress/data/pokemon.json')

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

function parseCliArgs(argv) {
  const options = { limit: undefined, refresh: false, concurrency: 3 }
  for (const arg of argv) {
    if (arg === '--refresh') {
      options.refresh = true
      continue
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length))
      if (!Number.isInteger(value) || value < 1) throw new Error('--limit must be a positive integer')
      options.limit = value
      continue
    }
    if (arg.startsWith('--concurrency=')) {
      const value = Number(arg.slice('--concurrency='.length))
      if (!Number.isInteger(value) || value < 1 || value > 6) {
        throw new Error('--concurrency must be an integer from 1 through 6')
      }
      options.concurrency = value
      continue
    }
    throw new Error(`unknown argument: ${arg}`)
  }
  return options
}

function cacheFileFor(url) {
  const digest = createHash('sha256').update(url).digest('hex')
  return resolve(cacheDir, `${digest}.html`)
}

function createCachedFetcher({ refresh = false, minIntervalMs = 250 } = {}) {
  let nextStart = 0

  return async function fetchHtml(url) {
    const cachePath = cacheFileFor(url)
    if (!refresh) {
      try {
        return await readFile(cachePath, 'utf8')
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }
    }

    const wait = Math.max(0, nextStart - Date.now())
    if (wait) await sleep(wait)
    nextStart = Date.now() + minIntervalMs

    const response = await fetch(url, {
      headers: {
        'user-agent': 'UniversalPokedex/1.0 (+https://github.com/TheCrazy8/UniversalPokedex)',
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Bulbapedia request failed (${response.status} ${response.statusText}) for ${url}`)
    }

    const html = await response.text()
    await mkdir(cacheDir, { recursive: true })
    await writeFile(cachePath, html, 'utf8')
    return html
  }
}

function incompleteRecord(base) {
  return {
    ...base,
    category: null,
    height: null,
    weight: null,
    abilities: [],
    image: null,
    evolution: { stage: null, next: [] },
    dexEntries: [],
  }
}

export async function buildPokedex({
  fetchHtml,
  listUrl = NATIONAL_DEX_URL,
  limit,
  concurrency = 3,
} = {}) {
  if (typeof fetchHtml !== 'function') throw new TypeError('fetchHtml must be a function')
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6) {
    throw new RangeError('concurrency must be an integer from 1 through 6')
  }

  const listHtml = await fetchHtml(listUrl)
  const allBaseRecords = parseNationalDexPage(listHtml)
  const baseRecords = Number.isInteger(limit) ? allBaseRecords.slice(0, limit) : allBaseRecords
  const records = new Array(baseRecords.length)
  const warnings = []
  let cursor = 0

  async function worker() {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= baseRecords.length) return
      const base = baseRecords[index]
      try {
        const html = await fetchHtml(base.bulbapediaUrl)
        records[index] = parseSpeciesPage(html, base)
      } catch (error) {
        warnings.push(`${base.name}: ${error instanceof Error ? error.message : String(error)}`)
        records[index] = incompleteRecord(base)
      }
    }
  }

  const workerCount = Math.min(concurrency, Math.max(1, baseRecords.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  records.sort((a, b) => {
    if (Number.isInteger(a.nationalDex) && Number.isInteger(b.nationalDex)) return a.nationalDex - b.nationalDex
    if (Number.isInteger(a.nationalDex)) return -1
    if (Number.isInteger(b.nationalDex)) return 1
    return 0
  })

  return { records, warnings }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  const fetchHtml = createCachedFetcher({ refresh: options.refresh })
  const { records, warnings } = await buildPokedex({
    fetchHtml,
    limit: options.limit,
    concurrency: options.concurrency,
  })

  for (const warning of warnings) console.warn(`warning: ${warning}`)

  const validation = validatePokemonData(records, {
    requireCompleteDex: options.limit == null,
  })
  for (const warning of validation.warnings) console.warn(`warning: ${warning}`)
  if (validation.errors.length) {
    for (const error of validation.errors) console.error(`error: ${error}`)
    process.exitCode = 1
    return
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${records.length} Pokémon records to ${outputPath}`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error))
    process.exitCode = 1
  })
}
