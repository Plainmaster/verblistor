import type { FormKey, Verb } from './types'

export const SENTENCE_FORMS: FormKey[] = ['pres', 'pret', 'sup', 'inf', 'imp']

const PRES_CUES = ['Varje dag', 'Nu', 'Ofta', 'Ibland']
const PRET_CUES = ['Igår', 'I förra veckan', 'För två år sedan']
const SUP_ADVERBS = ['redan', 'aldrig', 'ofta']
const MODALS = ['vill', 'ska', 'måste', 'kan']
const SUBJECTS = ['jag', 'du', 'han', 'hon', 'vi', 'ni', 'de']
const REFLEXIVE: Record<string, string> = { jag: 'mig', du: 'dig', vi: 'oss', ni: 'er' }

export interface Sentence {
  before: string
  answer: string
  after: string
  /** The time word or auxiliary that signals the tense. */
  cue: string
}

const first = (s: string) => s.split(' ')[0]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const pick = <T,>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)]

/** The verb reduced to its finite word: lära sig → lära/lär/lärde…, ge upp → ge/ger/gav… */
export function headVerb(v: Verb): Verb {
  const alt = v.alt
    ? Object.fromEntries(Object.entries(v.alt).map(([k, xs]) => [k, (xs ?? []).map(first)]))
    : undefined
  return {
    ...v,
    inf: first(v.inf), pres: first(v.pres), pret: first(v.pret), sup: first(v.sup),
    imp: v.imp ? first(v.imp) : null, part: undefined, alt, particle: undefined, reflexive: undefined,
  }
}

/** Build a cloze sentence whose time word or auxiliary signals which form fills the gap. */
export function makeSentence(v: Verb, form: FormKey, rng: () => number = Math.random): Sentence | null {
  if (!v.ctx || v.modal) return null
  const fixedSubj = v.ctx.subj
  const subj = fixedSubj ?? pick(SUBJECTS, rng)
  const refl = form === 'imp' ? 'dig' : REFLEXIVE[subj] ?? 'sig'
  // particle and pronoun keep the order of the infinitive: tar av sig, känner igen sig
  const tail = [...v.inf.split(' ').slice(1).map((w) => (w === 'sig' ? refl : w)), v.ctx.rest].filter(Boolean).join(' ')
  const end = (mark: string) => (tail ? ` ${tail}${mark}` : mark)
  const h = headVerb(v)

  switch (form) {
    case 'pres': {
      const cue = pick(PRES_CUES, rng)
      return { before: `${cue} `, answer: h.pres, after: ` ${subj}${end('.')}`, cue }
    }
    case 'pret': {
      const cue = pick(PRET_CUES, rng)
      return { before: `${cue} `, answer: h.pret, after: ` ${subj}${end('.')}`, cue }
    }
    case 'sup': {
      const adv = pick(SUP_ADVERBS, rng)
      return { before: `${cap(subj)} har ${adv} `, answer: h.sup, after: end('.'), cue: 'har' }
    }
    case 'inf': {
      const modal = pick(MODALS, rng)
      return { before: `${cap(subj)} ${modal} `, answer: h.inf, after: end('.'), cue: modal }
    }
    case 'imp': {
      if (fixedSubj || !h.imp) return null
      return { before: '', answer: cap(h.imp), after: end('!'), cue: '!' }
    }
    default:
      return null
  }
}
