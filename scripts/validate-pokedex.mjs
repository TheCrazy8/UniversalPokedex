import { readFile } from 'node:fs/promises'
import { validatePokemonData } from './lib/pokedex-schema.mjs'

const args = new Set(process.argv.slice(2))
const allowScaffold = args.has('--allow-scaffold')
const path = new URL('../docs/.vitepress/data/pokemon.json', import.meta.url)
const records = JSON.parse(await readFile(path, 'utf8'))
const { errors, warnings } = validatePokemonData(records, { requireCompleteDex: !allowScaffold })

for (const warning of warnings) console.warn(`warning: ${warning}`)
for (const error of errors) console.error(`error: ${error}`)

if (errors.length) process.exitCode = 1
else console.log(`Validated ${records.length} Pokémon records${allowScaffold ? ' (scaffold mode)' : ''}.`)
