export type Group = '1' | '2a' | '2b' | '3' | '4'
export type RegularGroup = Exclude<Group, '4'>
export type FormKey = 'inf' | 'imp' | 'pres' | 'pret' | 'sup' | 'part'
export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface Forms {
  inf: string
  pres: string
  pret: string
  sup: string
  imp: string | null
}

export interface Verb extends Forms {
  id: string
  part?: string
  alt?: Partial<Record<FormKey, string[]>>
  en: string
  group: Group
  irregular: boolean
  family?: string
  cefr: Cefr
  freq: number
  sVerb?: boolean
  particle?: string
  reflexive?: boolean
  modal?: boolean
  note?: string
  ctx?: { subj?: string; rest: string }
}

export const FORM_KEYS: FormKey[] = ['inf', 'imp', 'pres', 'pret', 'sup', 'part']
