import type { FormKey, Verb } from './types'

/** aa → å, ae → ä, oe → ö (for keyboards without Swedish letters). */
export function applyShortcuts(s: string): string {
  return s
    .replace(/aa/g, 'å').replace(/ae/g, 'ä').replace(/oe/g, 'ö')
    .replace(/A[Aa]/g, 'Å').replace(/A[Ee]/g, 'Ä').replace(/O[Ee]/g, 'Ö')
}

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** All accepted answers, main form first. */
export function expected(verb: Verb, form: FormKey): string[] {
  const main = form === 'part' ? verb.part : verb[form]
  return [main, ...(verb.alt?.[form] ?? [])].filter((x): x is string => !!x)
}

export function isCorrect(answer: string, verb: Verb, form: FormKey): boolean {
  const a = normalize(answer)
  return expected(verb, form).some((e) => normalize(e) === a)
}
