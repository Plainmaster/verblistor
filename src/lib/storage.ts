import type { Card } from './srs'
import type { DiagnosisType } from './diagnose'
import type { FormKey } from './types'

/** A column of the verb list: a verb form, the English meaning, or the group. */
export type Col = FormKey | 'en' | 'group'
/** A column is shown unless it is set to be written or hidden. Only forms can be written. */
export type ColState = 'show' | 'write' | 'hide'
export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  cols: Partial<Record<Col, 'write' | 'hide'>>
  /** Each row shows one random column as the cue and asks for the other forms. */
  random: boolean
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
  cols: {},
  random: false,
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
  // older versions had a separate practice page with its own column settings; the list starts fully shown
  const settings = { ...DEFAULT_SETTINGS, ...data.settings } as Settings & Record<string, unknown>
  if (settings.showGroup === false) settings.cols = { ...settings.cols, group: 'hide' }
  for (const k of ['mode', 'hints', 'show', 'forms', 'showGroup', 'fold']) delete settings[k]
  return {
    version: 1,
    settings,
    progress: { ...EMPTY_PROGRESS, ...data.progress },
  }
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
