import { describe, expect, it } from 'vitest'
import { classify, conjugate, segments, sForm } from './conjugate'

describe('conjugate', () => {
  it('group 1: -ar / -ade / -at', () => {
    expect(conjugate('tala', '1')).toEqual({ inf: 'tala', pres: 'talar', pret: 'talade', sup: 'talat', imp: 'tala' })
  })

  it('group 2a: -er / -de / -t', () => {
    expect(conjugate('leva', '2a')).toEqual({ inf: 'leva', pres: 'lever', pret: 'levde', sup: 'levt', imp: 'lev' })
    expect(conjugate('stänga', '2a').pret).toBe('stängde')
  })

  it('group 2a: stems ending in r take no -er in presens', () => {
    expect(conjugate('köra', '2a')).toEqual({ inf: 'köra', pres: 'kör', pret: 'körde', sup: 'kört', imp: 'kör' })
  })

  it('group 2a: double consonant is simplified before -de/-t', () => {
    expect(conjugate('glömma', '2a')).toEqual({ inf: 'glömma', pres: 'glömmer', pret: 'glömde', sup: 'glömt', imp: 'glöm' })
    expect(conjugate('känna', '2a')).toMatchObject({ pret: 'kände', sup: 'känt', imp: 'känn' })
  })

  it('group 2a: consonant + d merges with the ending', () => {
    expect(conjugate('använda', '2a')).toMatchObject({ pres: 'använder', pret: 'använde', sup: 'använt' })
  })

  it('group 2a: vowel + d gives -dde / -tt', () => {
    expect(conjugate('betyda', '2a')).toMatchObject({ pret: 'betydde', sup: 'betytt' })
  })

  it('group 2b: -er / -te / -t', () => {
    expect(conjugate('köpa', '2b')).toEqual({ inf: 'köpa', pres: 'köper', pret: 'köpte', sup: 'köpt', imp: 'köp' })
    expect(conjugate('läsa', '2b')).toMatchObject({ pret: 'läste', sup: 'läst' })
  })

  it('group 2b: vowel + t gives -tte / -tt', () => {
    expect(conjugate('möta', '2b')).toMatchObject({ pret: 'mötte', sup: 'mött' })
  })

  it('group 2b: consonant + t merges with the ending', () => {
    expect(conjugate('lyfta', '2b')).toMatchObject({ pret: 'lyfte', sup: 'lyft' })
  })

  it('group 3: -r / -dde / -tt', () => {
    expect(conjugate('bo', '3')).toEqual({ inf: 'bo', pres: 'bor', pret: 'bodde', sup: 'bott', imp: 'bo' })
  })
})

describe('sForm', () => {
  it('turns an active paradigm into an s-verb paradigm', () => {
    expect(sForm(conjugate('hoppa', '1'))).toEqual({ inf: 'hoppas', pres: 'hoppas', pret: 'hoppades', sup: 'hoppats', imp: null })
    expect(sForm(conjugate('triva', '2a'))).toEqual({ inf: 'trivas', pres: 'trivs', pret: 'trivdes', sup: 'trivts', imp: null })
  })
})

describe('classify', () => {
  const cases: [string, string, string, string, string | null, string][] = [
    ['tala', 'talar', 'talade', 'talat', 'tala', '1'],
    ['leva', 'lever', 'levde', 'levt', 'lev', '2a'],
    ['köra', 'kör', 'körde', 'kört', 'kör', '2a'],
    ['använda', 'använder', 'använde', 'använt', 'använd', '2a'],
    ['köpa', 'köper', 'köpte', 'köpt', 'köp', '2b'],
    ['möta', 'möter', 'mötte', 'mött', 'möt', '2b'],
    ['bo', 'bor', 'bodde', 'bott', 'bo', '3'],
    ['skriva', 'skriver', 'skrev', 'skrivit', 'skriv', '4'],
    ['göra', 'gör', 'gjorde', 'gjort', 'gör', '2a'],
    ['välja', 'väljer', 'valde', 'valt', 'välj', '2a'],
    ['fortsätta', 'fortsätter', 'fortsatte', 'fortsatt', 'fortsätt', '2b'],
    ['hoppas', 'hoppas', 'hoppades', 'hoppats', null, '1'],
    ['trivas', 'trivs', 'trivdes', 'trivts', null, '2a'],
  ]
  it.each(cases)('%s → group %s', (inf, pres, pret, sup, imp, group) => {
    expect(classify({ inf, pres, pret, sup, imp }).group).toBe(group)
  })

  it('marks group 4 as irregular and s-verbs as sVerb', () => {
    expect(classify({ inf: 'skriva', pres: 'skriver', pret: 'skrev', sup: 'skrivit', imp: 'skriv' }).irregular).toBe(true)
    expect(classify({ inf: 'hoppas', pres: 'hoppas', pret: 'hoppades', sup: 'hoppats', imp: null }).sVerb).toBe(true)
    expect(classify({ inf: 'tala', pres: 'talar', pret: 'talade', sup: 'talat', imp: 'tala' }).irregular).toBe(false)
  })

  it('counts umlaut verbs as regular group 2', () => {
    expect(classify({ inf: 'välja', pres: 'väljer', pret: 'valde', sup: 'valt', imp: 'välj' })).toMatchObject({ irregular: false, umlaut: true })
    expect(classify({ inf: 'säga', pres: 'säger', pret: 'sa', sup: 'sagt', imp: 'säg' })).toMatchObject({ group: '2a', umlaut: true })
    expect(classify({ inf: 'skriva', pres: 'skriver', pret: 'skrev', sup: 'skrivit', imp: 'skriv' }).umlaut).toBeUndefined()
  })

  it('ignores a missing imperative (modal verbs)', () => {
    expect(classify({ inf: 'kunna', pres: 'kan', pret: 'kunde', sup: 'kunnat', imp: null }).group).toBe('4')
  })
})

describe('segments', () => {
  const text = (s: ReturnType<typeof segments>) => s.map((x) => (x.kind === 'stem' ? x.text : `[${x.kind}:${x.text}]`)).join('')

  // the stem is the imperative (Kjellin): tala, ring, bo, skriv
  it('highlights what is added to the stem', () => {
    expect(text(segments('talar', 'tala', '1'))).toBe('tala[end:r]')
    expect(text(segments('talade', 'tala', '1'))).toBe('tala[end:de]')
    expect(text(segments('ringer', 'ringa', '2a'))).toBe('ring[end:er]')
    expect(text(segments('köpte', 'köpa', '2b'))).toBe('köp[end:te]')
    expect(text(segments('glömde', 'glömma', '2a'))).toBe('glöm[end:de]')
    expect(text(segments('bodde', 'bo', '3'))).toBe('bo[end:dde]')
  })

  it('leaves the -s of s-verbs out of the stem', () => {
    expect(text(segments('hoppades', 'hoppas', '1'))).toBe('hoppa[end:des]')
    expect(text(segments('trivdes', 'trivas', '2a'))).toBe('triv[end:des]')
  })

  it('marks the infinitive -a only where it is added to the stem', () => {
    expect(text(segments('tala', 'tala', '1'))).toBe('tala')
    expect(text(segments('ringa', 'ringa', '2a'))).toBe('ring[end:a]')
  })

  it('marks vowel changes in strong verbs', () => {
    expect(text(segments('skrev', 'skriva', '4'))).toBe('skr[change:e]v')
    expect(text(segments('skrivit', 'skriva', '4'))).toBe('skriv[end:it]')
    expect(text(segments('drack', 'dricka', '4'))).toBe('dr[change:a]ck')
  })

  it('takes the imperative as the stem of strong verbs', () => {
    expect(text(segments('ta', 'ta', '4', 'ta'))).toBe('ta')
    expect(text(segments('tar', 'ta', '4', 'ta'))).toBe('ta[end:r]')
  })
})
