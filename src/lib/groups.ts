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
    id: '1', name: 'Group 1', short: '-ar · -ade · -at',
    endings: { inf: '-a', pres: '-ar', pret: '-ade', sup: '-at', imp: '-a' },
    examples: ['tala', 'prata', 'jobba', 'arbeta', 'titta', 'städa'],
    rule: 'Presens ends in -ar. Keep the whole infinitive and add -r, -de, -t.',
    spot: 'If presens ends in -ar, it is group 1. It is the biggest group, and new verbs join it: googla, mejla, swisha.',
    notes: [],
  },
  {
    id: '2a', name: 'Group 2a', short: '-er · -de · -t',
    endings: { inf: '-a', pres: '-er', pret: '-de', sup: '-t', imp: '–' },
    examples: ['leva', 'stänga', 'ringa', 'höra', 'glömma', 'använda'],
    rule: 'Presens ends in -er. The stem ends in a voiced sound, so preteritum takes -de.',
    spot: 'Remove -a to get the stem (lev-). Stem ends in b, d, g, j, l, m, n, r or v → 2a.',
    notes: [
      { text: 'Stem ends in -r: no -er in presens.', verbs: ['köra', 'höra', 'lära'] },
      { text: 'Double m or n becomes single before -de and -t.', verbs: ['glömma', 'känna', 'bränna'] },
      { text: 'Consonant + d: the d merges with the ending.', verbs: ['använda', 'vända', 'sända'] },
      { text: 'Vowel + d: -dde in preteritum, -tt in supinum.', verbs: ['betyda', 'leda', 'föda'] },
    ],
  },
  {
    id: '2b', name: 'Group 2b', short: '-er · -te · -t',
    endings: { inf: '-a', pres: '-er', pret: '-te', sup: '-t', imp: '–' },
    examples: ['köpa', 'läsa', 'tänka', 'hjälpa', 'åka', 'resa'],
    rule: 'Presens ends in -er. The stem ends in a voiceless sound (k, p, s, t, x), so preteritum takes -te.',
    spot: 'Say the stem out loud: köp-, läs-, tänk-. A hard, voiceless final sound → -te.',
    notes: [
      { text: 'Vowel + t: -tte in preteritum, -tt in supinum.', verbs: ['möta', 'byta', 'sköta'] },
      { text: 'Consonant + t: the t merges with the ending.', verbs: ['lyfta', 'smälta'] },
    ],
  },
  {
    id: '3', name: 'Group 3', short: '-r · -dde · -tt',
    endings: { inf: '(vowel)', pres: '-r', pret: '-dde', sup: '-tt', imp: '–' },
    examples: ['bo', 'tro', 'må', 'sy', 'nå', 'bero'],
    rule: 'Short verbs whose infinitive does not end in -a. Add -r, -dde, -tt.',
    spot: 'One syllable, ends in a long vowel: bo, tro, sy. (Short irregular verbs like gå, se, stå are group 4.)',
    notes: [],
  },
  {
    id: '4', name: 'Group 4', short: 'vowel change · -it',
    endings: { inf: '-a', pres: '-er', pret: 'vowel change', sup: '-it', imp: '–' },
    examples: ['skriva', 'dricka', 'flyga', 'komma', 'gå', 'göra'],
    rule: 'Strong and irregular verbs. The vowel changes in preteritum and there is no ending; supinum usually ends in -it.',
    spot: 'There is no rule to spot them, but they are the most common verbs, and most follow a few vowel patterns.',
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
  steps.push({ q: 'Is preteritum irregular?', a: irregular ? `Yes: ${word} → ${pret}` : `No: ${pret}`, group: irregular ? '4' : undefined })
  if (irregular) return steps
  const noA = !word.endsWith('a')
  steps.push({ q: 'Does the infinitive end in -a?', a: noA ? `No: ${word}` : `Yes: ${word}`, group: noA ? '3' : undefined })
  if (noA) return steps
  const ar = v.group === '1'
  steps.push({ q: 'Does presens end in -ar?', a: ar ? `Yes: ${pres}` : `No: ${pres}`, group: ar ? '1' : undefined })
  if (ar) return steps
  const voiceless = v.group === '2b'
  steps.push({ q: 'Does the stem end in k, p, s, t or x?', a: `${voiceless ? 'Yes' : 'No'}: ${stem}-`, group: voiceless ? '2b' : '2a' })
  return steps
}
