import type { FormKey, Group } from './types'
import data from '../data/verbs.json'
import examples from '../data/examples.json'
import { isAuxiliary } from './filters'
import type { Verb } from './types'

const EXAMPLES = examples as Record<string, Verb['ex']>
export const VERBS = (data as Verb[]).map((v) => (EXAMPLES[v.id] ? { ...v, ex: EXAMPLES[v.id] } : v))
export const VERB_BY_ID = new Map(VERBS.map((v) => [v.id, v]))

export interface GroupInfo {
  id: Group
  name: string
  /** Kjellin's model verb in presens – preteritum – supinum. */
  short: string
  /** What each form adds to the stem; the stem is the imperative. */
  endings: { inf: string; pres: string; pret: string; sup: string; imp: string }
  examples: string[]
  rule: string
  spot: string
  /** Where stem and ending meet in an unexpected way, shown as stem + ending → form. */
  notes: { text: string; forms: FormKey[]; verbs: string[] }[]
}

export const GROUPS: GroupInfo[] = [
  {
    id: '1', name: 'Grupp 1', short: 'talar – talade – talat',
    endings: { inf: '(stam)', pres: '-r', pret: '-de', sup: '-t', imp: '(stam)' },
    examples: ['tala', 'prata', 'jobba', 'arbeta', 'titta', 'städa'],
    rule: 'Imperativen slutar på -a: tala! Lägg till -r, -de och -t.',
    spot: 'Den största gruppen. Nya verb hamnar här: googla, mejla, swisha.',
    notes: [],
  },
  {
    id: '2a', name: 'Grupp 2a', short: 'ringer – ringde – ringt',
    endings: { inf: '-a', pres: '-er', pret: '-de', sup: '-t', imp: '(stam)' },
    examples: ['leva', 'stänga', 'ringa', 'höra', 'glömma', 'använda'],
    rule: 'Imperativen slutar på en konsonant: ring! Lägg till -er, -de och -t.',
    spot: 'Imperativen slutar inte på p, k, s, t eller x: ring!, lev!, glöm!',
    notes: [
      { text: 'Stammen slutar på r', forms: ['pres'], verbs: ['köra', 'höra', 'lära'] },
      { text: 'mm och nn', forms: ['pret', 'sup'], verbs: ['glömma', 'känna', 'bränna'] },
      { text: 'Konsonant + d', forms: ['pret', 'sup'], verbs: ['använda', 'vända', 'sända'] },
      { text: 'Vokal + d', forms: ['pret', 'sup'], verbs: ['betyda', 'leda', 'föda'] },
      { text: 'Omljud', forms: ['pret', 'sup'], verbs: ['välja', 'lägga', 'göra'] },
    ],
  },
  {
    id: '2b', name: 'Grupp 2b', short: 'köper – köpte – köpt',
    endings: { inf: '-a', pres: '-er', pret: '-te', sup: '-t', imp: '(stam)' },
    examples: ['köpa', 'läsa', 'tänka', 'hjälpa', 'åka', 'resa'],
    rule: 'Som 2a, men imperativen slutar på p, k, s, t eller x. Då blir -de till -te. Tänk på Pakistan: p, k, s, t.',
    spot: 'Säg imperativen högt: köp!, läs!, tänk!',
    notes: [
      { text: 'Vokal + t', forms: ['pret', 'sup'], verbs: ['möta', 'byta', 'sköta'] },
      { text: 'Konsonant + t', forms: ['pret', 'sup'], verbs: ['lyfta', 'smälta'] },
      { text: 'Omljud', forms: ['pret', 'sup'], verbs: ['sätta', 'fortsätta'] },
    ],
  },
  {
    id: '3', name: 'Grupp 3', short: 'bor – bodde – bott',
    endings: { inf: '(stam)', pres: '-r', pret: '-dde', sup: '-tt', imp: '(stam)' },
    examples: ['bo', 'tro', 'må', 'sy', 'nå', 'bero'],
    rule: 'Korta verb som slutar på en lång vokal. Lägg till -r, -dde och -tt.',
    spot: 'Gå, se och stå ser likadana ut men är oregelbundna.',
    notes: [],
  },
  {
    id: '4', name: 'Grupp 4', short: 'skriver – skrev – skrivit',
    endings: { inf: '-a', pres: '-er', pret: '(ny vokal)', sup: '-it', imp: '(stam)' },
    examples: ['skriva', 'dricka', 'bryta', 'bära', 'ta', 'komma'],
    rule: 'Ny vokal i preteritum och supinum. Preteritum får ingen ändelse, supinum får -it.',
    spot: 'Vokalerna följer åtta mönster.',
    notes: [],
  },
]

export const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]))

/** Kjellin's subgroups of group 4, by the vowels of infinitive – preteritum – supinum. */
export const SUBGROUPS = [
  { id: '4a', family: 'i–a–u', typ: 'finner – fann – funnit' },
  { id: '4b', family: 'y/u–ö–u', typ: 'bryter – bröt – brutit' },
  { id: '4c', family: 'i–e–i', typ: 'skriver – skrev – skrivit' },
  { id: '4d', family: 'ä–a–u', typ: 'bär – bar – burit' },
  { id: '4e', family: 'a–o–a', typ: 'tar – tog – tagit' },
  { id: '4f', family: 'å–ä–å', typ: 'låter – lät – låtit' },
  { id: '4g', family: 'a/å–ö–a/å', typ: 'håller – höll – hållit' },
  { id: '4h', family: 'o–o–o', typ: 'kommer – kom – kommit' },
] as const
export type Subgroup = (typeof SUBGROUPS)[number]

const SUBGROUP_BY_FAMILY = new Map<string, Subgroup>(SUBGROUPS.map((s) => [s.family, s]))
export const subgroupOf = (v: Verb): Subgroup | undefined => (v.group === '4' && v.family ? SUBGROUP_BY_FAMILY.get(v.family) : undefined)
export const subgroupByFamily = (family: string) => SUBGROUP_BY_FAMILY.get(family)
/** A vowel pattern for reading: i–a–u → i – a – u. */
export const patternLabel = (family: string) => family.replace(/–/g, ' – ')

/** The discreet group mark on each row, with Kjellin's "omlj" for the umlaut verbs (lägger – lade – lagt).
 *  Strong verbs show their pattern elsewhere, so the 4a–4h codes stay out of it. */
export const groupLabel = (v: Verb): string => (v.umlaut ? `${v.group} omlj` : v.group)

/** s-verbs where two or more do something to each other; the other s-verbs in the list are deponents.
 *  The terms stay in the code; students see plain words. */
export const RECIPROCAL = new Set(['träffas', 'ses', 'slåss', 'umgås', 'mötas', 'kramas', 'pussas', 'brottas', 'enas'])
export const sKind = (v: Verb): 'reciprokt' | 'deponens' | null =>
  v.sVerb ? (RECIPROCAL.has(v.inf.split(' ')[0]) ? 'reciprokt' : 'deponens') : null

export interface Family {
  /** The vowel pattern, e.g. i–e–i. */
  id: string
  sub: Subgroup
  verbs: Verb[]
}

/** Group 4 split into Kjellin's 4a–4h; outside them are the helper verbs and the irregular ones. */
export function families(): { named: Family[]; other: Verb[]; helpers: Verb[] } {
  const named: Family[] = SUBGROUPS.map((sub) => ({ id: sub.family, sub, verbs: [] }))
  const other: Verb[] = []
  const helpers: Verb[] = []
  for (const v of VERBS) {
    if (v.group !== '4' || v.particle || v.reflexive) continue
    const sub = subgroupOf(v)
    if (sub) named.find((f) => f.sub === sub)!.verbs.push(v)
    else if (isAuxiliary(v)) helpers.push(v)
    else other.push(v)
  }
  other.sort((a, b) => a.freq - b.freq)
  helpers.sort((a, b) => a.freq - b.freq)
  return { named: named.filter((f) => f.verbs.length), other, helpers }
}

export const NAMED_FAMILIES = families().named
export const FAMILY_IDS = new Set<string>(SUBGROUPS.map((s) => s.family))
export const FAMILY_ORDER: string[] = SUBGROUPS.map((s) => s.family)

/** Where to read about a verb's group: that group opened on the group page. */
export const learnPath = (v: Verb): string => `/grupper?open=${v.group}`

const TOGETHER: Record<string, string> = {
  ses: 'Vi ses imorgon!', träffas: 'Vi träffas på fredag.', umgås: 'Vi umgås på helgerna.', slåss: 'Barnen slåss på skolgården.',
}

/** What a student needs to know about an s-verb, in plain words. */
export function sVerbNote(v: Verb): string | null {
  if (!v.sVerb) return null
  const forms = `Slutar alltid på -s, även i presens: ${v.id === 'finnas' || v.id === 'kännas' ? 'det' : 'jag'} ${v.pres}.`
  if (sKind(v) === 'reciprokt') return `${forms} Två eller flera gör något med varandra: ${TOGETHER[v.id] ?? `Vi ${v.pres}.`}`
  // hoppas is not hoppa, känns is not känner
  const base = VERB_BY_ID.get(v.inf.replace(/s$/, ''))
  const name = (w: string) => w[0].toUpperCase() + w.slice(1)
  return base && !base.sVerb ? `${forms} ${name(v.inf)} betyder något annat än ${base.inf}.` : forms
}
