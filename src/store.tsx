import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Diagnosis } from './lib/diagnose'
import { cardId, review, type Grade } from './lib/srs'
import { load, parse, save, today, EMPTY_PROGRESS, type Progress, type Saved, type Settings } from './lib/storage'
import type { FormKey, Verb } from './lib/types'

interface Store {
  settings: Settings
  progress: Progress
  update: (patch: Partial<Settings>) => void
  record: (verb: Verb, form: FormKey | 'group', grade: Grade, diagnosis: Diagnosis, answer: string) => void
  resetProgress: () => void
  exportData: () => string
  importData: (raw: string) => void
}

const Ctx = createContext<Store | null>(null)

const bump = (t: Record<string, { n: number; ok: number }>, key: string, ok: boolean) => {
  const cur = t[key] ?? { n: 0, ok: 0 }
  t[key] = { n: cur.n + 1, ok: cur.ok + (ok ? 1 : 0) }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(load)

  useEffect(() => save(state), [state])

  useEffect(() => {
    const t = state.settings.theme
    if (t === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }, [state.settings.theme])

  const update = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const record = useCallback<Store['record']>((verb, form, grade, diagnosis, answer) => {
    setState((s) => {
      const now = Date.now()
      const p = s.progress
      const id = form === 'group' ? `${verb.id}:group` : cardId(verb.id, form)
      const ok = grade === 'good'
      const stats = { ...p.stats }
      bump(stats, `g:${verb.group}`, ok)
      bump(stats, `l:${verb.cefr}`, ok)
      bump(stats, `f:${form}`, ok)
      if (!ok) bump(stats, `e:${diagnosis.type}`, false)
      const days = { ...p.days }
      bump(days, today(), ok)
      const mistakes = { ...p.mistakes }
      if (!ok) {
        const m = mistakes[id]
        mistakes[id] = { n: (m?.n ?? 0) + 1, last: now, answer, type: diagnosis.type }
      }
      return {
        ...s,
        progress: { cards: { ...p.cards, [id]: review(p.cards[id], id, grade, now) }, stats, days, mistakes },
      }
    })
  }, [])

  const value = useMemo<Store>(() => ({
    settings: state.settings,
    progress: state.progress,
    update,
    record,
    resetProgress: () => setState((s) => ({ ...s, progress: EMPTY_PROGRESS })),
    exportData: () => JSON.stringify(state, null, 1),
    importData: (raw) => setState(parse(raw)),
  }), [state, update, record])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
