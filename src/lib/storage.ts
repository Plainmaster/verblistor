import { DEFAULT_FILTER, type Filter } from './filters'
import type { Card } from './srs'
import type { DiagnosisType } from './diagnose'
import type { FormKey } from './types'

export type Mode = 'single' | 'paradigm' | 'group' | 'sentence'
export type Hints = 'inf' | 'random' | 'none'
export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  filter: Filter
  forms: FormKey[]
  mode: Mode
  hints: Hints
  showGroup: boolean
  shortcuts: boolean
  speech: boolean
  dailyGoal: number
  theme: Theme
}

export interface Tally { n: number; ok: number }

export interface Mistake { n: number; last: number; answer: string; type: DiagnosisType }

export interface Progress {
  cards: Record<string, Card>
  /** Keys: g:<group>, f:<form>, l:<level>, e:<error type>. */
  stats: Record<string, Tally>
  /** Keyed by local date YYYY-MM-DD. */
  days: Record<string, Tally>
  mistakes: Record<string, Mistake>
}

export interface Saved {
  version: 1
  settings: Settings
  progress: Progress
}

export const DEFAULT_SETTINGS: Settings = {
  filter: DEFAULT_FILTER,
  forms: ['pres', 'pret', 'sup'],
  mode: 'single',
  hints: 'inf',
  showGroup: true,
  shortcuts: true,
  speech: true,
  dailyGoal: 30,
  theme: 'system',
}

export const EMPTY_PROGRESS: Progress = { cards: {}, stats: {}, days: {}, mistakes: {} }

const KEY = 'verblistor:v1'

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return parse(raw)
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { version: 1, settings: DEFAULT_SETTINGS, progress: EMPTY_PROGRESS }
}

export function save(s: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* quota or private mode: progress stays in memory for this session */
  }
}

/** Parse saved or imported JSON, filling in anything missing from older versions. */
export function parse(raw: string): Saved {
  const data = JSON.parse(raw) as Partial<Saved>
  if (!data || typeof data !== 'object' || !data.progress) throw new Error('This file is not a Verblistor backup.')
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, ...data.settings, filter: { ...DEFAULT_FILTER, ...data.settings?.filter } },
    progress: { ...EMPTY_PROGRESS, ...data.progress },
  }
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
