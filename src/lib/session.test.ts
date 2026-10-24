import { describe, expect, it } from 'vitest'
import { pickNext } from './session'
import { DAY, review } from './srs'
import type { Verb } from './types'

const now = Date.UTC(2026, 0, 10)
const mk = (id: string, freq: number): Verb => ({
  id, inf: id, pres: id + 'r', pret: id + 'de', sup: id + 't', imp: id, en: '', group: '1', irregular: false, freq,
})
const pool = [mk('tala', 3), mk('titta', 1), mk('vänta', 2)]

describe('pickNext', () => {
  it('starts with the most frequent new card', () => {
    expect(pickNext(pool, ['pret'], {}, now, [], () => 0)).toMatchObject({ verb: { id: 'titta' }, form: 'pret', kind: 'new' })
  })

  it('prefers due cards over new ones', () => {
    const c = { ...review(undefined, 'vänta:pret', 'good', now - 3 * DAY), due: now - DAY }
    expect(pickNext(pool, ['pret'], { 'vänta:pret': c }, now, [], () => 0)).toMatchObject({ verb: { id: 'vänta' }, kind: 'due' })
  })

  it('does not repeat a recently shown verb when alternatives exist', () => {
    expect(pickNext(pool, ['pret'], {}, now, ['titta'], () => 0)?.verb.id).toBe('vänta')
  })

  it('falls back to free practice when everything is learned and not due', () => {
    const cards = Object.fromEntries(pool.map((v) => [`${v.id}:pret`, review(undefined, `${v.id}:pret`, 'good', now)]))
    expect(pickNext(pool, ['pret'], cards, now, [], () => 0)).toMatchObject({ kind: 'practice' })
  })

  it('returns null for an empty pool', () => {
    expect(pickNext([], ['pret'], {}, now, [], () => 0)).toBeNull()
  })
})
