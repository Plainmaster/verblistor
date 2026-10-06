import { describe, expect, it } from 'vitest'
import { DAY, cardId, dueCards, isLeech, review } from './srs'

const now = Date.UTC(2026, 0, 1)

describe('review', () => {
  it('a new card answered correctly is due tomorrow', () => {
    const c = review(undefined, 'sk:pret', 'good', now)
    expect(c.interval).toBe(1)
    expect(c.due).toBe(now + DAY)
    expect(c.reps).toBe(1)
  })

  it('intervals grow 1 → 3 → ~ease×', () => {
    let c = review(undefined, 'x', 'good', now)
    c = review(c, 'x', 'good', c.due)
    expect(c.interval).toBe(3)
    c = review(c, 'x', 'good', c.due)
    expect(c.interval).toBeGreaterThanOrEqual(7)
  })

  it('a wrong answer resets reps, counts a lapse and is due within minutes', () => {
    let c = review(undefined, 'x', 'good', now)
    c = review(c, 'x', 'good', c.due)
    c = review(c, 'x', 'wrong', now)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(1)
    expect(c.due - now).toBeLessThan(DAY)
    expect(c.ease).toBeLessThan(2.5)
  })

  it('hard lowers ease but keeps a positive interval', () => {
    const c = review(review(undefined, 'x', 'good', now), 'x', 'hard', now + DAY)
    expect(c.interval).toBeGreaterThanOrEqual(1)
    expect(c.ease).toBeLessThan(2.5)
  })

  it('ease never drops below 1.3', () => {
    let c = review(undefined, 'x', 'wrong', now)
    for (let i = 0; i < 20; i++) c = review(c, 'x', 'wrong', now)
    expect(c.ease).toBeCloseTo(1.3)
  })
})

describe('helpers', () => {
  it('cardId joins verb and form', () => {
    expect(cardId('skriva', 'pret')).toBe('skriva:pret')
  })

  it('isLeech after 4 lapses', () => {
    let c = review(undefined, 'x', 'wrong', now)
    for (let i = 0; i < 2; i++) c = review(c, 'x', 'wrong', now)
    expect(isLeech(c)).toBe(false)
    c = review(c, 'x', 'wrong', now)
    expect(isLeech(c)).toBe(true)
  })

  it('dueCards returns due cards, most overdue first', () => {
    const a = { ...review(undefined, 'a', 'good', now), due: now - 2 * DAY }
    const b = { ...review(undefined, 'b', 'good', now), due: now - DAY }
    const c = review(undefined, 'c', 'good', now)
    expect(dueCards({ a, b, c }, now).map((x) => x.id)).toEqual(['a', 'b'])
  })
})
