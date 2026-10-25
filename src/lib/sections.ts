import { sectionOf, type Sort } from './filters'
import { FAMILY_ORDER, GROUP_BY_ID, patternLabel, subgroupByFamily } from './groups'
import type { Group, Verb } from './types'

/** Verbs split into the book's sections when sorted by group; one untitled section otherwise. */
export function sections(verbs: Verb[], sort: Sort): { key: string; verbs: Verb[] }[] {
  if (sort !== 'group') return [{ key: '', verbs }]
  const out: { key: string; verbs: Verb[] }[] = []
  for (const v of verbs) {
    const key = sectionOf(v, FAMILY_ORDER)
    if (out.at(-1)?.key === key) out.at(-1)!.verbs.push(v)
    else out.push({ key, verbs: [v] })
  }
  return out
}

export function sectionTitle(key: string): { group: Group; title: string; sub: string } {
  if (key === '4:other') return { group: '4', title: 'Grupp 4', sub: 'oregelbundna verb' }
  if (key === '4:helper') return { group: '4', title: 'Grupp 4', sub: 'hjälpverb' }
  if (key.startsWith('4:')) {
    const s = subgroupByFamily(key.slice(2))
    return { group: '4', title: `Grupp 4 · ${patternLabel(key.slice(2))}`, sub: s ? s.typ : '' }
  }
  if (key.endsWith(':umlaut')) {
    const g = GROUP_BY_ID.get(key.slice(0, -7) as Group)!
    return { group: g.id, title: `${g.name} · omljud`, sub: g.id === '2a' ? 'väljer – valde – valt' : 'sätter – satte – satt' }
  }
  const g = GROUP_BY_ID.get(key as Group)!
  return { group: g.id, title: g.name, sub: g.short }
}
