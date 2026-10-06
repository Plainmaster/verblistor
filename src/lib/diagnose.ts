import { conjugate } from './conjugate'
import { expected, normalize } from './check'
import type { FormKey, RegularGroup, Verb } from './types'

export type DiagnosisType =
  | 'correct' | 'empty' | 'accent' | 'wrongForm' | 'participle' | 'regularized'
  | 'voicing' | 'wrongGroup' | 'group3' | 'doubling' | 'typo' | 'unknown'

export interface Diagnosis {
  type: DiagnosisType
  message: string
}

export const FORM_NAMES: Record<FormKey, string> = {
  inf: 'infinitiv', imp: 'imperativ', pres: 'presens', pret: 'preteritum', sup: 'supinum', part: 'perfekt particip',
}

export const ERROR_LABELS: Record<DiagnosisType, string> = {
  correct: 'Correct', empty: 'No answer', accent: 'Missing å/ä/ö', wrongForm: 'Wrong tense',
  participle: 'Participle vs supinum', regularized: 'Strong verb made regular', voicing: '2a/2b ending',
  wrongGroup: 'Wrong group ending', group3: 'Group 3 -dde/-tt', doubling: 'Double consonant',
  typo: 'Typo', unknown: 'Other',
}

const fold = (s: string) => s.replace(/[åä]/g, 'a').replace(/ö/g, 'o')
const dedupe = (s: string) => s.replace(/(.)\1+/g, '$1')

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return d[a.length][b.length]
}

function regularForm(verb: Verb, g: RegularGroup, form: FormKey): string | null {
  const word = verb.inf.split(' ')[0]
  if (form === 'part' || form === 'inf') return null
  if (g !== '3' && !word.endsWith('a')) return null
  const f = conjugate(word, g)[form]
  if (!f) return null
  return verb.particle ? `${f} ${verb.particle}` : f
}

const GROUP_RULE: Record<RegularGroup, string> = {
  '1': 'Group 1: -ar, -ade, -at',
  '2a': 'Group 2a: -er, -de, -t',
  '2b': 'Group 2b: -er, -te, -t (stem ends in k, p, s, t or x)',
  '3': 'Group 3: -r, -dde, -tt',
}

export function diagnose(answer: string, verb: Verb, form: FormKey): Diagnosis {
  const a = normalize(answer)
  const targets = expected(verb, form).map(normalize)
  const target = targets[0] ?? ''
  const fname = FORM_NAMES[form]

  if (!a) return { type: 'empty', message: `The ${fname} of ${verb.inf} is ${target}.` }
  if (targets.includes(a)) return { type: 'correct', message: 'Rätt!' }

  if (targets.some((t) => fold(t) === fold(a))) {
    return { type: 'accent', message: `Almost — check the å/ä/ö: ${target}.` }
  }

  const other = (['inf', 'imp', 'pres', 'pret', 'sup', 'part'] as FormKey[]).find(
    (k) => k !== form && expected(verb, k).some((e) => normalize(e) === a),
  )
  if (other) {
    return { type: 'wrongForm', message: `${a} is the ${FORM_NAMES[other]}. The ${fname} is ${target}.` }
  }

  if (form === 'sup' && verb.group === '4' && a === target.replace(/it\b/, 'en')) {
    return {
      type: 'participle',
      message: `${a} is the participle (en ${a} bok). After har/hade use supinum in -it: har ${target}.`,
    }
  }

  const regular = (['1', '2a', '2b', '3'] as RegularGroup[]).map((g) => [g, regularForm(verb, g, form)] as const)
  const hit = regular.find(([, f]) => f === a)?.[0]

  if (verb.group === '4' && hit) {
    const fam = verb.family ? ` (vowel pattern ${verb.family})` : ''
    return {
      type: 'regularized',
      message: `${verb.inf} is a strong/irregular verb${fam} — no regular ending. The ${fname} is ${target}.`,
    }
  }

  if ((verb.group === '2a' && hit === '2b') || (verb.group === '2b' && hit === '2a')) {
    const stem = verb.inf.replace(/a$/, '')
    const why = verb.group === '2b'
      ? `the stem ${stem} ends in a voiceless consonant (k, p, s, t, x), so it takes -te/-t`
      : `the stem ${stem} ends in a voiced sound, so it takes -de/-t`
    return { type: 'voicing', message: `Group ${verb.group}: ${why}. → ${target}` }
  }

  if (hit && verb.group !== '4' && hit !== verb.group) {
    return { type: 'wrongGroup', message: `${verb.inf} is group ${verb.group}, not ${hit}. ${GROUP_RULE[verb.group]} → ${target}` }
  }

  if (verb.group === '3' && dedupe(a) === dedupe(target)) {
    return { type: 'group3', message: `Group 3 verbs double the consonant: -dde in preteritum, -tt in supinum → ${target}` }
  }
  if (verb.group === '3' && (form === 'pret' || form === 'sup') && distance(a, target) <= 2) {
    return { type: 'group3', message: `Group 3 verbs double the consonant: -dde in preteritum, -tt in supinum → ${target}` }
  }

  if (dedupe(a) === dedupe(target)) {
    return { type: 'doubling', message: `Watch the double consonant: ${target}.` }
  }

  if (target.length >= 4 && distance(a, target) === 1) {
    return { type: 'typo', message: `Close — one letter off: ${target}.` }
  }

  return { type: 'unknown', message: `The ${fname} of ${verb.inf} is ${target}.` }
}
