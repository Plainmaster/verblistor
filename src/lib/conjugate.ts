import type { Forms, Group, RegularGroup } from './types'

const VOWELS = 'aeiouyåäö'
const isVowel = (c: string | undefined) => !!c && VOWELS.includes(c)

/** Stem of an -a verb with a final double m/n simplified (glömm → glöm), as used before -de/-t. */
function shortStem(stem: string): string {
  return /(mm|nn)$/.test(stem) ? stem.slice(0, -1) : stem
}

/** Generate the regular paradigm for an active verb in the given group. */
export function conjugate(inf: string, group: RegularGroup): Forms {
  if (group === '1') {
    return { inf, pres: inf + 'r', pret: inf + 'de', sup: inf + 't', imp: inf }
  }
  if (group === '3') {
    return { inf, pres: inf + 'r', pret: inf + 'dde', sup: inf + 'tt', imp: inf }
  }
  const stem = inf.endsWith('a') ? inf.slice(0, -1) : inf
  const pres = stem.endsWith('r') ? stem : stem + 'er'
  const imp = stem.endsWith('mm') ? stem.slice(0, -1) : stem
  const b = shortStem(stem)
  const last = b.at(-1)
  const beforeLast = b.at(-2)
  let pret: string
  let sup: string
  if (group === '2a') {
    if (last === 'd' && !isVowel(beforeLast)) {
      pret = b + 'e'
      sup = b.slice(0, -1) + 't'
    } else if (last === 'd') {
      pret = b + 'de'
      sup = b.slice(0, -1) + 'tt'
    } else {
      pret = b + 'de'
      sup = b + 't'
    }
  } else if (last === 't' && isVowel(beforeLast)) {
    pret = b + 'te'
    sup = b + 't'
  } else if (last === 't') {
    pret = b + 'e'
    sup = b
  } else {
    pret = b + 'te'
    sup = b + 't'
  }
  return { inf, pres, pret, sup, imp }
}

/** Turn an active paradigm into its s-form (deponent) paradigm: hoppa → hoppas. */
export function sForm(f: Forms): Forms {
  const pres = f.pres.endsWith('ar') ? f.pres.slice(0, -1) + 's' : f.pres.endsWith('er') ? f.pres.slice(0, -2) + 's' : f.pres + 's'
  return { inf: f.inf + 's', pres, pret: f.pret + 's', sup: f.sup + 's', imp: null }
}

const REGULAR: RegularGroup[] = ['1', '3', '2a', '2b']

function matches(gen: Forms, f: Forms): boolean {
  return gen.pres === f.pres && gen.pret === f.pret && gen.sup === f.sup && (f.imp === null || gen.imp === f.imp)
}

/** Decide the conjugation group from the actual forms. Anything not produced by a regular rule is group 4. */
export function classify(f: Forms): { group: Group; irregular: boolean; sVerb: boolean } {
  const sVerb = f.inf.endsWith('s') && f.pret.endsWith('s') && f.sup.endsWith('s')
  for (const g of REGULAR) {
    if (g !== '3' && !f.inf.endsWith(sVerb ? 'as' : 'a')) continue
    if (g === '3' && (sVerb ? f.inf.endsWith('as') : f.inf.endsWith('a'))) continue
    const gen = sVerb ? sForm(conjugate(f.inf.slice(0, -1), g)) : conjugate(f.inf, g)
    if (matches(gen, f)) return { group: g, irregular: false, sVerb }
  }
  return { group: '4', irregular: true, sVerb }
}

export type Segment = { text: string; kind: 'stem' | 'end' | 'change' }

/** The part of the infinitive that endings attach to: tala → tal, bo → bo. */
export function stemOf(inf: string, group: Group): string {
  const word = inf.split(' ')[0]
  if (group === '3') return word
  return word.endsWith('a') ? word.slice(0, -1) : word
}

/**
 * Split a form into stem / ending / changed-vowel segments relative to the verb stem,
 * via a character LCS: extra characters inside the stem span are vowel changes, extra characters after it are endings.
 */
export function segments(form: string, inf: string, group: Group): Segment[] {
  const [word, ...restWords] = form.split(' ')
  const stem = stemOf(inf, group)
  const n = word.length
  const m = stem.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = word[i] === stem[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const kinds: Segment['kind'][] = []
  let i = 0
  let j = 0
  while (i < n) {
    if (j < m && word[i] === stem[j]) {
      kinds.push('stem')
      i++
      j++
    } else if (j < m && dp[i][j + 1] >= dp[i + 1][j]) {
      j++
    } else {
      kinds.push(j < m ? 'change' : 'end')
      i++
    }
  }
  const out: Segment[] = []
  kinds.forEach((k, idx) => {
    const prev = out.at(-1)
    if (prev && prev.kind === k) prev.text += word[idx]
    else out.push({ text: word[idx], kind: k })
  })
  if (restWords.length) out.push({ text: ' ' + restWords.join(' '), kind: 'stem' })
  return out
}
