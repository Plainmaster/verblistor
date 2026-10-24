export type Group = '1' | '2a' | '2b' | '3' | '4'
export type RegularGroup = Exclude<Group, '4'>
export type FormKey = 'inf' | 'imp' | 'pres' | 'pret' | 'sup' | 'part'

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
  freq: number
  sVerb?: boolean
  particle?: string
  reflexive?: boolean
  modal?: boolean
  note?: string
  ctx?: { subj?: string; rest: string }
}

export const FORM_KEYS: FormKey[] = ['inf', 'imp', 'pres', 'pret', 'sup', 'part']
