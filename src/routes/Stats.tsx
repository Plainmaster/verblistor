import { useRef, useState } from 'react'
import { LineBadge, Segmented } from '../components/bits'
import { ERROR_LABELS, FORM_NAMES, type DiagnosisType } from '../lib/diagnose'
import { ALL_LEVELS, SFI_LABEL } from '../lib/filters'
import { GROUPS, VERBS } from '../lib/groups'
import { today, type Tally, type Theme } from '../lib/storage'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

const pct = (t?: Tally) => (t && t.n ? Math.round((t.ok / t.n) * 100) : null)

export default function Stats() {
  const { progress, settings, update } = useStore()
  const total = Object.values(progress.days).reduce((a, d) => ({ n: a.n + d.n, ok: a.ok + d.ok }), { n: 0, ok: 0 })

  const byVerb = new Map<string, number[]>()
  for (const c of Object.values(progress.cards)) {
    const id = c.id.split(':')[0]
    byVerb.set(id, [...(byVerb.get(id) ?? []), c.interval])
  }
  const mastered = new Set([...byVerb].filter(([, iv]) => iv.every((i) => i >= 7)).map(([id]) => id))

  return (
    <div className="grid gap-10">
      <h1 className="m-0 text-3xl font-extrabold tracking-tight">Progress</h1>

      <section aria-label="Summary" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile value={total.n} label="answers" />
        <Tile value={pct(total) === null ? '–' : `${pct(total)}%`} label="correct" />
        <Tile value={streak(progress.days)} label="day streak" />
        <Tile value={mastered.size} label={`of ${VERBS.length} verbs solid`} title="Every practised form of the verb has an interval of a week or more" />
      </section>

      {total.n === 0 ? (
        <p className="m-0 text-muted">Answer a few verbs on the Öva page and your progress shows up here.</p>
      ) : (
        <>
          <section aria-labelledby="by-group">
            <h2 id="by-group" className="m-0 mb-3 text-xl font-extrabold">Correct by group</h2>
            <Bars rows={GROUPS.map((g) => ({ key: g.id, label: <><LineBadge group={g.id} /> <span className="text-muted text-sm">{g.short}</span></>, t: progress.stats[`g:${g.id}`], group: g.id }))} />
          </section>

          <section aria-labelledby="by-form">
            <h2 id="by-form" className="m-0 mb-3 text-xl font-extrabold">Correct by form</h2>
            <Bars rows={(['inf', 'pres', 'pret', 'sup', 'imp', 'part'] as FormKey[]).map((f) => ({ key: f, label: FORM_NAMES[f], t: progress.stats[`f:${f}`] }))} />
          </section>

          <section aria-labelledby="by-level">
            <h2 id="by-level" className="m-0 mb-3 text-xl font-extrabold">Verbs practised by level</h2>
            <ul className="m-0 p-0 list-none grid gap-2">
              {ALL_LEVELS.map((l) => {
                const all = VERBS.filter((v) => v.cefr === l)
                const seen = all.filter((v) => byVerb.has(v.id)).length
                return (
                  <li key={l} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3">
                    <span className="font-bold">{l} <span className="font-normal text-muted text-sm">{SFI_LABEL[l]}</span></span>
                    <Meter value={seen / all.length} title={`${seen} of ${all.length} verbs practised`} />
                    <span className="text-sm tabular-nums text-right">{seen}/{all.length}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          <ErrorTypes stats={progress.stats} />
          <Activity days={progress.days} />
        </>
      )}

      <Settings theme={settings.theme} goal={settings.dailyGoal} onTheme={(theme) => update({ theme })} onGoal={(dailyGoal) => update({ dailyGoal })} />
    </div>
  )
}

function Tile({ value, label, title }: { value: number | string; label: string; title?: string }) {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-rule p-4" title={title}>
      <p className="m-0 text-3xl font-extrabold tabular-nums leading-none">{value}</p>
      <p className="m-0 mt-1.5 text-sm text-muted">{label}</p>
    </div>
  )
}

function Meter({ value, title, group }: { value: number; title: string; group?: string }) {
  return (
    <div className="h-3 rounded-full bg-sunk overflow-hidden" title={title} data-group={group} role="meter" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={title}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(value * 100, value > 0 ? 2 : 0)}%`, background: group ? 'var(--g)' : 'var(--ink)' }} />
    </div>
  )
}

function Bars({ rows }: { rows: { key: string; label: React.ReactNode; t?: Tally; group?: string }[] }) {
  return (
    <ul className="m-0 p-0 list-none grid gap-2">
      {rows.map((r) => {
        const p = pct(r.t)
        return (
          <li key={r.key} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3">
            <span className="flex items-center gap-2 min-w-0">{r.label}</span>
            <Meter value={(p ?? 0) / 100} group={r.group} title={r.t ? `${r.t.ok} of ${r.t.n} correct` : 'Not practised yet'} />
            <span className="text-sm tabular-nums text-right">{p === null ? <span className="text-muted">–</span> : <>{p}% <span className="text-muted">of {r.t!.n}</span></>}</span>
          </li>
        )
      })}
    </ul>
  )
}

function ErrorTypes({ stats }: { stats: Record<string, Tally> }) {
  const rows = Object.entries(stats)
    .filter(([k]) => k.startsWith('e:'))
    .map(([k, t]) => ({ type: k.slice(2) as DiagnosisType, n: t.n }))
    .sort((a, b) => b.n - a.n)
  if (!rows.length) return null
  const max = rows[0].n
  return (
    <section aria-labelledby="errors">
      <h2 id="errors" className="m-0 mb-1 text-xl font-extrabold">Your most common mistakes</h2>
      <p className="m-0 mb-3 text-muted">Knowing the kind of mistake tells you which rule to look at again.</p>
      <ul className="m-0 p-0 list-none grid gap-2">
        {rows.map((r) => (
          <li key={r.type} className="grid grid-cols-[minmax(0,13rem)_1fr_3rem] items-center gap-3">
            <span>{ERROR_LABELS[r.type]}</span>
            <Meter value={r.n / max} title={`${r.n} mistakes`} />
            <span className="text-sm tabular-nums text-right">{r.n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function streak(days: Record<string, Tally>): number {
  let n = 0
  const d = new Date()
  if (!days[today(d)]) d.setDate(d.getDate() - 1)
  while (days[today(d)]) { n++; d.setDate(d.getDate() - 1) }
  return n
}

/** Last 12 weeks, one cell per day, shaded by number of answers. */
function Activity({ days }: { days: Record<string, Tally> }) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - 83)
  const cells: { key: string; n: number; date: Date }[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = today(d)
    cells.push({ key, n: days[key]?.n ?? 0, date: new Date(d) })
  }
  const step = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : n < 60 ? 3 : 4)
  const shades = ['var(--sunk)', 'color-mix(in srgb, var(--ok) 30%, var(--surface))', 'color-mix(in srgb, var(--ok) 55%, var(--surface))', 'color-mix(in srgb, var(--ok) 80%, var(--surface))', 'var(--ok)']
  const offset = (start.getDay() + 6) % 7
  return (
    <section aria-labelledby="activity">
      <h2 id="activity" className="m-0 mb-3 text-xl font-extrabold">Last 12 weeks</h2>
      <div className="overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max" role="img" aria-label="Answers per day over the last 12 weeks">
          {Array.from({ length: offset }, (_, i) => <span key={`pad${i}`} />)}
          {cells.map((c) => (
            <span
              key={c.key}
              title={`${c.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${c.n} answers`}
              className="size-3.5 rounded-[3px]"
              style={{ background: shades[step(c.n)] }}
            />
          ))}
        </div>
      </div>
      <p className="m-0 mt-2 text-sm text-muted flex items-center gap-1.5">
        Fewer {shades.map((s, i) => <span key={i} className="inline-block size-3 rounded-[3px]" style={{ background: s }} />)} more answers
      </p>
    </section>
  )
}

function Settings({ theme, goal, onTheme, onGoal }: { theme: Theme; goal: number; onTheme: (t: Theme) => void; onGoal: (n: number) => void }) {
  const { exportData, importData, resetProgress } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `verblistor-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Backup saved.')
  }

  const upload = async (f: File) => {
    try {
      importData(await f.text())
      setMsg('Backup restored.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  return (
    <section aria-labelledby="settings" className="grid gap-4 border-t border-rule pt-8">
      <h2 id="settings" className="m-0 text-xl font-extrabold">Settings</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-sm font-bold text-muted">Theme</span>
        <Segmented label="Theme" value={theme} onChange={onTheme} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-sm font-bold text-muted">Daily goal</span>
        <Segmented label="Daily goal" value={String(goal)} onChange={(v) => onGoal(Number(v))} options={['10', '30', '60', '100'].map((v) => ({ value: v, label: `${v} answers` }))} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-sm font-bold text-muted">Your data</span>
        <button type="button" onClick={download} className="h-10 px-4 rounded-xl ring-1 ring-rule bg-surface font-bold hover:bg-sunk">Save backup</button>
        <button type="button" onClick={() => file.current?.click()} className="h-10 px-4 rounded-xl ring-1 ring-rule bg-surface font-bold hover:bg-sunk">Restore backup</button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {confirmReset ? (
          <span className="flex items-center gap-2">
            <span className="text-sm">Erase all progress?</span>
            <button type="button" onClick={() => { resetProgress(); setConfirmReset(false); setMsg('Progress erased.') }} className="h-10 px-4 rounded-xl bg-bad text-white font-bold">Erase</button>
            <button type="button" onClick={() => setConfirmReset(false)} className="h-10 px-4 rounded-xl ring-1 ring-rule font-bold">Keep</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="h-10 px-4 rounded-xl font-bold text-bad hover:bg-sunk">Erase progress</button>
        )}
      </div>
      <p className="m-0 text-sm text-muted" aria-live="polite">
        {msg || 'Progress is stored in this browser only. Save a backup to move it to another device.'}
      </p>
    </section>
  )
}
