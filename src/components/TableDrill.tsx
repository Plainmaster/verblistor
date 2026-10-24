import { useEffect, useMemo, useRef, useState } from 'react'
import { applyShortcuts } from '../lib/check'
import { diagnose, FORM_NAMES, type Diagnosis } from '../lib/diagnose'
import { formsFor } from '../lib/filters'
import type { Hints } from '../lib/storage'
import type { FormKey, Verb } from '../lib/types'
import { useStore } from '../store'
import { LineBadge, Speak, SwedishKeys, Word } from './bits'

const PAGE = 10

/** The original Svenska Verb exercise: a page of verbs, one form given per row, fill in the rest. */
export default function TableDrill({ pool, columns, hints }: { pool: Verb[]; columns: FormKey[]; hints: Hints }) {
  const { settings, record } = useStore()
  const [order, setOrder] = useState(pool)
  const [page, setPage] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState<Record<string, Diagnosis> | null>(null)
  const [total, setTotal] = useState({ n: 0, ok: 0 })
  const first = useRef<HTMLInputElement>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => { setOrder(pool); setPage(0) }, [pool])

  const pages = Math.max(1, Math.ceil(order.length / PAGE))
  const rows = useMemo(() => order.slice(page * PAGE, page * PAGE + PAGE).map((v) => {
    const have = formsFor(v, columns)
    const given = hints === 'en' ? null : hints === 'inf' ? 'inf' : have[Math.floor(Math.random() * have.length)]
    return { v, given, asked: have.filter((f) => f !== given) }
  }), [order, page, columns, hints])

  useEffect(() => {
    setValues({})
    setChecked(null)
    first.current?.focus()
  }, [rows])
  useEffect(() => { if (checked) nextBtn.current?.focus() }, [checked])

  const check = () => {
    if (checked) return
    const res: Record<string, Diagnosis> = {}
    let ok = 0
    let n = 0
    for (const { v, asked } of rows) {
      for (const f of asked) {
        const k = `${v.id}:${f}`
        const d = diagnose(values[k] ?? '', v, f)
        res[k] = d
        // empty cells show the answer but do not count, so skipping a row does not fill up "Mina fel"
        if (d.type === 'empty') continue
        record(v, f, d.type === 'correct' ? 'good' : d.type === 'accent' ? 'hard' : 'wrong', d, values[k] ?? '')
        n++
        if (d.type === 'correct') ok++
      }
    }
    setChecked(res)
    setTotal((t) => ({ n: t.n + n, ok: t.ok + ok }))
  }
  const go = (p: number) => setPage(((p % pages) + pages) % pages)
  const shuffle = () => { setOrder((o) => [...o].sort(() => Math.random() - 0.5)); setPage(0) }

  if (!pool.length) {
    return <div className="rounded-3xl bg-surface ring-1 ring-rule p-6"><p className="m-0 text-lg font-bold">Välj några verb i listan först.</p></div>
  }

  const answered = checked ? Object.values(checked).filter((d) => d.type !== 'empty') : []
  const pageScore = answered.filter((d) => d.type === 'correct').length
  const cols = { '--cols': `minmax(7rem, 1.1fr) repeat(${columns.length}, minmax(0, 1fr))` } as React.CSSProperties
  const firstKey = rows[0]?.asked[0] && `${rows[0].v.id}:${rows[0].asked[0]}`

  return (
    <section aria-label="Tabellövning" className="grid gap-3">
      <form onSubmit={(e) => { e.preventDefault(); check() }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        className="rounded-3xl bg-surface ring-1 ring-rule p-3 sm:p-5">
        <div className="hidden sm:grid sm:[grid-template-columns:var(--cols)] gap-3 px-2 pb-2 text-sm font-bold text-muted" style={cols}>
          <span>engelska</span>
          {columns.map((f) => <span key={f}>{FORM_NAMES[f]}</span>)}
        </div>
        <ol className="m-0 p-0 list-none">
          {rows.map(({ v, given }) => (
            <li key={v.id} className="border-t border-rule first:border-t-0 sm:first:border-t px-2 py-3">
              <div className="grid grid-cols-2 sm:[grid-template-columns:var(--cols)] gap-x-3 gap-y-2 items-end" style={cols}>
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2 min-w-0 self-center">
                  {(checked || settings.showGroup) && <LineBadge group={v.group} />}
                  <span className="text-[0.95rem] leading-tight" lang="en">{v.en}</span>
                  {checked && <Speak text={[v.inf, v.pres, v.pret, v.sup].join(', ')} />}
                </div>
                {columns.map((f) => {
                  const k = `${v.id}:${f}`
                  const missing = f === 'imp' && !v.imp
                  const label = <span className="sm:sr-only block text-xs text-muted">{FORM_NAMES[f]}</span>
                  if (missing) return <div key={f}>{label}<span className="text-muted px-1">–</span></div>
                  if (f === given) return <div key={f}>{label}<span className="block py-1 px-0.5 text-[1.1rem] font-bold" lang="sv">{v[f as 'inf']}</span></div>
                  const d = checked?.[k]
                  return (
                    <label key={f} className="block min-w-0">
                      {label}
                      <input ref={k === firstKey ? first : undefined} className="cell-input" lang="sv" value={values[k] ?? ''} readOnly={!!checked}
                        data-state={d && d.type !== 'empty' ? (d.type === 'correct' ? 'ok' : 'bad') : undefined}
                        aria-label={`${FORM_NAMES[f]} av ${v.en}`}
                        onChange={(e) => setValues((s) => ({ ...s, [k]: settings.shortcuts ? applyShortcuts(e.target.value) : e.target.value }))} />
                      {d && d.type !== 'correct' && <span className={`block pt-0.5 text-[1.05rem] ${d.type === 'empty' ? 'text-muted' : 'font-bold'}`}><Word verb={v} form={f} /></span>}
                    </label>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 px-2 flex flex-wrap items-center justify-between gap-3">
          <SwedishKeys />
          {checked ? (
            <span className="flex items-center gap-3">
              <strong className="display text-xl">{pageScore} av {answered.length} rätt</strong>
              <button ref={nextBtn} type="button" className="btn btn-primary" onClick={() => go(page + 1)}>Nästa sida</button>
            </span>
          ) : (
            <button type="submit" className="btn btn-primary">Rätta</button>
          )}
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span className="flex items-center gap-1">
          <button type="button" className="size-9 rounded-full hover:bg-sunk text-lg" onClick={() => go(page - 1)} aria-label="Föregående sida">‹</button>
          <span className="tabular-nums">Sida {page + 1} av {pages}</span>
          <button type="button" className="size-9 rounded-full hover:bg-sunk text-lg" onClick={() => go(page + 1)} aria-label="Nästa sida">›</button>
          <button type="button" className="ml-2 underline underline-offset-2" onClick={shuffle}>Blanda</button>
        </span>
        <span className="tabular-nums" aria-live="polite">Totalt {total.ok} av {total.n} rätt · Tab hoppar till nästa ruta, Enter rättar</span>
      </div>
    </section>
  )
}
