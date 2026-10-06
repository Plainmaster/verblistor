import { readFileSync } from 'node:fs'
import type { SaldoVerb } from './extract-saldo'

export interface KellyVerb {
  gf: string
  wpm: number
  cefr: number
  saldo: string[]
}

/** Kelly-list verbs (CC BY-SA 3.0, Språkbanken), most frequent first. */
export function loadKelly(path = 'data-raw/kelly.xml'): KellyVerb[] {
  const xml = readFileSync(path, 'utf8')
  const out: KellyVerb[] = []
  for (const block of xml.split('<LexicalEntry>').slice(1)) {
    const pos = block.match(/<pos>([^<]*)<\/pos>/)?.[1]
    if (pos !== 'verb' && pos !== 'aux verb') continue
    const raw = block.match(/<gf>([^<]*)<\/gf>/)?.[1] ?? ''
    const gf = raw.replace(/\s*\(.*\)\s*/, '').trim()
    const wpm = Number((block.match(/<wpm>([^<]*)<\/wpm>/)?.[1] ?? '0').replace(',', '.'))
    const cefr = Number(block.match(/<cefr>([^<]*)<\/cefr>/)?.[1] ?? '6')
    const saldo = [...block.matchAll(/<saldo>([^<]*)<\/saldo>/g)].map((m) => m[1])
    out.push({ gf, wpm, cefr, saldo })
  }
  return out.sort((a, b) => b.wpm - a.wpm)
}

export function loadSaldo(path = 'data-raw/saldo-verbs.json'): SaldoVerb[] {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function indexSaldo(entries: SaldoVerb[]) {
  const byGf = new Map<string, SaldoVerb[]>()
  const bySense = new Map<string, SaldoVerb[]>()
  for (const e of entries) {
    byGf.set(e.gf, [...(byGf.get(e.gf) ?? []), e])
    for (const s of e.saldo) bySense.set(s, [...(bySense.get(s) ?? []), e])
  }
  return { byGf, bySense }
}
