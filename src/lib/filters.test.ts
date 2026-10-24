import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTER, filterVerbs, formsFor, fromParams, isTop, sortVerbs, toParams, type Filter } from './filters'
import type { Verb } from './types'
import data from '../data/verbs.json'

const verbs = data as Verb[]
const all: Filter = { ...DEFAULT_FILTER, top: 0 }

describe('filterVerbs', () => {
  it('default filter returns the 100 most frequent verbs', () => {
    const r = filterVerbs(verbs, DEFAULT_FILTER)
    expect(r.length).toBe(100)
    expect(r.map((v) => v.id)).toContain('vara')
  })

  it('filters by group', () => {
    const r = filterVerbs(verbs, { ...all, groups: ['3'] })
    expect(r.length).toBeGreaterThan(5)
    expect(r.every((v) => v.group === '3')).toBe(true)
  })

  it('kind=strong keeps only group 4', () => {
    expect(filterVerbs(verbs, { ...all, kind: 'strong' }).every((v) => v.group === '4')).toBe(true)
  })

  it('kind=strong:<pattern> keeps one vowel pattern', () => {
    const r = filterVerbs(verbs, { ...all, kind: 'strong:i–e–i' })
    expect(r.length).toBeGreaterThan(2)
    expect(r.every((v) => v.family === 'i–e–i')).toBe(true)
  })

  it('kind=particle keeps only particle verbs', () => {
    expect(filterVerbs(verbs, { ...all, kind: 'particle' }).every((v) => v.particle)).toBe(true)
  })

  it('search matches Swedish and English', () => {
    expect(filterVerbs(verbs, { ...all, search: 'skriv' }).map((v) => v.id)).toContain('skriva')
    expect(filterVerbs(verbs, { ...all, search: 'to write' }).map((v) => v.id)).toContain('skriva')
  })

  it('a hand-picked list overrides the other filters', () => {
    const r = filterVerbs(verbs, { ...DEFAULT_FILTER, groups: ['1'], ids: ['skriva', 'bo'] })
    expect(r.map((v) => v.id).sort()).toEqual(['bo', 'skriva'])
  })
})

describe('sortVerbs', () => {
  it('sorts by group, then frequency', () => {
    const r = sortVerbs(filterVerbs(verbs, DEFAULT_FILTER), 'group')
    expect(r[0].group).toBe('1')
    expect(r[r.length - 1].group).toBe('4')
  })
})

describe('URL params', () => {
  it('round-trips a filter', () => {
    const f: Filter = { groups: ['2a', '2b'], top: 0, kind: 'strong:i–a–u', search: 'gå', ids: ['gå', 'se'] }
    const p = new URLSearchParams(toParams(f, 'abc'))
    expect(fromParams(p)).toEqual({ filter: f, sort: 'abc' })
  })

  it('leaves defaults out of the URL', () => {
    expect(toParams(DEFAULT_FILTER, 'freq')).toEqual({})
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
