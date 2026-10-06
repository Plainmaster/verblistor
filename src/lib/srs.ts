import type { FormKey } from './types'

export const DAY = 86_400_000
const RELEARN = 10 * 60_000

export type Grade = 'wrong' | 'hard' | 'good'

export interface Card {
  id: string
  ease: number
  interval: number
  due: number
  reps: number
  lapses: number
  last: number
}

export const cardId = (verbId: string, form: FormKey) => `${verbId}:${form}`

/** SM-2-lite scheduling: good grows the interval by ease, hard grows it slowly, wrong resets to a short relearn step. */
export function review(card: Card | undefined, id: string, grade: Grade, now: number): Card {
  const c: Card = card ? { ...card } : { id, ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0, last: now }
  c.last = now
  if (grade === 'wrong') {
    c.reps = 0
    c.lapses++
    c.interval = 0
    c.ease = Math.max(1.3, c.ease - 0.2)
    c.due = now + RELEARN
    return c
  }
  if (grade === 'hard') {
    c.interval = Math.max(1, Math.round(c.interval * 1.2))
    c.ease = Math.max(1.3, c.ease - 0.15)
  } else {
    c.interval = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.interval * c.ease)
    c.ease = Math.min(3, c.ease + 0.05)
  }
  c.reps++
  c.due = now + c.interval * DAY
  return c
}

export const isLeech = (c: Card) => c.lapses >= 4

export function dueCards(cards: Record<string, Card>, now: number): Card[] {
  return Object.values(cards).filter((c) => c.due <= now).sort((a, b) => a.due - b.due)
}
