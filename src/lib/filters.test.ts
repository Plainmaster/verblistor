import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTER, PRESETS, filterVerbs, formsFor, isTop } from './filters'
import type { Verb } from './types'
import data from '../data/verbs.json'

const verbs = data as Verb[]

describe('filterVerbs', () => {
  it('default filter returns a non-empty pool', () => {
    expect(filterVerbs(verbs, DEFAULT_FILTER).length).toBeGreaterThan(50)
  })

  it('filters by group and level', () => {
    const r = filterVerbs(verbs, { ...DEFAULT_FILTER, groups: ['3'], levels: ['A1', 'A2', 'B1', 'B2', 'C1'] })
    expect(r.length).toBeGreaterThan(5)
    expect(r.every((v) => v.group === '3')).toBe(true)
  })

  it('focus=irregular keeps only group 4', () => {
    const r = filterVerbs(verbs, { ...DEFAULT_FILTER, focus: 'irregular' })
    expect(r.every((v) => v.irregular)).toBe(true)
  })

  it('focus=particle keeps only particle verbs', () => {
    const all = { ...DEFAULT_FILTER, levels: DEFAULT_FILTER.levels, focus: 'particle' as const }
    expect(filterVerbs(verbs, all).every((v) => v.particle)).toBe(true)
  })

  it('search matches Swedish and English', () => {
    const all = { ...DEFAULT_FILTER, levels: ['A1', 'A2', 'B1', 'B2', 'C1'] as Verb['cefr'][] }
    expect(filterVerbs(verbs, { ...all, search: 'skriv' }).map((v) => v.id)).toContain('skriva')
    expect(filterVerbs(verbs, { ...all, search: 'to write' }).map((v) => v.id)).toContain('skriva')
  })

  it('every preset yields verbs', () => {
    for (const p of PRESETS) expect(filterVerbs(verbs, p.filter).length, p.id).toBeGreaterThan(0)
  })
})

describe('formsFor', () => {
  it('skips missing imperative and participle', () => {
    const kunna = verbs.find((v) => v.id === 'kunna')!
    expect(formsFor(kunna, ['imp', 'pret', 'part'])).toEqual(['pret'])
  })
})

describe('isTop', () => {
  it('flags frequent single-word verbs only', () => {
    expect(isTop(verbs.find((v) => v.id === 'vara')!)).toBe(true)
    expect(isTop(verbs.find((v) => v.id === 'ge upp')!)).toBe(false)
  })
})
