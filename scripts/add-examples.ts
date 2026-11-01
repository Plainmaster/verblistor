// Adds a batch of hand-written example sentences.
//
//   npx tsx scripts/add-examples.ts <batch.json> <out-dir>
//
// batch.json is { "<inf>": { "<form>": "Sentence with {verb} {words}." } }.
// Each sentence is checked the same way verbs.test.ts checks it, then
//   - merged into src/data/examples.json (in batch order, after the verbs already there)
//   - written as one review-page document per verb to <out-dir>/<id>.json
//   - listed in <out-dir>/writes-<n>.json, at most 50 per file (one ArtifactData batch each)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { audioKey } from '../src/lib/audioKey'
import type { FormKey, Verb } from '../src/lib/types'

const [batchPath, outDir] = process.argv.slice(2)
if (!batchPath || !outDir) throw new Error('usage: add-examples.ts <batch.json> <out-dir>')

const EXAMPLES = 'src/data/examples.json'
const verbs = JSON.parse(readFileSync('src/data/verbs.json', 'utf8')) as Verb[]
const examples = JSON.parse(readFileSync(EXAMPLES, 'utf8')) as Record<string, Verb['ex']>
const batch = JSON.parse(readFileSync(batchPath, 'utf8')) as Record<string, Partial<Record<FormKey, string>>>
const byInf = new Map(verbs.map((v) => [v.inf, v]))
const docId = (inf: string) => inf.replace(/å/g, 'aa').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ /g, '_')

const errors: string[] = []
for (const [inf, ex] of Object.entries(batch)) {
  const v = byInf.get(inf)
  if (!v) { errors.push(`${inf}: not in verbs.json`); continue }
  if (examples[v.id]) errors.push(`${inf}: already has examples`)
  for (const [f, s] of Object.entries(ex) as [FormKey, string][]) {
    if (!v[f]) { errors.push(`${inf} ${f}: verb has no such form`); continue }
    const marked = [...s.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).join(' ').toLowerCase()
    const form = v[f]!.replace(/ (mig|dig|sig|oss|er)\b/g, '').toLowerCase()
    if (marked !== form) errors.push(`${inf} ${f}: marked "${marked}", form is "${form}"`)
    if (audioKey(s.replace(/[{}]/g, '')).length > 100) errors.push(`${inf} ${f}: too long for an audio key`)
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }

mkdirSync(outDir, { recursive: true })
let order = Object.keys(examples).length
const writes = Object.entries(batch).map(([inf, ex]) => {
  const v = byInf.get(inf)!
  examples[v.id] = ex
  const id = docId(inf)
  const file = resolve(outDir, `${id}.json`)
  writeFileSync(file, JSON.stringify({ id, inf, en: v.en, ex, korp: [], order: order++ }))
  return { op: 'set', collection: 'verbs', doc_id: id, file_path: file }
})
for (let i = 0; i < writes.length; i += 50)
  writeFileSync(resolve(outDir, `writes-${i / 50 + 1}.json`), JSON.stringify(writes.slice(i, i + 50)))
writeFileSync(EXAMPLES, JSON.stringify(examples, null, 1) + '\n')

const n = Object.values(batch).reduce((a, ex) => a + Object.keys(ex).length, 0)
console.log(`${writes.length} verbs, ${n} sentences; examples.json now has ${Object.keys(examples).length} verbs`)
