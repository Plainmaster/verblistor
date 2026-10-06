import { formsFor } from './filters'
import { cardId, type Card } from './srs'
import type { FormKey, Verb } from './types'

export interface Item {
  verb: Verb
  form: FormKey
  kind: 'due' | 'new' | 'practice'
}

/**
 * Choose the next card: due reviews first (most overdue), then new cards in frequency order,
 * then free practice. Verbs in `recent` are avoided when anything else is available.
 */
export function pickNext(
  pool: Verb[], forms: FormKey[], cards: Record<string, Card>, now: number, recent: string[], rng: () => number = Math.random,
): Item | null {
  const all: { verb: Verb; form: FormKey; card?: Card }[] = []
  for (const verb of pool) for (const form of formsFor(verb, forms)) all.push({ verb, form, card: cards[cardId(verb.id, form)] })
  if (!all.length) return null
  const fresh = all.filter((x) => !recent.includes(x.verb.id))
  const candidates = fresh.length ? fresh : all

  const due = candidates.filter((x) => x.card && x.card.due <= now).sort((a, b) => a.card!.due - b.card!.due)
  if (due.length) return { verb: due[0].verb, form: due[0].form, kind: 'due' }

  const unseen = candidates.filter((x) => !x.card)
  if (unseen.length) {
    const minFreq = Math.min(...unseen.map((x) => x.verb.freq))
    const top = unseen.filter((x) => x.verb.freq === minFreq)
    const x = top[Math.floor(rng() * top.length)]
    return { verb: x.verb, form: x.form, kind: 'new' }
  }

  const x = candidates[Math.floor(rng() * candidates.length)]
  return { verb: x.verb, form: x.form, kind: 'practice' }
}
