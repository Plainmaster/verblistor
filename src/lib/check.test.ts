import { describe, expect, it } from 'vitest'
import { applyShortcuts, expected, isCorrect, normalize } from './check'
import type { Verb } from './types'

const base = { en: '', irregular: false, freq: 1 } as const

const saga: Verb = {
  ...base, id: 'säga', inf: 'säga', pres: 'säger', pret: 'sa', sup: 'sagt', imp: 'säg',
  alt: { pret: ['sade'] }, group: '4', irregular: true,
}
const geUpp: Verb = {
  ...base, id: 'ge upp', inf: 'ge upp', pres: 'ger upp', pret: 'gav upp', sup: 'gett upp', imp: 'ge upp',
  alt: { sup: ['givit upp'] }, group: '4', irregular: true, particle: 'upp',
}

describe('applyShortcuts', () => {
  it('replaces aa/ae/oe with å/ä/ö', () => {
    expect(applyShortcuts('laesa')).toBe('läsa')
    expect(applyShortcuts('goer')).toBe('gör')
    expect(applyShortcuts('faa')).toBe('få')
    expect(applyShortcuts('AA')).toBe('Å')
  })
})

describe('normalize', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalize('  Ger   Upp ')).toBe('ger upp')
  })
})

describe('isCorrect', () => {
  it('accepts the main form', () => {
    expect(isCorrect('sa', saga, 'pret')).toBe(true)
  })
  it('accepts listed variants', () => {
    expect(isCorrect('sade', saga, 'pret')).toBe(true)
  })
  it('rejects wrong answers', () => {
    expect(isCorrect('sägade', saga, 'pret')).toBe(false)
  })
  it('handles particle verbs with flexible spacing and case', () => {
    expect(isCorrect('Gav  upp', geUpp, 'pret')).toBe(true)
    expect(isCorrect('givit upp', geUpp, 'sup')).toBe(true)
  })
})

describe('expected', () => {
  it('lists main form first, then variants', () => {
    expect(expected(saga, 'pret')).toEqual(['sa', 'sade'])
  })
})
