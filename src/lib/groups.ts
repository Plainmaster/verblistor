import type { Group } from './types'
import data from '../data/verbs.json'
import type { Verb } from './types'

export const VERBS = data as Verb[]
export const VERB_BY_ID = new Map(VERBS.map((v) => [v.id, v]))

export interface GroupInfo {
  id: Group
  name: string
  short: string
  endings: { inf: string; pres: string; pret: string; sup: string; imp: string }
  examples: string[]
  rule: string
  spot: string
  notes: { text: string; verbs: string[] }[]
}

export const GROUPS: GroupInfo[] = [
  {
    id: '1', name: 'Grupp 1', short: '-ar · -ade · -at',
    endings: { inf: '-a', pres: '-ar', pret: '-ade', sup: '-at', imp: '-a' },
    examples: ['tala', 'prata', 'jobba', 'arbeta', 'titta', 'städa'],
    rule: 'Presens slutar på -ar. Behåll hela infinitiven och lägg till -r, -de, -t.',
    spot: 'Slutar presens på -ar är det grupp 1. Det är den största gruppen, och nya verb hamnar här: googla, mejla, swisha.',
    notes: [],
  },
  {
    id: '2a', name: 'Grupp 2a', short: '-er · -de · -t',
    endings: { inf: '-a', pres: '-er', pret: '-de', sup: '-t', imp: '–' },
    examples: ['leva', 'stänga', 'ringa', 'höra', 'glömma', 'använda'],
    rule: 'Presens slutar på -er. Stammen slutar på ett tonande ljud, så preteritum får -de.',
    spot: 'Ta bort -a så får du stammen (lev-). Slutar stammen på b, d, g, j, l, m, n, r eller v → 2a.',
    notes: [
      { text: 'Stammen slutar på -r: inget -er i presens.', verbs: ['köra', 'höra', 'lära'] },
      { text: 'Dubbelt m eller n blir enkelt före -de och -t.', verbs: ['glömma', 'känna', 'bränna'] },
      { text: 'Konsonant + d: d smälter ihop med ändelsen.', verbs: ['använda', 'vända', 'sända'] },
      { text: 'Vokal + d: -dde i preteritum, -tt i supinum.', verbs: ['betyda', 'leda', 'föda'] },
    ],
  },
  {
    id: '2b', name: 'Grupp 2b', short: '-er · -te · -t',
    endings: { inf: '-a', pres: '-er', pret: '-te', sup: '-t', imp: '–' },
    examples: ['köpa', 'läsa', 'tänka', 'hjälpa', 'åka', 'resa'],
    rule: 'Presens slutar på -er. Stammen slutar på ett tonlöst ljud (k, p, s, t, x), så preteritum får -te.',
    spot: 'Säg stammen högt: köp-, läs-, tänk-. Ett hårt, tonlöst slutljud → -te.',
    notes: [
      { text: 'Vokal + t: -tte i preteritum, -tt i supinum.', verbs: ['möta', 'byta', 'sköta'] },
      { text: 'Konsonant + t: t smälter ihop med ändelsen.', verbs: ['lyfta', 'smälta'] },
    ],
  },
  {
    id: '3', name: 'Grupp 3', short: '-r · -dde · -tt',
    endings: { inf: '(vokal)', pres: '-r', pret: '-dde', sup: '-tt', imp: '–' },
    examples: ['bo', 'tro', 'må', 'sy', 'nå', 'bero'],
    rule: 'Korta verb vars infinitiv inte slutar på -a. Lägg till -r, -dde, -tt.',
    spot: 'En stavelse som slutar på lång vokal: bo, tro, sy. (Korta oregelbundna verb som gå, se och stå är grupp 4.)',
    notes: [],
  },
  {
    id: '4', name: 'Grupp 4', short: 'vokalbyte · -it',
    endings: { inf: '-a', pres: '-er', pret: 'vokalbyte', sup: '-it', imp: '–' },
    examples: ['skriva', 'dricka', 'flyga', 'komma', 'gå', 'göra'],
    rule: 'Starka och oregelbundna verb. Vokalen byts i preteritum och ändelsen saknas. Supinum slutar oftast på -it.',
    spot: 'Det finns ingen regel för att känna igen dem, men de är de vanligaste verben, och de flesta följer några få vokalmönster.',
    notes: [],
  },
]

export const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]))

export interface Family {
  id: string
  verbs: Verb[]
}

/** Vowel families among group 4 verbs, largest first. Families with fewer than three members go into "other". */
export function families(): { named: Family[]; other: Verb[] } {
  const map = new Map<string, Verb[]>()
  const other: Verb[] = []
  for (const v of VERBS) {
    if (v.group !== '4' || v.particle || v.reflexive) continue
    if (!v.family) { other.push(v); continue }
    map.set(v.family, [...(map.get(v.family) ?? []), v])
  }
  const named: Family[] = []
  for (const [id, verbs] of map) {
    if (verbs.length >= 3) named.push({ id, verbs })
    else other.push(...verbs)
  }
  named.sort((a, b) => b.verbs.length - a.verbs.length)
  other.sort((a, b) => a.freq - b.freq)
  return { named, other }
}

/** Steps of the route from a verb to its group. */
export function route(v: Verb): { q: string; a: string; group?: Group }[] {
  const word = v.inf.split(' ')[0]
  const pres = v.pres.split(' ')[0]
  const pret = v.pret.split(' ')[0]
  const stem = word.replace(/a$/, '')
  const steps: { q: string; a: string; group?: Group }[] = []
  const irregular = v.group === '4'
  steps.push({ q: 'Är preteritum oregelbundet?', a: irregular ? `Ja: ${word} → ${pret}` : `Nej: ${pret}`, group: irregular ? '4' : undefined })
  if (irregular) return steps
  const noA = !word.endsWith('a')
  steps.push({ q: 'Slutar infinitiven på -a?', a: noA ? `Nej: ${word}` : `Ja: ${word}`, group: noA ? '3' : undefined })
  if (noA) return steps
  const ar = v.group === '1'
  steps.push({ q: 'Slutar presens på -ar?', a: ar ? `Ja: ${pres}` : `Nej: ${pres}`, group: ar ? '1' : undefined })
  if (ar) return steps
  const voiceless = v.group === '2b'
  steps.push({ q: 'Slutar stammen på k, p, s, t eller x?', a: `${voiceless ? 'Ja' : 'Nej'}: ${stem}-`, group: voiceless ? '2b' : '2a' })
  return steps
}

export const NAMED_FAMILIES = families().named
export const FAMILY_IDS = new Set(NAMED_FAMILIES.map((f) => f.id))
