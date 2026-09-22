import { POKEMON_TYPES } from './pokedex-schema.mjs'

const BULBAPEDIA = 'https://bulbapedia.bulbagarden.net'

const GENERATIONS = Object.freeze({
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
})

const ENTITY_MAP = Object.freeze({
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  eacute: 'é',
  female: '♀',
  male: '♂',
})

function decodeHtml(value = '') {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x'
      const raw = hex ? entity.slice(2) : entity.slice(1)
      const code = Number.parseInt(raw, hex ? 16 : 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    }
    return ENTITY_MAP[entity.toLowerCase()] ?? _
  })
}

function removeHiddenElements(value = '') {
  let html = value
  let previous
  const hiddenElement = /<([a-z0-9]+)\b(?=[^>]*(?:\shidden(?:\s|=|>)|aria-hidden=["']true["']|style=["'][^"']*display\s*:\s*none[^"']*["']))[^>]*>[\s\S]*?<\/\1>/gi
  do {
    previous = html
    html = html.replace(hiddenElement, '')
  } while (html !== previous)
  return html
}

function stripHtml(value = '') {
  return decodeHtml(
    removeHiddenElements(value)
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim()
}

function extractCells(rowHtml) {
  const visibleRow = removeHiddenElements(rowHtml)
  return [...visibleRow.matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)]
    .map((match) => {
      const rowspanMatch = match[2].match(/rowspan=["']?(\d+)/i)
      return {
        tag: match[1].toLowerCase(),
        attrs: match[2],
        html: removeHiddenElements(match[3]),
        text: stripHtml(match[3]),
        rowspan: rowspanMatch ? Number(rowspanMatch[1]) : 1,
      }
    })
}

function extractLinks(html = '') {
  const visibleHtml = removeHiddenElements(html)
  return [...visibleHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => {
    const hrefMatch = match[1].match(/href=["']([^"']+)["']/i)
    return {
      href: hrefMatch?.[1] ?? '',
      text: stripHtml(match[2]),
    }
  })
}

function parseGeneration(text = '') {
  const match = text.match(/Generation\s+([IVX]+)/i)
  return match ? GENERATIONS[match[1].toUpperCase()] ?? null : null
}

function typesFromText(text = '') {
  const allowed = new Set(POKEMON_TYPES)
  const seen = new Set()
  const result = []
  for (const word of text.split(/[^A-Za-z]+/).filter(Boolean)) {
    if (allowed.has(word) && !seen.has(word)) {
      seen.add(word)
      result.push(word)
    }
  }
  return result
}

function findSpeciesLink(rowHtml) {
  return extractLinks(rowHtml).find(({ href }) =>
    /\/wiki\/[^?#]+_\((?:Pok%C3%A9mon|Pokémon)\)(?:$|[?#])/i.test(href),
  ) ?? null
}

function findLabeledValue(html, labels) {
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = extractCells(row[1])
    if (cells.length < 2) continue
    const label = cells[0].text.replace(/:$/, '').trim().toLowerCase()
    if (labels.some((candidate) => label === candidate.toLowerCase())) {
      return cells.slice(1).map((cell) => cell.text).join(' ').trim()
    }
  }
  return null
}

function findLabeledRow(html, labels) {
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = extractCells(row[1])
    if (cells.length < 2) continue
    const label = cells[0].text.replace(/:$/, '').trim().toLowerCase()
    if (labels.some((candidate) => label === candidate.toLowerCase())) {
      return { html: row[1], cells }
    }
  }
  return null
}

function extractDexSection(html) {
  const startMatch = /<h[23]\b[^>]*(?:id=["'][^"']*(?:Pok%C3%A9dex|Pokédex)[^"']*entries[^"']*["'])?[^>]*>[\s\S]*?Pok(?:%C3%A9|é)dex\s+entries[\s\S]*?<\/h[23]>/i.exec(html)
  if (!startMatch) return ''
  const start = startMatch.index + startMatch[0].length
  const rest = html.slice(start)
  const endMatch = /<h[23]\b/i.exec(rest)
  return endMatch ? rest.slice(0, endMatch.index) : rest
}

export function absoluteBulbapediaUrl(href = '') {
  if (!href) return ''
  if (href.startsWith('//')) return `https:${href}`
  if (/^https?:\/\//i.test(href)) return href.replace(/^http:/i, 'https:')
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

export function parseNationalDexPage(html) {
  const records = []
  let currentGeneration = 1
  let currentRecord = null

  const tokens = html.matchAll(/<(h[234]|tr)\b[^>]*>([\s\S]*?)<\/\1>/gi)
  for (const token of tokens) {
    const tag = token[1].toLowerCase()
    const inner = token[2]

    if (tag.startsWith('h')) {
      currentGeneration = parseGeneration(stripHtml(inner)) ?? currentGeneration
      continue
    }

    const cells = extractCells(inner)
    if (cells.length < 2) continue

    const numberText = cells[0].text
    const numberMatch = numberText.match(/^#?\s*0*(\d+)\s*$/)
    const unassignedNumber = /^#?\?{4}$/.test(numberText.replace(/\s+/g, ''))
    const speciesLink = findSpeciesLink(inner)
    if (!speciesLink?.text) continue

    const rowTypes = typesFromText(cells.map((cell) => cell.text).join(' '))

    if (numberMatch || unassignedNumber) {
      const nationalDex = numberMatch ? Number(numberMatch[1]) : null
      currentRecord = {
        nationalDex,
        ...(unassignedNumber ? { dexStatus: 'unassigned' } : {}),
        name: speciesLink.text,
        slug: slugifyPokemonName(speciesLink.text),
        generation: currentGeneration,
        types: rowTypes,
        forms: [],
        bulbapediaUrl: absoluteBulbapediaUrl(speciesLink.href),
      }
      records.push(currentRecord)
      continue
    }

    if (!currentRecord) continue
    const candidateTexts = cells
      .map((cell) => cell.text)
      .filter(Boolean)
      .filter((text) => text !== speciesLink.text)
      .filter((text) => typesFromText(text).length === 0)
    const formName = candidateTexts.find((text) => /form|forme|mode|style|cloak|trim|size|pattern|breed/i.test(text))
      ?? candidateTexts[0]
      ?? 'Alternate Form'

    currentRecord.forms.push({
      name: formName,
      types: rowTypes.length ? rowTypes : [...currentRecord.types],
      image: null,
      abilities: [],
      sourceUrl: absoluteBulbapediaUrl(speciesLink.href),
    })
  }

  return records
}

export function parseSpeciesPage(html, baseRecord) {
  const category = findLabeledValue(html, ['Species', 'Category'])
  const heightRaw = findLabeledValue(html, ['Height'])
  const weightRaw = findLabeledValue(html, ['Weight'])
  const heightMatch = heightRaw?.match(/(\d+(?:\.\d+)?)\s*m\b/i)
  const weightMatch = weightRaw?.match(/(\d+(?:\.\d+)?)\s*kg\b/i)
  const height = heightMatch ? `${heightMatch[1]} m` : heightRaw
  const weight = weightMatch ? `${weightMatch[1]} kg` : weightRaw

  const abilityRow = findLabeledRow(html, ['Abilities', 'Ability'])
  const abilityLinks = abilityRow ? extractLinks(abilityRow.html).map((link) => link.text).filter(Boolean) : []
  const hasHiddenAbility = Boolean(abilityRow && /hidden\s+ability/i.test(stripHtml(abilityRow.html)))
  const abilities = abilityLinks.map((name, index) => ({
    name,
    hidden: hasHiddenAbility && index === abilityLinks.length - 1,
  }))

  const imageMatch = html.match(/<img\b[^>]*src=["']([^"']*archives\.bulbagarden\.net[^"']*)["'][^>]*>/i)
  const image = imageMatch
    ? {
        url: absoluteBulbapediaUrl(imageMatch[1]),
        alt: baseRecord.name,
        source: 'Bulbapedia',
        sourceUrl: baseRecord.bulbapediaUrl,
      }
    : null

  const dexEntries = []
  const section = extractDexSection(html)
  let currentGeneration = baseRecord.generation
  let carriedEntryText = null
  let carriedEntryRows = 0

  for (const token of section.matchAll(/<(h4|h5|tr)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = token[1].toLowerCase()
    const inner = token[2]
    if (tag.startsWith('h')) {
      currentGeneration = parseGeneration(stripHtml(inner)) ?? currentGeneration
      carriedEntryText = null
      carriedEntryRows = 0
      continue
    }

    const inheritedText = carriedEntryRows > 0 ? carriedEntryText : null
    if (carriedEntryRows > 0) carriedEntryRows -= 1

    const cells = extractCells(inner)
    if (cells.length < 1) continue
    const games = extractLinks(cells[0].html)
      .map((link) => link.text)
      .filter((text) => text && !/^Generation\b/i.test(text))

    let entryText = inheritedText
    if (cells.length >= 2) {
      const entryCell = cells.at(-1)
      if (entryCell.text) {
        entryText = entryCell.text
        if (entryCell.rowspan > 1) {
          carriedEntryText = entryText
          carriedEntryRows = entryCell.rowspan - 1
        }
      }
    }

    if (!games.length || !entryText || /no Pok(?:é|e)dex entries/i.test(entryText)) continue

    for (const game of games) {
      dexEntries.push({
        game,
        generation: currentGeneration,
        text: entryText,
        sourceUrl: baseRecord.bulbapediaUrl,
      })
    }
  }

  return {
    ...baseRecord,
    category,
    height,
    weight,
    abilities,
    image,
    evolution: baseRecord.evolution ?? { stage: null, next: [] },
    dexEntries,
  }
}
