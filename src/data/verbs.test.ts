import { describe, expect, it } from 'vitest'
import { classify, conjugate, listedGroup2, sForm } from '../lib/conjugate'
import { audioKey } from '../lib/audioKey'
import type { FormKey, Verb } from '../lib/types'
import examples from './examples.json'
import data from './verbs.json'

const verbs = data as Verb[]
const first = (s: string) => s.split(' ')[0]

describe('verbs.json', () => {
  it('has a substantial dataset with unique ids', () => {
    expect(verbs.length).toBeGreaterThan(600)
    expect(new Set(verbs.map((v) => v.id)).size).toBe(verbs.length)
  })

  it.each(verbs.map((v) => [v.id, v] as const))('%s is complete and consistent', (_, v) => {
    expect(v.inf && v.pres && v.pret && v.sup && v.en).toBeTruthy()
    const base = { inf: first(v.inf), pres: first(v.pres), pret: first(v.pret), sup: first(v.sup), imp: v.imp ? first(v.imp) : null }
    expect(classify(base).group).toBe(v.group)
    expect(v.irregular).toBe(v.group === '4')
    if (v.group !== '4' && listedGroup2(base.inf)) {
      expect(base.pret).toMatch(/(de|te|sa)$/)
      expect(base.sup).toMatch(/t$/)
    } else if (v.group !== '4') {
      const gen = conjugate(v.sVerb ? base.inf.slice(0, -1) : base.inf, v.group)
      const want = v.sVerb ? sForm(gen) : gen
      expect([want.pres, want.pret, want.sup]).toEqual([base.pres, base.pret, base.sup])
    }
    if (v.particle) expect(v.inf.split(' ')).toContain(v.particle.split(' ')[0])
    if (v.modal) expect(v.imp).toBeNull()
  })

  it('covers every group', () => {
    for (const g of ['1', '2a', '2b', '3', '4']) expect(verbs.some((v) => v.group === g)).toBe(true)
  })

  it('spot-checks well-known paradigms', () => {
    const get = (id: string) => verbs.find((v) => v.id === id)!
    expect(get('vara')).toMatchObject({ pres: 'är', pret: 'var', sup: 'varit', imp: 'var', group: '4' })
    expect(get('skriva')).toMatchObject({ pret: 'skrev', sup: 'skrivit', family: 'i–e–i' })
    expect(get('köpa')).toMatchObject({ pret: 'köpte', group: '2b' })
    expect(get('bo')).toMatchObject({ pret: 'bodde', group: '3' })
    expect(get('ge upp')).toMatchObject({ pret: 'gav upp', particle: 'upp' })
    expect(get('lära sig')).toMatchObject({ pres: 'lär sig', reflexive: true })
    expect(get('hoppas')).toMatchObject({ pret: 'hoppades', sVerb: true, group: '1' })
    expect(get('välja')).toMatchObject({ pret: 'valde', group: '2a', umlaut: true })
    expect(get('sätta')).toMatchObject({ pret: 'satte', group: '2b', umlaut: true })
    expect(get('göra')).toMatchObject({ pret: 'gjorde', group: '2a', umlaut: true })
    expect(get('skilja')).toMatchObject({ pret: 'skilde', group: '2a' })
    expect(get('skilja').umlaut).toBeUndefined()
    expect(get('besluta')).toMatchObject({ pret: 'beslutade', group: '1' })
    expect(get('delta')).toMatchObject({ pret: 'deltog', group: '4', family: 'a–o–a' })
  })
})

describe('examples.json', () => {
  const byId = new Map(verbs.map((v) => [v.id, v]))
  const cases = Object.entries(examples as Record<string, Partial<Record<FormKey, string>>>)
    .flatMap(([id, ex]) => Object.entries(ex).map(([f, s]) => [`${id} ${f}`, id, f as FormKey, s] as const))

  it.each(cases)('%s marks exactly the form', (_, id, f, s) => {
    const v = byId.get(id)
    expect(v, `${id} is not in verbs.json`).toBeTruthy()
    // the words in braces, read in order, are the form itself: {Kommer} du {ihåg} → kommer ihåg
    const marked = [...s.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).join(' ').toLowerCase()
    const form = v![f]!.replace(/ (mig|dig|sig|oss|er)\b/g, '')
    expect(marked).toBe(form.toLowerCase())
    // the audio bank shortens keys over 100 characters with a hash that audioKey() does not compute
    expect(audioKey(s.replace(/[{}]/g, '')).length).toBeLessThanOrEqual(100)
  })
})
