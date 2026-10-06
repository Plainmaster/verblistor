// Builds src/data/verbs.json from:
//   data/verbs.txt       curated list (inclusion, English gloss, level, sentence context) — hand-written
//   data/overrides.json  hand corrections to forms (modals, missing imperatives, preferred variants)
//   data-raw/kelly.xml   Swedish Kelly-list, CC BY-SA 3.0 (frequency rank)
//   data-raw/saldo-verbs.json  extracted from SALDO morphology, CC BY 4.0 (inflected forms)
import { readFileSync, writeFileSync } from 'node:fs'
import { classify } from '../src/lib/conjugate'
import type { Cefr, Forms, Verb } from '../src/lib/types'
import type { SaldoVerb } from './extract-saldo'
import { indexSaldo, loadKelly, loadSaldo } from './sources'
import { ablautFamily } from './family'

interface Line { inf: string; cefr: Cefr; en: string; rest?: string; subj?: string }

function readList(): Line[] {
  return readFileSync('data/verbs.txt', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [inf, cefr, en, rest, subj] = l.split('|').map((x) => x.trim())
      return { inf, cefr: cefr as Cefr, en, rest: rest || undefined, subj: subj || undefined }
    })
}

type Override = Partial<Forms> & { lem?: string; alt?: Verb['alt']; note?: string; modal?: boolean; part?: string | null }

const PRONOUNS = ['sig', 'mig', 'dig', 'oss', 'er']

/** Pick the main variant of a SALDO form list: the reflexive 'sig'/'dig' variant for reflexive verbs, else the first. */
function pick(list: string[] | undefined, reflexive: boolean, imp = false): { main: string | null; alt: string[] } {
  if (!list?.length) return { main: null, alt: [] }
  let main = list[0]
  if (reflexive) main = list.find((x) => x.split(' ').includes(imp ? 'dig' : 'sig')) ?? main
  return { main, alt: list.filter((x) => x !== main) }
}

function formsOf(e: SaldoVerb, reflexive: boolean) {
  const s = !e.forms['inf aktiv'] && !!e.forms['inf s-form']
  const key = (k: string) => (s ? `${k} s-form` : `${k} aktiv`)
  const inf = pick(e.forms[key('inf')], reflexive)
  const pres = pick(e.forms[s ? 'pres ind s-form' : 'pres ind aktiv'], reflexive)
  const pret = pick(e.forms[s ? 'pret ind s-form' : 'pret ind aktiv'], reflexive)
  const sup = pick(e.forms[key('sup')], reflexive)
  const imp = s ? { main: null, alt: [] } : pick(e.forms['imper'], reflexive, true)
  const part = s ? { main: null, alt: [] } : pick(e.forms['pret_part indef sg u nom'], false)
  return { inf, pres, pret, sup, imp, part }
}

/** Build an entry for a reflexive/particle verb (from its base verb) or an s-verb (from the base verb's s-forms) missing in SALDO. */
function derive(inf: string, byGf: Map<string, SaldoVerb[]>, usable: (e: SaldoVerb) => boolean): SaldoVerb[] {
  const [head, ...rest] = inf.split(' ')
  if (rest.length) {
    const tail = rest.join(' ')
    return (byGf.get(head) ?? []).filter(usable).map((b) => ({
      ...b, lem: b.lem + '+' + tail, gf: inf,
      forms: Object.fromEntries(Object.entries(b.forms).map(([k, list]) => [
        k, list.map((x) => `${x} ${k === 'imper' ? tail.replace(/\bsig\b/, 'dig') : tail}`),
      ])),
    }))
  }
  if (inf.endsWith('s')) {
    return (byGf.get(inf.slice(0, -1)) ?? []).filter((b) => b.forms['inf s-form']?.includes(inf)).map((b) => ({
      ...b, lem: b.lem + '+s', gf: inf,
      forms: Object.fromEntries(Object.entries(b.forms).filter(([k]) => k.endsWith('s-form'))),
    }))
  }
  return []
}

const firstWord = (s: string) => s.split(' ')[0]

function main() {
  const list = readList()
  const overrides: Record<string, Override> = JSON.parse(readFileSync('data/overrides.json', 'utf8'))
  const kelly = loadKelly()
  const { byGf } = indexSaldo(loadSaldo())
  const rank = new Map<string, number>()
  kelly.forEach((k, i) => { if (!rank.has(k.gf)) rank.set(k.gf, i + 1) })
  const kellySenses = new Map(kelly.map((k) => [k.gf, new Set(k.saldo)]))

  const problems: string[] = []
  const verbs: Verb[] = []
  const seen = new Set<string>()

  for (const line of list) {
    if (seen.has(line.inf)) { problems.push(`duplicate: ${line.inf}`); continue }
    seen.add(line.inf)
    const words = line.inf.split(' ')
    const reflexive = words.includes('sig')
    const particle = words.slice(1).filter((w) => !PRONOUNS.includes(w)).join(' ') || undefined
    const ov = overrides[line.inf] ?? {}
    const usable = (e: SaldoVerb) => !!(e.forms['inf aktiv'] || e.forms['inf s-form']) && !!(e.forms['pret ind aktiv'] || e.forms['pret ind s-form'])
    let candidates = (byGf.get(line.inf) ?? []).filter(usable)
    if (!candidates.length) candidates = derive(line.inf, byGf, usable)
    const senses = kellySenses.get(line.inf)
    const entry = (ov.lem && candidates.find((e) => e.lem === ov.lem))
      ?? candidates.find((e) => senses && e.saldo.some((s) => senses.has(s))) ?? candidates[0]
    if (!entry && !ov.pres) { problems.push(`no SALDO entry: ${line.inf}`); continue }
    if (candidates.length > 1) {
      const sig = (e: SaldoVerb) => JSON.stringify([e.forms['pret ind aktiv'], e.forms['sup aktiv']])
      if (new Set(candidates.map(sig)).size > 1) {
        problems.push(`homonyms differ for ${line.inf}: ${candidates.map((c) => `${c.lem}=${sig(c)}`).join(' / ')} → using ${entry?.lem}`)
      }
    }
    const f = entry ? formsOf(entry, reflexive) : null
    if (f && f.inf.main !== line.inf && f.inf.alt.includes(line.inf)) {
      f.inf = { main: line.inf, alt: [f.inf.main!, ...f.inf.alt.filter((x) => x !== line.inf)] }
    }
    const forms: Forms = {
      inf: ov.inf ?? f?.inf.main ?? line.inf,
      pres: ov.pres ?? f?.pres.main ?? '',
      pret: ov.pret ?? f?.pret.main ?? '',
      sup: ov.sup ?? f?.sup.main ?? '',
      imp: ov.imp !== undefined ? ov.imp : f?.imp.main ?? null,
    }
    for (const k of ['pres', 'pret', 'sup'] as const) if (!forms[k]) problems.push(`missing ${k}: ${line.inf}`)

    const alt: NonNullable<Verb['alt']> = {}
    if (f) {
      for (const k of ['inf', 'pres', 'pret', 'sup', 'imp'] as const) {
        const all = [f[k].main, ...f[k].alt].filter((x): x is string => !!x && x !== forms[k])
        if (all.length) alt[k] = all
      }
    }
    for (const [k, v] of Object.entries(ov.alt ?? {})) {
      alt[k as keyof typeof alt] = [...new Set([...(alt[k as keyof typeof alt] ?? []), ...(v ?? [])])]
    }

    const base: Forms = {
      inf: firstWord(forms.inf), pres: firstWord(forms.pres), pret: firstWord(forms.pret),
      sup: firstWord(forms.sup), imp: forms.imp ? firstWord(forms.imp) : null,
    }
    const cls = classify(base)
    const part = ov.part === null ? undefined : ov.part ?? (particle || reflexive ? undefined : f?.part.main ?? undefined)

    const verb: Verb = {
      id: line.inf,
      ...forms,
      ...(part ? { part } : {}),
      ...(Object.keys(alt).length ? { alt } : {}),
      en: line.en,
      group: cls.group,
      irregular: cls.irregular,
      cefr: line.cefr,
      freq: rank.get(line.inf) ?? rank.get(words[0]) ?? 9999,
    }
    if (ov.modal) { delete verb.alt; if (ov.alt) verb.alt = ov.alt }
    if (cls.group === '4' && !ov.modal) {
      const unS = (s: string) => (cls.sVerb ? s.replace(/s$/, '') : s)
      const fam = ablautFamily({ ...base, inf: unS(base.inf), pret: unS(base.pret), sup: unS(base.sup) })
      if (fam) verb.family = fam
    }
    if (cls.sVerb) verb.sVerb = true
    if (particle) verb.particle = particle
    if (reflexive) verb.reflexive = true
    if (ov.modal) verb.modal = true
    if (ov.note) verb.note = ov.note
    if (line.rest !== '-') verb.ctx = { rest: line.rest ?? '', ...(line.subj ? { subj: line.subj } : {}) }
    if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(line.cefr)) problems.push(`bad level: ${line.inf} ${line.cefr}`)
    verbs.push(verb)
  }

  // A vowel pattern only counts as a family if at least three distinct single-word verbs share it.
  const famSize = new Map<string, number>()
  for (const v of verbs) if (v.family && !v.particle && !v.reflexive) famSize.set(v.family, (famSize.get(v.family) ?? 0) + 1)
  for (const v of verbs) if (v.family && (famSize.get(v.family) ?? 0) < 3) delete v.family

  verbs.sort((a, b) => a.freq - b.freq || a.id.localeCompare(b.id, 'sv'))
  writeFileSync('src/data/verbs.json', JSON.stringify(verbs, null, 0).replace(/\},\{/g, '},\n{') + '\n')
  const byGroup: Record<string, number> = {}
  verbs.forEach((v) => (byGroup[v.group] = (byGroup[v.group] ?? 0) + 1))
  console.log(`wrote ${verbs.length} verbs`, byGroup)
  if (problems.length) console.log(`\n${problems.length} notes:\n` + problems.join('\n'))
}

main()
