import { applyShortcuts } from './check'
import type { FormKey, Group, Verb } from './types'

/** 'strong' = group 4 verbs in a named vowel pattern; 'irregular' = group 4 verbs outside them, except the helper verbs;
 *  'strong:<pattern>' = one vowel pattern ('strong:other' is the old name for 'irregular'). */
export type Kind = 'all' | 'strong' | 'irregular' | 'helper' | 'umlaut' | `strong:${string}` | 'sVerb' | 'particle' | 'reflexive'
export type Top = 100 | 300 | 0
export type Sort = 'freq' | 'group' | 'abc' | 'mix'

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

/** Everyday verbs SFI students meet first. The Kelly list is based on web text and ranks them too low
 *  (äta 149, sova 269, dricka 303), so they are always part of the first band. */
export const BASIC = new Set([
  'bo', 'må', 'heta', 'äta', 'dricka', 'sova', 'vakna', 'laga', 'handla', 'städa', 'tvätta', 'duscha', 'cykla', 'simma',
  'dansa', 'sjunga', 'lyssna', 'titta', 'prata', 'plugga', 'jobba', 'arbeta', 'träffa', 'ringa', 'betala', 'kosta', 'köpa',
  'hjälpa', 'öppna', 'stänga', 'sitta', 'ligga', 'stå', 'gå', 'åka', 'resa', 'flytta', 'hämta', 'lämna', 'gilla', 'älska',
  'vänta', 'fråga', 'svara', 'glömma', 'läsa', 'skriva', 'tala', 'spela', 'vila', 'leka', 'hyra', 'promenera', 'bära',
  'visa', 'använda', 'stava', 'upprepa', 'måla', 'rita', 'lära sig', 'sätta sig', 'lägga sig', 'tvätta sig',
  'klä på sig', 'klä av sig', 'skynda sig', 'vila sig',
  // s-verbs come early in SFI but rank low or not at all in Kelly (finnas, ses and träffas are missing)
  'finnas', 'hoppas', 'trivas', 'andas', 'ses', 'träffas', 'kännas', 'minnas', 'umgås',
])
export const isTop = (v: Verb) => v.freq <= TOP_N && !v.particle && !v.reflexive

/** The helper verbs in the order SFI teaches them: the modal verbs add a meaning, har and ska carry the tense (har ätit, ska äta),
 *  and brukar, behöver, hinner and orkar also take a bare infinitive (jag brukar cykla). Vara is left out: at SFI level
 *  är is a verb of its own (jag är trött), and the passive (han är född) comes later. */
export const HELPER_TYPES = ['modal', 'tense', 'more'] as const
export type HelperType = (typeof HELPER_TYPES)[number]
const HELPERS: Record<string, HelperType> = {
  ha: 'tense', skola: 'tense',
  kunna: 'modal', vilja: 'modal', måste: 'modal', få: 'modal', böra: 'modal',
  bruka: 'more', behöva: 'more', hinna: 'more', orka: 'more',
}
export const helperType = (v: Verb): HelperType | undefined => HELPERS[v.id] ?? (v.modal ? 'modal' : undefined)
export const isHelper = (v: Verb) => !!helperType(v)
/** The helper verbs with a section of their own in group 4; brukar and hinner stay in their groups. */
export const isAuxiliary = (v: Verb) => helperType(v) === 'tense' || helperType(v) === 'modal'

/** Auxiliaries that are just as often verbs of their own: as auxiliary, then on their own. */
export const ALSO_MAIN: Record<string, [string, string]> = {
  kunna: ['Jag kan simma.', 'Jag kan svenska.'],
  få: ['Får jag gå nu?', 'Jag fick ett brev.'],
}

const fold = (s: string) => s.toLowerCase().normalize('NFC')
const GROUP_ORDER = Object.fromEntries(ALL_GROUPS.map((g, i) => [g, i]))

/** `families` are the named vowel patterns; verbs in group 4 outside them count as 'strong:other'. */
export function filterVerbs(verbs: Verb[], f: Filter, families: Set<string> = new Set()): Verb[] {
  if (f.ids?.length) {
    const set = new Set(f.ids)
    return verbs.filter((v) => set.has(v.id))
  }
  const q = f.search ? fold(f.search.trim()) : ''
  const qs = [...new Set([q, fold(applyShortcuts(q))])]
  const byFreq = [...verbs].sort((a, b) => a.freq - b.freq)
  const allowed = f.top ? new Set(byFreq.slice(0, f.top).map((v) => v.id)) : null
  // the everyday verbs belong to every band, so 300 vanligaste always includes Grundverb
  if (allowed) for (const id of BASIC) allowed.add(id)
  return verbs.filter((v) => {
    if (q) {
      const hay = [v.inf, v.pres, v.pret, v.sup, v.imp ?? '', v.en].map(fold)
      return hay.some((h) => qs.some((x) => h.includes(x)))
    }
    if (!f.groups.includes(v.group)) return false
    if (allowed && !allowed.has(v.id)) return false
    const named = v.group === '4' && !!v.family && families.has(v.family)
    if (f.kind.startsWith('strong:')) {
      const fam = f.kind.slice(7)
      if (v.group !== '4') return false
      return fam === 'other' ? !named && !isAuxiliary(v) : v.family === fam
    }
    switch (f.kind) {
      case 'strong': return v.group === '4' && (families.size ? named : true)
      case 'irregular': return v.group === '4' && !named && !isAuxiliary(v)
      case 'helper': return isHelper(v)
      case 'umlaut': return !!v.umlaut
      case 'particle': return !!v.particle
      case 'reflexive': return !!v.reflexive
      case 'sVerb': return !!v.sVerb
      default: return true
    }
  })
}

/** The section a verb goes under when sorted by group: its group (umlaut verbs after the rest),
 *  and in group 4 its vowel pattern, then the irregular verbs, then the helper verbs. */
export function sectionOf(v: Verb, families: string[] = []): string {
  if (v.group !== '4') return v.umlaut ? `${v.group}:umlaut` : v.group
  if (isAuxiliary(v)) return '4:helper'
  return v.family && families.includes(v.family) ? `4:${v.family}` : '4:other'
}

/** 'group' is the book's order: group by group, group 4 split by vowel pattern, A–Ö within each.
 *  'mix' is a shuffle that stays the same for the same seed, so the rows keep their place while you write. */
export function sortVerbs(verbs: Verb[], sort: Sort, families: string[] = [], seed = 1): Verb[] {
  const r = [...verbs]
  const abc = (a: Verb, b: Verb) => a.inf.localeCompare(b.inf, 'sv')
  if (sort === 'abc') return r.sort(abc)
  if (sort === 'mix') {
    const hash = (id: string) => {
      let h = seed * 2654435761
      for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
      return h >>> 0
    }
    return r.map((v) => [hash(v.id), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v)
  }
  if (sort === 'group') {
    const sub = (v: Verb) => {
      if (v.group !== '4') return v.umlaut ? 1 : 0
      if (isAuxiliary(v)) return families.length + 1
      const i = v.family ? families.indexOf(v.family) : -1
      return i < 0 ? families.length : i
    }
    return r.sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || sub(a) - sub(b) || abc(a, b))
  }
  return r.sort((a, b) => a.freq - b.freq)
}

/** Which of the requested forms this verb actually has in use; rare forms (har bort) are left out. */
export function formsFor(v: Verb, forms: FormKey[]): FormKey[] {
  return forms.filter((f) => (f === 'imp' ? !!v.imp : f === 'part' ? !!v.part : true) && !v.rare?.includes(f))
}

const KIND_PARAM: Record<string, string> = {
  sVerb: 's-verb', particle: 'partikel', reflexive: 'reflexiva', strong: 'starka', irregular: 'oregelbundna', helper: 'hjalpverb', umlaut: 'omljud',
}
const PARAM_KIND = Object.fromEntries(Object.entries(KIND_PARAM).map(([k, v]) => [v, k]))

/** Filter and sort <-> URL query, so a selection can be shared as a link. Defaults are left out. */
export function toParams(f: Filter, sort: Sort): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.ids?.length) p.ord = f.ids.join(',')
  if (f.groups.length !== ALL_GROUPS.length) p.grupp = f.groups.join(',')
  if (f.top !== DEFAULT_FILTER.top) p.topp = f.top ? String(f.top) : 'alla'
  if (f.kind !== 'all') p.typ = f.kind.startsWith('strong:') ? `starka:${f.kind.slice(7)}` : KIND_PARAM[f.kind]
  if (f.search) p.sok = f.search
  if (sort !== 'freq') p.sort = sort === 'abc' ? 'a-o' : sort === 'mix' ? 'blandat' : 'grupp'
  return p
}

export function fromParams(p: URLSearchParams): { filter: Filter; sort: Sort } {
  const groups = p.get('grupp')?.split(',').filter((g): g is Group => (ALL_GROUPS as string[]).includes(g))
  const topp = p.get('topp')
  const typ = p.get('typ') ?? ''
  const kind: Kind = typ === 'starka:other' ? 'irregular' : typ.startsWith('starka:') ? `strong:${typ.slice(7)}` : (PARAM_KIND[typ] as Kind) ?? 'all'
  const sort = p.get('sort')
  return {
    filter: {
      groups: groups?.length ? groups : ALL_GROUPS,
      top: topp === 'alla' ? 0 : topp === '300' ? 300 : 100,
      kind,
      search: p.get('sok') ?? undefined,
      ids: p.get('ord')?.split(',').filter(Boolean),
    },
    sort: sort === 'a-o' ? 'abc' : sort === 'grupp' ? 'group' : sort === 'blandat' ? 'mix' : 'freq',
  }
}
