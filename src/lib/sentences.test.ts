import { describe, expect, it } from 'vitest'
import { headVerb, makeSentence } from './sentences'
import type { Verb } from './types'

const base = { en: '', irregular: true, group: '4', freq: 1 } as const
const skriva: Verb = { ...base, id: 'skriva', inf: 'skriva', pres: 'skriver', pret: 'skrev', sup: 'skrivit', imp: 'skriv', ctx: { rest: 'ett brev' } }
const geUpp: Verb = { ...base, id: 'ge upp', inf: 'ge upp', pres: 'ger upp', pret: 'gav upp', sup: 'gett upp', imp: 'ge upp', particle: 'upp', ctx: { rest: '' } }
const laraSig: Verb = {
  ...base, id: 'lära sig', inf: 'lära sig', pres: 'lär sig', pret: 'lärde sig', sup: 'lärt sig', imp: 'lär dig',
  group: '2a', irregular: false, reflexive: true, ctx: { rest: 'svenska' },
}
const regna: Verb = { ...base, id: 'regna', inf: 'regna', pres: 'regnar', pret: 'regnade', sup: 'regnat', imp: 'regna', group: '1', ctx: { rest: '', subj: 'det' } }

const fixed = (n: number) => () => n
const text = (s: NonNullable<ReturnType<typeof makeSentence>>) => `${s.before}[${s.answer}]${s.after}`

describe('makeSentence', () => {
  it('preteritum uses a past time cue with verb-second word order', () => {
    const s = makeSentence(skriva, 'pret', fixed(0))!
    expect(text(s)).toBe('Igår [skrev] jag ett brev.')
  })

  it('supinum goes after har', () => {
    expect(text(makeSentence(skriva, 'sup', fixed(0))!)).toBe('Jag har redan [skrivit] ett brev.')
  })

  it('infinitive goes after a modal verb', () => {
    expect(text(makeSentence(skriva, 'inf', fixed(0))!)).toBe('Jag vill [skriva] ett brev.')
  })

  it('imperative has no subject', () => {
    expect(text(makeSentence(skriva, 'imp', fixed(0))!)).toBe('[Skriv] ett brev!')
  })

  it('particle goes after the subject when inverted', () => {
    expect(text(makeSentence(geUpp, 'pret', fixed(0))!)).toBe('Igår [gav] jag upp.')
    expect(text(makeSentence(geUpp, 'sup', fixed(0))!)).toBe('Jag har redan [gett] upp.')
  })

  it('reflexive pronoun agrees with the subject', () => {
    expect(text(makeSentence(laraSig, 'pres', fixed(0))!)).toBe('Varje dag [lär] jag mig svenska.')
    expect(text(makeSentence(laraSig, 'imp', fixed(0))!)).toBe('[Lär] dig svenska!')
  })

  it('fixed subjects are used and imperative is skipped for them', () => {
    expect(text(makeSentence(regna, 'pret', fixed(0))!)).toBe('Igår [regnade] det.')
    expect(makeSentence(regna, 'imp', fixed(0))).toBeNull()
  })

  it('returns null without context', () => {
    expect(makeSentence({ ...skriva, ctx: undefined }, 'pres', fixed(0))).toBeNull()
  })
})

describe('headVerb', () => {
  it('reduces a multiword verb to its verb word', () => {
    expect(headVerb(laraSig)).toMatchObject({ inf: 'lära', pres: 'lär', pret: 'lärde', imp: 'lär' })
    expect(headVerb(laraSig).particle).toBeUndefined()
  })
})
