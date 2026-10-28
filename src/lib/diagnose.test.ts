import { describe, expect, it } from 'vitest'
import { diagnose } from './diagnose'
import type { Verb } from './types'

const base = { en: '', freq: 1, irregular: false } as const
const v = (inf: string, pres: string, pret: string, sup: string, imp: string | null, group: Verb['group']): Verb => ({
  ...base, id: inf, inf, pres, pret, sup, imp, group, irregular: group === '4',
})

const skriva = v('skriva', 'skriver', 'skrev', 'skrivit', 'skriv', '4')
const kopa = v('köpa', 'köper', 'köpte', 'köpt', 'köp', '2b')
const leva = v('leva', 'lever', 'levde', 'levt', 'lev', '2a')
const bo = v('bo', 'bor', 'bodde', 'bott', 'bo', '3')
const mota = v('möta', 'möter', 'mötte', 'mött', 'möt', '2b')
const tala = v('tala', 'talar', 'talade', 'talat', 'tala', '1')
const ga = v('gå', 'går', 'gick', 'gått', 'gå', '4')
const lagga: Verb = { ...v('lägga', 'lägger', 'lade', 'lagt', 'lägg', '2a'), umlaut: true }

describe('diagnose', () => {
  it('correct', () => {
    expect(diagnose('skrev', skriva, 'pret').type).toBe('correct')
  })
  it('umlaut verb with the stem vowel kept', () => {
    const d = diagnose('läggde', lagga, 'pret')
    expect(d.type).toBe('umlaut')
    expect(d.message).toContain('lade')
  })
  it('reads aa, ae and oe as å, ä and ö', () => {
    expect(diagnose('laeste', v('läsa', 'läser', 'läste', 'läst', 'läs', '2b'), 'pret').type).toBe('correct')
    expect(diagnose('gaatt', ga, 'sup').type).toBe('correct')
  })
  it('empty', () => {
    expect(diagnose('  ', skriva, 'pret').type).toBe('empty')
  })
  it('over-regularized strong verb', () => {
    expect(diagnose('skrivade', skriva, 'pret').type).toBe('regularized')
    expect(diagnose('skrivde', skriva, 'pret').type).toBe('regularized')
  })
  it('2a/2b voicing mix-up', () => {
    expect(diagnose('köpde', kopa, 'pret').type).toBe('voicing')
    expect(diagnose('levte', leva, 'pret').type).toBe('voicing')
  })
  it('wrong regular group', () => {
    expect(diagnose('köpade', kopa, 'pret').type).toBe('wrongGroup')
    expect(diagnose('talde', tala, 'pret').type).toBe('wrongGroup')
  })
  it('group 3 needs double consonant', () => {
    expect(diagnose('bode', bo, 'pret').type).toBe('group3')
    expect(diagnose('bot', bo, 'sup').type).toBe('group3')
  })
  it('consonant doubling', () => {
    expect(diagnose('möte', mota, 'pret').type).toBe('doubling')
  })
  it('participle instead of supinum', () => {
    expect(diagnose('skriven', skriva, 'sup').type).toBe('participle')
  })
  it('another form of the same verb', () => {
    expect(diagnose('skrev', skriva, 'sup').type).toBe('wrongForm')
    expect(diagnose('skrev', skriva, 'sup').message).toContain('preteritum')
  })
  it('missing å/ä/ö', () => {
    expect(diagnose('kopte', kopa, 'pret').type).toBe('accent')
    expect(diagnose('gatt', ga, 'sup').type).toBe('accent')
  })
  it('wrong stem vowel in a strong verb', () => {
    expect(diagnose('skrevit', skriva, 'sup').type).toBe('vowel')
  })

  it('misspelled stem with the right ending is a careless slip', () => {
    expect(diagnose('skirvit', skriva, 'sup').type).toBe('typo')
  })
  it('unknown', () => {
    expect(diagnose('hund', skriva, 'pret').type).toBe('unknown')
  })
  it('every message is non-empty', () => {
    for (const a of ['', 'skrev', 'skrivade', 'hund', 'skriven']) {
      expect(diagnose(a, skriva, 'sup').message.length).toBeGreaterThan(0)
    }
  })

  describe('reflexive verbs', () => {
    const vila: Verb = { ...v('vila sig', 'vilar sig', 'vilade sig', 'vilat sig', 'vila dig', '1'), reflexive: true }
    const hora: Verb = { ...v('höra av sig', 'hör av sig', 'hörde av sig', 'hört av sig', 'hör av dig', '2a'), reflexive: true, particle: 'av' }
    it('any pronoun is right without a subject', () => {
      for (const a of ['vilar mig', 'vilar dig', 'vilar sig', 'vilar oss', 'vilar er']) expect(diagnose(a, vila, 'pres').type).toBe('correct')
      expect(diagnose('hörde av mig', hora, 'pret').type).toBe('correct')
    })
    it('the imperative takes dig or er', () => {
      expect(diagnose('vila dig', vila, 'imp').type).toBe('correct')
      expect(diagnose('vila er', vila, 'imp').type).toBe('correct')
      expect(diagnose('vila sig', vila, 'imp')).toMatchObject({ type: 'reflexive', message: expect.stringContaining('vila dig!') })
      expect(diagnose('hör av sig', hora, 'imp').type).toBe('reflexive')
    })
    it('a missing pronoun is pointed out', () => {
      expect(diagnose('vilar', vila, 'pres').type).toBe('reflexive')
    })
    it('the spoken spelling sej is a careless slip', () => {
      expect(diagnose('vilar sej', vila, 'pres').type).toBe('typo')
    })
    it('the verb is judged with the pronoun set aside', () => {
      expect(diagnose('vilde mig', vila, 'pret').type).not.toBe('correct')
      expect(diagnose('hörte av mig', hora, 'pret').type).toBe('voicing')
    })
  })

  describe('s-verbs', () => {
    const sv = (inf: string, pres: string, pret: string, sup: string, group: Verb['group']): Verb => ({ ...v(inf, pres, pret, sup, null, group), sVerb: true })
    it('the -r of other verbs in the present is pointed out', () => {
      expect(diagnose('trivers', sv('trivas', 'trivs', 'trivdes', 'trivts', '2a'), 'pres').type).toBe('sVerb')
      expect(diagnose('finner', sv('finnas', 'finns', 'fanns', 'funnits', '4'), 'pres').type).toBe('sVerb')
      expect(diagnose('hoppar', sv('hoppas', 'hoppas', 'hoppades', 'hoppats', '1'), 'pres').type).toBe('sVerb')
      expect(diagnose('umgår', sv('umgås', 'umgås', 'umgicks', 'umgåtts', '4'), 'pres').type).toBe('sVerb')
    })
  })
})
