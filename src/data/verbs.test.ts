import { describe, expect, it } from 'vitest'
import { classify, conjugate, sForm } from '../lib/conjugate'
import type { Verb } from '../lib/types'
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
    expect(['A1', 'A2', 'B1', 'B2', 'C1']).toContain(v.cefr)
    const base = { inf: first(v.inf), pres: first(v.pres), pret: first(v.pret), sup: first(v.sup), imp: v.imp ? first(v.imp) : null }
    expect(classify(base).group).toBe(v.group)
    expect(v.irregular).toBe(v.group === '4')
    if (v.group !== '4') {
      const gen = conjugate(v.sVerb ? base.inf.slice(0, -1) : base.inf, v.group)
      const want = v.sVerb ? sForm(gen) : gen
      expect([want.pres, want.pret, want.sup]).toEqual([base.pres, base.pret, base.sup])
    }
    if (v.particle) expect(v.inf.split(' ')).toContain(v.particle.split(' ')[0])
    if (v.modal) expect(v.imp).toBeNull()
  })

  it('covers every group and level', () => {
    for (const g of ['1', '2a', '2b', '3', '4']) expect(verbs.some((v) => v.group === g)).toBe(true)
    for (const l of ['A1', 'A2', 'B1', 'B2', 'C1']) expect(verbs.some((v) => v.cefr === l)).toBe(true)
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
  })
})
