import type { Card } from './srs'
import type { DiagnosisType } from './diagnose'
import type { FormKey } from './types'

export type Mode = 'table' | 'single' | 'sentence'
export type Hints = 'inf' | 'random' | 'en'
export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  forms: FormKey[]
  mode: Mode
  hints: Hints
  showGroup: boolean
  shortcuts: boolean
  speech: boolean
  theme: Theme
}

export interface Tally { n: number; ok: number }

export interface Mistake { n: number; last: number; answer: string; type: DiagnosisType }

export interface Progress {
  cards: Record<string, Card>
  /** Keys: g:<group>, f:<form>, e:<error type>. */
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
  forms: ['pres', 'pret', 'sup'],
  mode: 'table',
  hints: 'inf',
  showGroup: true,
  shortcuts: true,
  speech: true,
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
  if (!data || typeof data !== 'object' || !data.progress) throw new Error('Filen är ingen säkerhetskopia från Verblistor.')
  const settings = { ...DEFAULT_SETTINGS, ...data.settings }
  if (!['table', 'single', 'sentence'].includes(settings.mode)) settings.mode = DEFAULT_SETTINGS.mode
  if (!['inf', 'random', 'en'].includes(settings.hints)) settings.hints = DEFAULT_SETTINGS.hints
  return {
    version: 1,
    settings,
    progress: { ...EMPTY_PROGRESS, ...data.progress },
  }
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
