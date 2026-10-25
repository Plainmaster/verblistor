import { describe, expect, it } from 'vitest'
import { BASIC, DEFAULT_FILTER, filterVerbs, formsFor, fromParams, isTop, sortVerbs, toParams, type Filter } from './filters'
import type { Verb } from './types'
import data from '../data/verbs.json'

const verbs = data as Verb[]
const all: Filter = { ...DEFAULT_FILTER, top: 0 }

describe('filterVerbs', () => {
  it('default filter returns the 100 most frequent verbs plus the basic everyday verbs', () => {
    const ids = filterVerbs(verbs, DEFAULT_FILTER).map((v) => v.id)
    expect(ids.length).toBeGreaterThan(100)
    for (const id of ['vara', 'bo', 'må', 'äta', 'sova']) expect(ids).toContain(id)
  })

  it('every basic verb exists in the data', () => {
    const all = new Set(verbs.map((v) => v.id))
    expect([...BASIC].filter((id) => !all.has(id))).toEqual([])
  })

  it('filters by group', () => {
    const r = filterVerbs(verbs, { ...all, groups: ['3'] })
    expect(r.length).toBeGreaterThan(5)
    expect(r.every((v) => v.group === '3')).toBe(true)
  })

  it('kind=strong keeps only group 4', () => {
    expect(filterVerbs(verbs, { ...all, kind: 'strong' }).every((v) => v.group === '4')).toBe(true)
  })

  it('kind=strong and kind=irregular split group 4 by vowel pattern', () => {
    const fams = new Set(['i–e–i', 'i–a–u'])
    const strong = filterVerbs(verbs, { ...all, kind: 'strong' }, fams)
    const irregular = filterVerbs(verbs, { ...all, kind: 'irregular' }, fams)
    expect(strong.every((v) => v.group === '4' && fams.has(v.family!))).toBe(true)
    expect(irregular.every((v) => v.group === '4' && !fams.has(v.family ?? ''))).toBe(true)
    const helpers = filterVerbs(verbs, { ...all, kind: 'helper' }, fams)
    expect(strong.length + irregular.length + helpers.length).toBe(verbs.filter((v) => v.group === '4').length)
  })

  it('kind=helper keeps the modal verbs, ha and vara, out of the irregular ones', () => {
    const fams = new Set(['i–e–i', 'i–a–u'])
    const ids = filterVerbs(verbs, { ...all, kind: 'helper' }, fams).map((v) => v.id)
    for (const id of ['kunna', 'skola', 'vilja', 'måste', 'böra', 'ha', 'vara']) expect(ids).toContain(id)
    expect(filterVerbs(verbs, { ...all, kind: 'irregular' }, fams).map((v) => v.id)).not.toContain('kunna')
  })

  it('kind=umlaut keeps the umlaut verbs in group 2', () => {
    const r = filterVerbs(verbs, { ...all, kind: 'umlaut' })
    expect(r.map((v) => v.id)).toContain('välja')
    expect(r.every((v) => v.group === '2a' || v.group === '2b')).toBe(true)
  })

  it('kind=strong:<pattern> keeps one vowel pattern', () => {
    const r = filterVerbs(verbs, { ...all, kind: 'strong:i–e–i' })
    expect(r.length).toBeGreaterThan(2)
    expect(r.every((v) => v.family === 'i–e–i')).toBe(true)
  })

  it('kind=particle keeps only particle verbs', () => {
    expect(filterVerbs(verbs, { ...all, kind: 'particle' }).every((v) => v.particle)).toBe(true)
  })

  it('search tries aa/ae/oe as å/ä/ö without breaking English', () => {
    expect(filterVerbs(verbs, { ...all, search: 'laesa' }).map((v) => v.id)).toContain('läsa')
    expect(filterVerbs(verbs, { ...all, search: 'to see' }).map((v) => v.id)).toContain('se')
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
  it('sorts by group, then vowel pattern, then A–Ö', () => {
    const r = sortVerbs(filterVerbs(verbs, DEFAULT_FILTER), 'group', ['i–e–i'])
    expect(r[0].group).toBe('1')
    expect(r[r.length - 1].group).toBe('4')
    const g1 = r.filter((v) => v.group === '1').map((v) => v.inf)
    expect(g1).toEqual([...g1].sort((a, b) => a.localeCompare(b, 'sv')))
    const g4 = r.filter((v) => v.group === '4')
    expect(g4[0].family).toBe('i–e–i')
  })
})

describe('URL params', () => {
  it('round-trips a filter', () => {
    const f: Filter = { groups: ['2a', '2b'], top: 0, kind: 'strong:i–a–u', search: 'gå', ids: ['gå', 'se'] }
    const p = new URLSearchParams(toParams(f, 'abc'))
    expect(fromParams(p)).toEqual({ filter: f, sort: 'abc' })
  })

  it('reads the old starka:other link as irregular', () => {
    expect(fromParams(new URLSearchParams('typ=starka:other')).filter.kind).toBe('irregular')
    expect(toParams({ ...DEFAULT_FILTER, kind: 'irregular' }, 'freq')).toEqual({ typ: 'oregelbundna' })
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
