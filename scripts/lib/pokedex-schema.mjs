export const POKEMON_TYPES = Object.freeze([
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy',
])

// Bulbapedia currently lists #0001-#1025 plus three Generation X species
// whose National Dex numbers are still displayed as #????.
export const MIN_EXPECTED_NUMBERED_SPECIES = 1025
export const MIN_EXPECTED_TOTAL_SPECIES = 1028

export function validatePokemonData(records, { requireCompleteDex = true } = {}) {
  const errors = []
  const warnings = []
  const numbers = new Set()
  const slugs = new Set()

  if (!Array.isArray(records)) {
    return { errors: ['root value must be an array'], warnings }
  }

  for (const [index, record] of records.entries()) {
    const label = record?.name || `record ${index + 1}`
    const isUnassigned = record?.nationalDex == null && record?.dexStatus === 'unassigned'

    if (!isUnassigned) {
      if (!Number.isInteger(record?.nationalDex) || record.nationalDex < 1) {
        errors.push(`${label}: nationalDex must be a positive integer or explicitly unassigned`)
      } else if (numbers.has(record.nationalDex)) {
        errors.push(`${label}: duplicate National Dex #${record.nationalDex}`)
      } else {
        numbers.add(record.nationalDex)
      }
    }

    if (!record?.name || typeof record.name !== 'string') {
      errors.push(`${label}: name is required`)
    }

    if (!record?.slug || typeof record.slug !== 'string') {
      errors.push(`${label}: slug is required`)
    } else if (slugs.has(record.slug)) {
      errors.push(`${label}: duplicate slug "${record.slug}"`)
    } else {
      slugs.add(record.slug)
    }

    if (!Array.isArray(record?.types) || record.types.length < 1) {
      errors.push(`${label}: at least one type is required`)
    } else {
      for (const type of record.types) {
        if (!POKEMON_TYPES.includes(type)) {
          errors.push(`${label}: unknown type "${type}"`)
        }
      }
    }

    if (!Number.isInteger(record?.generation) || record.generation < 1) {
      errors.push(`${label}: generation must be a positive integer`)
    }

    if (!record?.bulbapediaUrl?.startsWith('https://bulbapedia.bulbagarden.net/')) {
      errors.push(`${label}: bulbapediaUrl is required`)
    }

    if (!record?.image?.url) warnings.push(`${label}: missing image`)
    if (!record?.category) warnings.push(`${label}: missing category`)
    if (!record?.height) warnings.push(`${label}: missing height`)
    if (!record?.weight) warnings.push(`${label}: missing weight`)
    if (!Array.isArray(record?.dexEntries) || record.dexEntries.length === 0) {
      warnings.push(`${label}: missing Pokédex entries`)
    }
  }

  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  for (let expected = 1; expected <= sortedNumbers.length; expected += 1) {
    if (sortedNumbers[expected - 1] !== expected) {
      errors.push(`National Dex is not contiguous at #${expected}`)
      break
    }
  }

  if (requireCompleteDex && numbers.size < MIN_EXPECTED_NUMBERED_SPECIES) {
    errors.push(`expected at least ${MIN_EXPECTED_NUMBERED_SPECIES} numbered National Dex species, received ${numbers.size}`)
  }
  if (requireCompleteDex && records.length < MIN_EXPECTED_TOTAL_SPECIES) {
    errors.push(`expected at least ${MIN_EXPECTED_TOTAL_SPECIES} total Pokémon species, received ${records.length}`)
  }

  return { errors, warnings }
}
