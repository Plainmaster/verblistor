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
  /** Kjellin's omljud: front vowel in the present forms, back vowel after (välja – valde – valt), regular group 2 endings. */
  umlaut?: boolean
  freq: number
  sVerb?: boolean
  particle?: string
  reflexive?: boolean
  modal?: boolean
  note?: string
  /** Forms that exist but are hardly ever used (har bort); shown muted and never asked. */
  rare?: FormKey[]
  ctx?: { subj?: string; rest: string }
  /** For particle verbs: does the particle give the verb a new meaning (ge upp) or extend it (frysa in),
   *  or is the verb not used without it (slappna av)? With a short Swedish explanation. */
  sense?: { kind: SenseKind; text: string }
}

export type SenseKind = 'ny' | 'utvidgad' | 'båda' | 'bara'

export const FORM_KEYS: FormKey[] = ['inf', 'imp', 'pres', 'pret', 'sup', 'part']
