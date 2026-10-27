import { conjugate } from './conjugate'
import { applyShortcuts, expected, normalize } from './check'
import type { FormKey, RegularGroup, Verb } from './types'

export type DiagnosisType =
  | 'correct' | 'empty' | 'accent' | 'wrongForm' | 'participle' | 'regularized'
  | 'voicing' | 'wrongGroup' | 'group3' | 'doubling' | 'vowel' | 'umlaut' | 'typo' | 'unknown'

export interface Diagnosis {
  type: DiagnosisType
  message: string
}

export const FORM_NAMES: Record<FormKey, string> = {
  inf: 'infinitiv', imp: 'imperativ', pres: 'presens', pret: 'preteritum', sup: 'supinum', part: 'perfekt particip',
}

export const ERROR_LABELS: Record<DiagnosisType, string> = {
  correct: 'Rätt', empty: 'Inget svar', accent: 'Å, ä eller ö saknas', wrongForm: 'Fel tempus',
  participle: 'Particip i stället för supinum', regularized: 'Starkt verb med regelbunden ändelse', voicing: '2a eller 2b',
  wrongGroup: 'Fel grupp', group3: 'Grupp 3: -dde/-tt', doubling: 'Dubbelteckning',
  vowel: 'Fel vokal', umlaut: 'Omljud', typo: 'Slarvfel', unknown: 'Övrigt',
}

/** Careless slips: the grammar is right, the spelling is not. Shown as feedback but kept out of "Mina fel". */
export const isCareless = (t: DiagnosisType) => t === 'accent' || t === 'typo'

const VOWELS = 'aeiouyåäö'
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
  '1': 'Grupp 1: imperativen slutar på -a och får -r, -de, -t',
  '2a': 'Grupp 2a: imperativen slutar på en konsonant och får -er, -de, -t',
  '2b': 'Grupp 2b: imperativen slutar på p, k, s, t eller x och får -er, -te, -t',
  '3': 'Grupp 3: korta verb som får -r, -dde, -tt',
}

export function diagnose(answer: string, verb: Verb, form: FormKey): Diagnosis {
  const raw = normalize(answer)
  const targets = expected(verb, form).map(normalize)
  const target = targets[0] ?? ''
  const fname = FORM_NAMES[form]

  if (!raw) return { type: 'empty', message: `${fname[0].toUpperCase()}${fname.slice(1)} av ${verb.inf} är ${target}.` }
  // aa, ae and oe stand for å, ä and ö when the keyboard has no Swedish letters
  const typed = normalize(applyShortcuts(raw))
  if (targets.includes(raw) || targets.includes(typed)) return { type: 'correct', message: 'Rätt!' }
  const a = /[åäö]/.test(raw) ? raw : typed

  if (targets.some((t) => fold(t) === fold(a))) {
    return { type: 'accent', message: `Nästan! Kolla å, ä och ö: ${target}.` }
  }

  const other = (['inf', 'imp', 'pres', 'pret', 'sup', 'part'] as FormKey[]).find(
    (k) => k !== form && expected(verb, k).some((e) => normalize(e) === a),
  )
  if (other) {
    return { type: 'wrongForm', message: `${a} är ${FORM_NAMES[other]}. ${fname[0].toUpperCase()}${fname.slice(1)} är ${target}.` }
  }

  if (form === 'sup' && verb.group === '4' && a === target.replace(/it\b/, 'en')) {
    return {
      type: 'participle',
      message: `${a} är particip (en ${a} bok). Efter har och hade används supinum på -it: har ${target}.`,
    }
  }

  const regular = (['1', '2a', '2b', '3'] as RegularGroup[]).map((g) => [g, regularForm(verb, g, form)] as const)
  const hit = regular.find(([, f]) => f === a)?.[0]

  if (verb.umlaut && hit) {
    return {
      type: 'umlaut',
      message: `${verb.inf} har omljud: vokalen byts i preteritum och supinum (${verb.inf} – ${verb.pret} – ${verb.sup}). Ändelserna är regelbundna. → ${target}`,
    }
  }

  if (verb.group === '4' && hit) {
    const fam = verb.family ? ` (vokalmönster ${verb.family})` : ''
    return {
      type: 'regularized',
      message: `${verb.inf} är ett starkt eller oregelbundet verb${fam} och får ingen regelbunden ändelse. ${fname[0].toUpperCase()}${fname.slice(1)} är ${target}.`,
    }
  }

  if ((verb.group === '2a' && hit === '2b') || (verb.group === '2b' && hit === '2a')) {
    const imp = verb.imp ?? verb.inf.replace(/a$/, '')
    const why = verb.group === '2b'
      ? `imperativen ${imp}! slutar på p, k, s, t eller x (Pakistanregeln) och får därför -te`
      : `imperativen ${imp}! slutar inte på p, k, s, t eller x och får därför -de`
    return { type: 'voicing', message: `Grupp ${verb.group}: ${why}. → ${target}` }
  }

  if (hit && verb.group !== '4' && hit !== verb.group) {
    return { type: 'wrongGroup', message: `${verb.inf} är grupp ${verb.group}, inte ${hit}. ${GROUP_RULE[verb.group]} → ${target}` }
  }

  if (verb.group === '3' && dedupe(a) === dedupe(target)) {
    return { type: 'group3', message: `Verb i grupp 3 dubbeltecknar: -dde i preteritum, -tt i supinum → ${target}` }
  }
  if (verb.group === '3' && (form === 'pret' || form === 'sup') && distance(a, target) <= 2) {
    return { type: 'group3', message: `Verb i grupp 3 dubbeltecknar: -dde i preteritum, -tt i supinum → ${target}` }
  }

  if (dedupe(a) === dedupe(target)) {
    return { type: 'doubling', message: `Se upp med dubbelteckningen: ${target}.` }
  }

  if ((verb.group === '4' || verb.umlaut) && a.length === target.length) {
    const diff = [...a].map((c, i) => [c, target[i]]).filter(([x, y]) => x !== y)
    if (diff.length === 1 && VOWELS.includes(diff[0][0]) && VOWELS.includes(diff[0][1])) {
      const fam = verb.family ? ` Vokalmönstret är ${verb.family}.` : ''
      return { type: 'vowel', message: `Fel vokal: ${target}.${fam}` }
    }
  }

  // the ending is right and only the stem is misspelled
  if (target.length >= 4 && distance(a, target) <= 2 && a.slice(-2) === target.slice(-2)) {
    return { type: 'typo', message: `Slarvfel? Ändelsen är rätt, men stavningen inte: ${target}.` }
  }

  return { type: 'unknown', message: `${fname[0].toUpperCase()}${fname.slice(1)} av ${verb.inf} är ${target}.` }
}
