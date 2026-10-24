import type { FormKey, Group, Verb } from './types'

/** 'strong' = group 4; 'strong:<pattern>' = one vowel pattern; 'strong:other' = irregular without a pattern. */
export type Kind = 'all' | 'strong' | `strong:${string}` | 'sVerb' | 'particle' | 'reflexive'
export type Top = 100 | 300 | 0
export type Sort = 'freq' | 'group' | 'abc'

export interface Filter {
  groups: Group[]
  top: Top
  kind: Kind
  search?: string
  /** A hand-picked list of verb ids; overrides the other filters. */
  ids?: string[]
}

export const ALL_GROUPS: Group[] = ['1', '2a', '2b', '3', '4']
export const DEFAULT_FILTER: Filter = { groups: ALL_GROUPS, top: 100, kind: 'all' }

export const TOP_N = 100
export const isTop = (v: Verb) => v.freq <= TOP_N && !v.particle && !v.reflexive

const fold = (s: string) => s.toLowerCase().normalize('NFC')
const GROUP_ORDER = Object.fromEntries(ALL_GROUPS.map((g, i) => [g, i]))

/** `families` are the named vowel patterns; verbs in group 4 outside them count as 'strong:other'. */
export function filterVerbs(verbs: Verb[], f: Filter, families: Set<string> = new Set()): Verb[] {
  if (f.ids?.length) {
    const set = new Set(f.ids)
    return verbs.filter((v) => set.has(v.id))
  }
  const q = f.search ? fold(f.search.trim()) : ''
  const byFreq = [...verbs].sort((a, b) => a.freq - b.freq)
  const allowed = f.top ? new Set(byFreq.slice(0, f.top).map((v) => v.id)) : null
  return verbs.filter((v) => {
    if (q) {
      const hay = [v.inf, v.pres, v.pret, v.sup, v.imp ?? '', v.en].map(fold)
      return hay.some((h) => h.includes(q))
    }
    if (!f.groups.includes(v.group)) return false
    if (allowed && !allowed.has(v.id)) return false
    if (f.kind.startsWith('strong:')) {
      const fam = f.kind.slice(7)
      if (v.group !== '4') return false
      return fam === 'other' ? !(v.family && families.has(v.family)) : v.family === fam
    }
    switch (f.kind) {
      case 'strong': return v.group === '4'
      case 'particle': return !!v.particle
      case 'reflexive': return !!v.reflexive
      case 'sVerb': return !!v.sVerb
      default: return true
    }
  })
}

export function sortVerbs(verbs: Verb[], sort: Sort): Verb[] {
  const r = [...verbs]
  if (sort === 'abc') return r.sort((a, b) => a.inf.localeCompare(b.inf, 'sv'))
  if (sort === 'group') return r.sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || a.freq - b.freq)
  return r.sort((a, b) => a.freq - b.freq)
}

/** Which of the requested forms this verb actually has. */
export function formsFor(v: Verb, forms: FormKey[]): FormKey[] {
  return forms.filter((f) => (f === 'imp' ? !!v.imp : f === 'part' ? !!v.part : true))
}

const KIND_PARAM: Record<string, string> = { sVerb: 's-verb', particle: 'partikel', reflexive: 'reflexiva', strong: 'starka' }
const PARAM_KIND = Object.fromEntries(Object.entries(KIND_PARAM).map(([k, v]) => [v, k]))

/** Filter and sort <-> URL query, so a selection can be shared as a link. Defaults are left out. */
export function toParams(f: Filter, sort: Sort): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.ids?.length) p.ord = f.ids.join(',')
  if (f.groups.length !== ALL_GROUPS.length) p.grupp = f.groups.join(',')
  if (f.top !== DEFAULT_FILTER.top) p.topp = f.top ? String(f.top) : 'alla'
  if (f.kind !== 'all') p.typ = f.kind.startsWith('strong:') ? `starka:${f.kind.slice(7)}` : KIND_PARAM[f.kind]
  if (f.search) p.sok = f.search
  if (sort !== 'freq') p.sort = sort === 'abc' ? 'a-o' : 'grupp'
  return p
}

export function fromParams(p: URLSearchParams): { filter: Filter; sort: Sort } {
  const groups = p.get('grupp')?.split(',').filter((g): g is Group => (ALL_GROUPS as string[]).includes(g))
  const topp = p.get('topp')
  const typ = p.get('typ') ?? ''
  const kind: Kind = typ.startsWith('starka:') ? `strong:${typ.slice(7)}` : (PARAM_KIND[typ] as Kind) ?? 'all'
  const sort = p.get('sort')
  return {
    filter: {
      groups: groups?.length ? groups : ALL_GROUPS,
      top: topp === 'alla' ? 0 : topp === '300' ? 300 : 100,
      kind,
      search: p.get('sok') ?? undefined,
      ids: p.get('ord')?.split(',').filter(Boolean),
    },
    sort: sort === 'a-o' ? 'abc' : sort === 'grupp' ? 'group' : 'freq',
  }
}
