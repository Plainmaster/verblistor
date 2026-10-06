import type { Forms } from '../src/lib/types'

const lastVowels = (s: string) => s.match(/[aeiouyåäö]+(?=[^aeiouyåäö]*$)/)?.[0] ?? ''

const MERGE: Record<string, string> = {
  'y–ö–u': 'y/u–ö–u',
  'u–ö–u': 'y/u–ö–u',
  'å–o–a': 'a–o–a',
  'a–ö–a': 'a/å–ö–a/å',
  'å–ö–å': 'a/å–ö–a/å',
}

/** Vowel pattern of a strong verb across infinitive, preteritum and supinum, e.g. skriva skrev skrivit → i–e–i. */
export function ablautFamily(f: Forms): string | null {
  const inf = lastVowels(f.inf.replace(/a$/, '')) || lastVowels(f.inf)
  const pret = lastVowels(f.pret.replace(/(de|te)$/, ''))
  const sup = lastVowels(f.sup.replace(/(it|tt|t)$/, ''))
  if (!inf || !pret || !sup) return null
  const key = `${inf}–${pret}–${sup}`
  return MERGE[key] ?? key
}
