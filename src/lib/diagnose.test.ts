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

describe('diagnose', () => {
  it('correct', () => {
    expect(diagnose('skrev', skriva, 'pret').type).toBe('correct')
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
})
