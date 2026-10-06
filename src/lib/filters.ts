import type { Cefr, FormKey, Group, Verb } from './types'

export type Focus = 'all' | 'top' | 'irregular' | 'particle' | 'reflexive' | 'sVerb'

export interface Filter {
  groups: Group[]
  levels: Cefr[]
  focus: Focus
  search?: string
}

export const ALL_GROUPS: Group[] = ['1', '2a', '2b', '3', '4']
export const ALL_LEVELS: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1']

/** Approximate mapping to Swedish adult-education courses (Skolverket). */
export const SFI_LABEL: Record<Cefr, string> = {
  A1: 'SFI B', A2: 'SFI C', B1: 'SFI D', B2: 'SAS grund', C1: 'SAS gy',
}

export const DEFAULT_FILTER: Filter = { groups: ALL_GROUPS, levels: ['A1', 'A2'], focus: 'all' }

export const TOP_N = 100
export const isTop = (v: Verb) => v.freq <= TOP_N && !v.particle && !v.reflexive

export interface Preset {
  id: string
  label: string
  hint: string
  filter: Filter
  forms?: FormKey[]
}

export const PRESETS: Preset[] = [
  { id: 'sfi-b', label: 'SFI B start', hint: 'The first verbs, presens and imperativ', filter: { groups: ALL_GROUPS, levels: ['A1'], focus: 'all' }, forms: ['pres', 'imp'] },
  { id: 'sfi-c', label: 'SFI C core', hint: 'A1–A2 verbs, all tenses', filter: { groups: ALL_GROUPS, levels: ['A1', 'A2'], focus: 'all' } },
  { id: 'sfi-d', label: 'SFI D', hint: 'B1 verbs', filter: { groups: ALL_GROUPS, levels: ['B1'], focus: 'all' } },
  { id: 'top', label: 'Top 100', hint: 'The most frequent verbs in Swedish', filter: { groups: ALL_GROUPS, levels: ALL_LEVELS, focus: 'top' } },
  { id: 'irregular', label: 'Irregular A1–B1', hint: 'Strong and irregular verbs', filter: { groups: ['4'], levels: ['A1', 'A2', 'B1'], focus: 'irregular' }, forms: ['pret', 'sup'] },
  { id: '2a2b', label: '2a or 2b?', hint: '-de or -te', filter: { groups: ['2a', '2b'], levels: ALL_LEVELS, focus: 'all' }, forms: ['pret', 'sup'] },
  { id: 'sverb', label: 's-verbs', hint: 'hoppas, trivas, finnas…', filter: { groups: ALL_GROUPS, levels: ALL_LEVELS, focus: 'sVerb' } },
  { id: 'particle', label: 'Particle verbs', hint: 'komma ihåg, ge upp…', filter: { groups: ALL_GROUPS, levels: ALL_LEVELS, focus: 'particle' } },
  { id: 'reflexive', label: 'Reflexive verbs', hint: 'lära sig, sätta sig…', filter: { groups: ALL_GROUPS, levels: ALL_LEVELS, focus: 'reflexive' } },
]

const fold = (s: string) => s.toLowerCase().normalize('NFC')

export function filterVerbs(verbs: Verb[], f: Filter): Verb[] {
  const q = f.search ? fold(f.search.trim()) : ''
  return verbs.filter((v) => {
    if (q) {
      const hay = [v.inf, v.pres, v.pret, v.sup, v.imp ?? '', v.en].map(fold)
      return hay.some((h) => h.includes(q))
    }
    if (!f.groups.includes(v.group) || !f.levels.includes(v.cefr)) return false
    switch (f.focus) {
      case 'top': return isTop(v)
      case 'irregular': return v.irregular
      case 'particle': return !!v.particle
      case 'reflexive': return !!v.reflexive
      case 'sVerb': return !!v.sVerb
      default: return true
    }
  })
}

/** Which of the requested forms this verb actually has. */
export function formsFor(v: Verb, forms: FormKey[]): FormKey[] {
  return forms.filter((f) => (f === 'imp' ? !!v.imp : f === 'part' ? !!v.part : true))
}
