// Streams the SALDO morphology (data-raw/saldom.xml, CC BY 4.0, Språkbanken) and keeps only verb entries
// with the forms Verblistor needs. Output: data-raw/saldo-verbs.json
import { createReadStream, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

export interface SaldoVerb {
  lem: string
  gf: string
  p: string
  pos: string
  saldo: string[]
  forms: Record<string, string[]>
}

const KEEP = new Set([
  'inf aktiv', 'pres ind aktiv', 'pret ind aktiv', 'sup aktiv', 'imper', 'pret_part indef sg u nom',
  'inf s-form', 'pres ind s-form', 'pret ind s-form', 'sup s-form',
])

const tag = (line: string, name: string) => line.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1]

async function main() {
  const rl = createInterface({ input: createReadStream('data-raw/saldom.xml', 'utf8'), crlfDelay: Infinity })
  const out: SaldoVerb[] = []
  let cur: SaldoVerb | null = null
  // multiword parts: param "pres ind aktiv 1:2-2" → variant 1, part 2 of 2
  let parts: Record<string, Record<string, string[]>> = {}

  for await (const line of rl) {
    if (line.includes('<LexicalEntry>')) {
      cur = { lem: '', gf: '', p: '', pos: '', saldo: [], forms: {} }
      parts = {}
    } else if (!cur) {
      continue
    } else if (line.includes('</LexicalEntry>')) {
      if (cur.pos === 'vb' || cur.pos === 'vbm') {
        for (const [param, variants] of Object.entries(parts)) {
          cur.forms[param] = Object.values(variants).map((ws) => ws.join(' '))
        }
        out.push(cur)
      }
      cur = null
    } else if (line.includes('<form>')) {
      const param = tag(line, 'param')
      const wf = tag(line, 'wf')
      if (!param || wf === undefined) continue
      const m = param.match(/^(.*) (\d+):(\d+)-(\d+)$/)
      if (m) {
        if (!KEEP.has(m[1])) continue
        const byVariant = (parts[m[1]] ??= {})
        const ws = (byVariant[m[2]] ??= [])
        ws[Number(m[3]) - 1] = wf
      } else if (KEEP.has(param)) {
        const list = (cur.forms[param] ??= [])
        if (!list.includes(wf)) list.push(wf)
      }
    } else {
      const lem = tag(line, 'lem'); if (lem) cur.lem = lem
      const gf = tag(line, 'gf'); if (gf) cur.gf = gf
      const p = tag(line, 'p'); if (p) cur.p = p
      const pos = tag(line, 'pos'); if (pos) cur.pos = pos
      const s = tag(line, 'saldo'); if (s) cur.saldo.push(s)
    }
  }
  writeFileSync('data-raw/saldo-verbs.json', JSON.stringify(out))
  console.log(`kept ${out.length} verb entries`)
}

main()
