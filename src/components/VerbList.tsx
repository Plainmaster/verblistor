import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { applyShortcuts } from '../lib/check'
import { diagnose, FORM_NAMES, isCareless, type Diagnosis } from '../lib/diagnose'
import { formsFor, isTop, type Sort } from '../lib/filters'
import { groupLabel, sKind } from '../lib/groups'
import { sections, sectionTitle } from '../lib/sections'
import type { Col, ColState, Settings } from '../lib/storage'
import type { FormKey, Verb } from '../lib/types'
import { useStore } from '../store'
import { LineBadge, PARADIGM, Say, Speak, SwedishKeys } from './bits'

const COLS: Col[] = [...PARADIGM, 'en', 'group']
const NAME = (c: Col) => (c === 'en' ? 'engelska' : c === 'group' ? 'grupp' : FORM_NAMES[c])
const writable = (c: Col): c is FormKey => c !== 'en' && c !== 'group'

type Mode = 'read' | 'practice' | 'random'

/** The column eye: bold for shown, plain for writing, struck through for hidden. */
export function Eye({ state }: { state: ColState }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.15rem] shrink-0" fill="none" stroke="currentColor"
      strokeWidth={state === 'show' ? 2.4 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" fill={state === 'show' ? 'currentColor' : 'none'} />
      {state === 'hide' && <path d="M4 4l16 16" />}
    </svg>
  )
}

function Dice() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.05rem]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      {[[9, 9], [15, 15], [15, 9], [9, 15], [12, 12]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill="currentColor" stroke="none" />)}
    </svg>
  )
}

/** A stable pick per verb and roll, so a row keeps its cue until the dice is thrown again. */
const pick = (id: string, roll: number, n: number) => {
  let h = roll * 2654435761
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return Math.abs(h) % n
}

/** The verb list, which is also the exercise: every column has an eye that shows it, asks for it or hides it,
 *  as when you cover a column of the book with a sheet of paper. Enter checks only what has been written. */
export default function VerbList({ verbs, sort, onOpen }: { verbs: Verb[]; sort: Sort; onOpen: (id: string) => void }) {
  const { settings, update, record } = useStore()
  const { cols, random } = settings
  const [roll, setRoll] = useState(1)
  const [shuffled, setShuffled] = useState<Verb[] | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState<Record<string, Diagnosis>>({})
  // a column just hidden keeps its width until the pointer leaves the header, so the eyes stay under it
  const [held, setHeld] = useState<Col[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const state = (c: Col): ColState => cols[c] ?? 'show'
  const mode: Mode = random ? 'random' : Object.values(cols).includes('write') ? 'practice' : 'read'

  useEffect(() => { setShuffled(null) }, [verbs])
  useEffect(() => { setValues({}); setChecked({}) }, [verbs, roll])

  const list = shuffled ?? verbs
  const rows = useMemo(() => new Map(list.map((v) => {
    // forms the verb lacks (no imperative for kunna) or hardly uses (har bort) are shown, never asked
    const have = formsFor(v, PARADIGM)
    let cue: FormKey | null = null
    if (random) {
      // the cue is always one of the visible Swedish forms; the English, if shown, stays as support
      const pool = have.filter((f) => (cols[f] ?? 'show') !== 'hide')
      cue = pool.length ? pool[pick(v.id, roll, pool.length)] : null
    }
    const asked = have.filter((f) => cols[f] === 'write' && f !== cue)
    return [v.id, { have, cue, asked }] as const
  })), [list, cols, random, roll])

  const keys = list.flatMap((v) => rows.get(v.id)!.asked.map((f) => `${v.id}:${f}`))
  const answered = keys.filter((k) => checked[k] && checked[k].type !== 'empty')
  const score = answered.filter((k) => checked[k].type === 'correct').length
  const done = keys.length > 0 && keys.every((k) => checked[k])

  const inputs = () => [...(formRef.current?.querySelectorAll<HTMLInputElement>('input.cell-input') ?? [])]
  // after checking, go on from where you were to the next empty cell
  const from = useRef(-1)
  useEffect(() => {
    if (from.current < 0) return
    const open = inputs().map((el, i) => [el, i] as const).filter(([el]) => !el.readOnly && !el.value)
    ;(open.find(([, i]) => i > from.current) ?? open[0])?.[0].focus()
  }, [checked])

  const setCols = (next: Settings['cols'], rand = false) => update({ cols: next, random: rand })
  // hidden columns stay hidden when switching mode
  const hidden = () => Object.fromEntries(Object.entries(cols).filter(([, s]) => s === 'hide')) as Settings['cols']
  const setMode = (m: Mode) => {
    if (m === 'read') setCols(hidden())
    else {
      const next = hidden()
      for (const f of PARADIGM) if (next[f] !== 'hide' && (m === 'random' || f !== 'inf')) next[f] = 'write'
      setCols(next, m === 'random')
      if (m === 'random') setRoll((r) => r + 1)
    }
  }
  const cycle = (c: Col) => {
    const s = state(c)
    const next = { ...cols }
    const to: ColState = !writable(c) ? (s === 'hide' ? 'show' : 'hide')
      : random ? (s === 'hide' ? 'write' : 'hide')
        : s === 'show' ? 'write' : s === 'write' ? 'hide' : 'show'
    if (to === 'show') delete next[c]
    else next[c] = to
    setHeld((h) => (to === 'hide' ? [...h, c] : h.filter((x) => x !== c)))
    setCols(next, random)
  }

  const check = () => {
    const res = { ...checked }
    const spelled: Record<string, string> = {}
    for (const v of list) {
      for (const f of rows.get(v.id)!.asked) {
        const k = `${v.id}:${f}`
        // only what has been written is checked; empty cells stay open to fill in
        if (res[k] || !values[k]?.trim()) continue
        const d = diagnose(values[k], v, f)
        res[k] = d
        // a right answer typed as aer is shown as är
        if (d.type === 'correct') spelled[k] = applyShortcuts(values[k])
        record(v, f, d.type === 'correct' ? 'good' : isCareless(d.type) ? 'hard' : 'wrong', d, values[k])
      }
    }
    from.current = inputs().indexOf(document.activeElement as HTMLInputElement)
    setChecked(res)
    setValues((s) => ({ ...s, ...spelled }))
  }
  // show the answers to the cells left empty, without counting them as mistakes
  const reveal = () => {
    const res = { ...checked }
    for (const v of list) for (const f of rows.get(v.id)!.asked) res[`${v.id}:${f}`] ??= diagnose('', v, f)
    setChecked(res)
  }
  const restart = () => { from.current = -1; setRoll((r) => r + 1) }
  const shuffle = () => { setShuffled([...verbs].sort(() => Math.random() - 0.5)); restart() }

  if (!verbs.length) return null

  // every track is minmax(length, fr), so a column folding away glides instead of jumping
  const width = (c: Col) => state(c) === 'hide' && !held.includes(c) ? 'minmax(2.25rem, 0fr)'
    : c === 'group' ? 'minmax(4.25rem, 0fr)' : c === 'en' ? 'minmax(6rem, 1fr)' : c === 'imp' ? 'minmax(0rem, 0.85fr)' : 'minmax(0rem, 1fr)'
  const grid = { '--cols': `2.25rem ${COLS.map(width).join(' ')} 2.25rem` } as React.CSSProperties
  const blocks = sections(list, shuffled ? 'freq' : sort)

  const eye = (c: Col, wide: boolean) => {
    const s = state(c)
    const label = s === 'show' ? 'visas' : s === 'write' ? 'skriv' : 'dold'
    return (
      <button key={c} type="button" onClick={() => cycle(c)} title={`${NAME(c)}: ${label}`} aria-label={`${NAME(c)}, ${label}`}
        className={`h-7 inline-flex items-center gap-1.5 min-w-0 sc text-left ${s === 'show' ? 'text-ink font-bold' : s === 'write' ? 'text-ink' : 'text-muted hover:text-ink'}`}>
        <Eye state={s} />
        {(s !== 'hide' || wide || held.includes(c)) && <span className="truncate">{c === 'group' && !wide ? '' : NAME(c)}</span>}
      </button>
    )
  }

  const modeBtn = (m: Mode, label: React.ReactNode, title: string) => (
    <button type="button" onClick={() => setMode(m)} title={title} aria-pressed={mode === m}
      className={`h-9 px-3 inline-flex items-center gap-1.5 border-[1.5px] -ml-[1.5px] first:ml-0 first:rounded-l-[2px] last:rounded-r-[2px] ${mode === m ? 'bg-ink text-paper border-ink relative z-10' : 'border-rule-strong hover:bg-sunk'}`}>
      {label}
    </button>
  )

  const covered = (key?: string) => <div key={key} className="hidden sm:block" aria-hidden />

  const cell = (v: Verb, f: FormKey) => {
    const r = rows.get(v.id)!
    const s: ColState = random && state(f) !== 'hide' ? (r.cue === f ? 'show' : 'write') : state(f)
    const mobileFirst = f === 'inf' ? 'max-sm:order-[-2] max-sm:col-span-2' : ''
    if (s === 'hide') return covered(f)
    const k = `${v.id}:${f}`
    const label = <span className={`sm:sr-only block sc text-[0.85rem] text-muted ${f === 'inf' && s === 'show' ? 'sr-only' : ''}`}>{FORM_NAMES[f]}</span>
    if (!r.asked.includes(f)) {
      const strong = mode !== 'read' && s === 'show'
      return (
        <div key={f} className={`min-w-0 ${mobileFirst}`}>{label}
          {f === 'inf' && s === 'show' ? (
            <span className="block">
              <button type="button" onClick={() => onOpen(v.id)} className={`text-left text-lg hover:underline underline-offset-4 ${v.rare?.includes('inf') ? 'rare' : isTop(v) || strong ? 'font-bold' : ''}`} lang="sv">{v.inf}</button>
              {v.sVerb && <span className="ml-2 text-sm italic text-muted">{sKind(v)}</span>}
            </span>
          ) : (
            <span className={`block text-[1.05rem] ${strong ? 'font-bold' : ''}`}>
              {v[f as 'inf'] ? <Say verb={v} form={f} /> : <span className="text-muted">–</span>}
            </span>
          )}
        </div>
      )
    }
    const d = checked[k]
    return (
      <label key={f} className={`block min-w-0 ${mobileFirst}`}>
        {label}
        <input className="cell-input" lang="sv" value={values[k] ?? ''} readOnly={!!d}
          data-state={d && d.type !== 'empty' ? (d.type === 'correct' ? 'ok' : 'bad') : undefined}
          aria-label={`${FORM_NAMES[f]} av ${v.en}`}
          onChange={(e) => setValues((x) => ({ ...x, [k]: e.target.value }))} />
        {d && d.type !== 'correct' && <span className={`block pt-0.5 text-[1.05rem] ${d.type === 'empty' ? 'text-muted' : 'font-bold'}`}><Say verb={v} form={f} /></span>}
      </label>
    )
  }

  return (
    <section aria-label="Verblista" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex" role="group" aria-label="Läge">
          {modeBtn('read', 'Läs', 'Alla former visas')}
          {modeBtn('practice', 'Öva', 'Infinitiven visas, du skriver de andra formerna')}
          {modeBtn('random', <><Dice /> Slumpa</>, 'Varje rad visar en slumpad form av de synliga. Klicka igen för nya luckor.')}
        </div>
        <span className="flex items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1" aria-hidden><Eye state="show" /> visas</span>
          <span className="inline-flex items-center gap-1" aria-hidden><Eye state="write" /> skriv</span>
          <span className="inline-flex items-center gap-1" aria-hidden><Eye state="hide" /> dold</span>
        </span>
      </div>

      <div className="sm:hidden flex flex-wrap gap-x-4 gap-y-1 text-[1rem]" aria-label="Kolumner">
        {COLS.map((c) => eye(c, true))}
      </div>

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); check() }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        className="panel">
        <div className="hidden sm:grid sm:[grid-template-columns:var(--cols)] transition-[grid-template-columns] duration-300 gap-3 px-3 py-1.5 text-[1.02rem] border-b-[1.5px] border-ink items-center" style={grid}
          onPointerLeave={() => setHeld([])} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld([]) }}>
          <span className="text-right text-muted">#</span>
          {COLS.map((c) => eye(c, false))}
          <span><span className="sr-only">Lyssna</span></span>
        </div>
        {blocks.map(({ key, verbs: part }) => (
          <Fragment key={key || 'all'}>
            {key && (() => {
              const s = sectionTitle(key)
              return (
                <div className="px-3 pt-5 pb-1.5 border-b-[1.5px] border-ink">
                  <span className="display text-xl font-bold">{s.title}</span>
                  <span className="ml-2 italic text-muted" data-group={s.group}>{s.sub}</span>
                  <span className="ml-2 text-sm text-muted">({part.length})</span>
                </div>
              )
            })()}
            <ol className="m-0 p-0 list-none">
              {part.map((v, i) => {
                const r = rows.get(v.id)!
                const hearInf = !r.asked.includes('inf') || !!checked[`${v.id}:inf`]
                return (
                  <li key={v.id} className="border-t border-rule first:border-t-0 px-3 py-2 hover:bg-[color:color-mix(in_srgb,var(--sunk)_45%,transparent)]">
                    <div className="grid grid-cols-2 sm:[grid-template-columns:var(--cols)] transition-[grid-template-columns] duration-300 gap-x-3 gap-y-1.5 items-center" style={grid}>
                      <span className="hidden sm:block text-right text-sm text-muted tabular-nums">{i + 1}</span>
                      {PARADIGM.map((f) => cell(v, f))}
                      {state('en') === 'hide'
                        ? covered()
                        : <span className="max-sm:order-[-1] max-sm:col-span-2 text-[0.95rem] italic text-muted leading-tight min-w-0" lang="en">{v.en}</span>}
                      {state('group') === 'hide'
                        ? covered()
                        : <span className="hidden sm:block"><LineBadge group={v.group} label={groupLabel(v)} /></span>}
                      <span className="hidden sm:block">{hearInf && <Speak text={v.inf} label={`Lyssna: ${v.inf}`} />}</span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Fragment>
        ))}

        {keys.length > 0 && (
          <div className="sticky bottom-[4.5rem] sm:bottom-0 z-20 border-t-[1.5px] border-ink bg-surface px-3 py-3 flex flex-wrap items-center justify-between gap-3">
            <SwedishKeys />
            <span className="flex flex-wrap items-center gap-2">
              {answered.length > 0 && <strong className="mr-1 tabular-nums" aria-live="polite">{score} av {answered.length}</strong>}
              <button type="button" className="btn btn-quiet" onClick={shuffle} title="Blanda ordningen och börja om">Blanda</button>
              {done
                ? <button type="button" className="btn btn-primary" onClick={restart}>Börja om</button>
                : <>
                  <button type="button" className="btn btn-quiet" onClick={reveal}>Facit</button>
                  <button type="submit" className="btn btn-primary" title="Enter">Rätta <kbd className="font-sans text-[0.8rem] opacity-70" aria-hidden>↵</kbd></button>
                </>}
            </span>
          </div>
        )}
      </form>
    </section>
  )
}
