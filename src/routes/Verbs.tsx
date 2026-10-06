import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chip, LineBadge, Paradigm, Segmented, Speak, Tags, Word } from '../components/bits'
import Drill from '../components/Drill'
import { applyShortcuts } from '../lib/check'
import { FORM_NAMES } from '../lib/diagnose'
import { ALL_GROUPS, ALL_LEVELS, SFI_LABEL, filterVerbs, type Filter, type Focus } from '../lib/filters'
import { GROUP_BY_ID, VERBS, VERB_BY_ID, route } from '../lib/groups'
import { makeSentence } from '../lib/sentences'
import type { FormKey, Verb } from '../lib/types'

const FOCUS: { value: Focus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'top', label: '★ Top 100' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'sVerb', label: 's-verbs' },
  { value: 'reflexive', label: 'Reflexive' },
  { value: 'particle', label: 'Particle' },
]

export default function Verbs() {
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>({ groups: ALL_GROUPS, levels: ALL_LEVELS, focus: 'all', search: '' })
  const [sort, setSort] = useState<'freq' | 'abc'>('freq')
  const open = params.get('v') ? VERB_BY_ID.get(params.get('v')!) : undefined

  const list = useMemo(() => {
    const r = filterVerbs(VERBS, filter)
    return sort === 'abc' ? [...r].sort((a, b) => a.inf.localeCompare(b.inf, 'sv')) : r
  }, [filter, sort])

  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="m-0 text-3xl font-extrabold tracking-tight">Verbs</h1>
        <p className="m-0 text-muted">{VERBS.length} verbs, most frequent first. Endings are marked in the colour of their group.</p>
      </header>

      <div className="grid gap-3">
        <label className="block">
          <span className="sr-only">Search in Swedish or English</span>
          <input
            type="search"
            className="answer-input !text-lg"
            placeholder="Search: skriva, skrev, to write…"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: applyShortcuts(e.target.value) })}
            lang="sv"
          />
        </label>
        {!filter.search && (
          <div className="flex flex-wrap gap-2">
            {ALL_GROUPS.map((g) => (
              <Chip key={g} group={g} on={filter.groups.includes(g)} onClick={() => setFilter({ ...filter, groups: toggle(filter.groups, g) })}>{g}</Chip>
            ))}
            <span className="w-px bg-rule mx-1" aria-hidden />
            {ALL_LEVELS.map((l) => (
              <Chip key={l} on={filter.levels.includes(l)} title={`About ${SFI_LABEL[l]}`} onClick={() => setFilter({ ...filter, levels: toggle(filter.levels, l) })}>{l}</Chip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!filter.search
            ? <Segmented label="Focus" value={filter.focus} options={FOCUS} onChange={(focus) => setFilter({ ...filter, focus })} />
            : <span />}
          <Segmented label="Sort" value={sort} onChange={setSort} options={[{ value: 'freq', label: 'Frequency' }, { value: 'abc', label: 'A–Ö' }]} />
        </div>
      </div>

      <p className="m-0 text-sm text-muted" aria-live="polite">{list.length} verbs</p>

      <ul className="m-0 p-0 list-none rounded-2xl bg-surface ring-1 ring-rule divide-y divide-[color:var(--rule)] overflow-hidden">
        {list.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setParams({ v: v.id })}
              className="w-full text-left grid grid-cols-[auto_1fr] sm:grid-cols-[auto_11rem_1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 hover:bg-sunk"
            >
              <LineBadge group={v.group} />
              <span className="font-bold text-lg truncate" lang="sv">{v.inf}</span>
              <span className="col-start-2 sm:col-start-auto text-[1.05rem] truncate" lang="sv">
                <Word verb={v} form="pres" /><span className="text-muted">, </span>
                <Word verb={v} form="pret" /><span className="text-muted">, </span>
                <Word verb={v} form="sup" />
                <span className="text-muted text-[0.95rem]"> – {v.en}</span>
              </span>
              <span className="hidden sm:flex justify-end gap-1.5">
                {v.freq <= 100 && !v.particle && !v.reflexive && <span title={`Frequency rank ${v.freq}`} className="text-sm font-bold">★</span>}
                {v.irregular && <span className="text-sm font-bold text-[color:var(--g4)]" title="Irregular">irr.</span>}
                <span className="text-sm text-muted w-7 text-right">{v.cefr}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && <VerbDetail key={open.id} verb={open} onClose={() => setParams({})} />}
    </div>
  )
}

function VerbDetail({ verb, onClose }: { verb: Verb; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [drill, setDrill] = useState(false)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [verb])

  const g = GROUP_BY_ID.get(verb.group)!
  const examples = (['pres', 'pret', 'sup'] as FormKey[])
    .map((f) => ({ f, s: makeSentence(verb, f, () => 0.4) }))
    .filter((x) => x.s)
  const pron = (s: string) => s.replace(/ (mig|dig|sig|oss|er)\b/g, ' sig')
  const variants = Object.entries(verb.alt ?? {})
    .map(([k, xs]) => [k, (xs ?? []).filter((x) => pron(x) !== pron(verb[k as 'inf'] ?? ''))] as const)
    .filter(([, xs]) => xs.length)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
      className="m-0 ml-auto h-full max-h-none w-full sm:max-w-[40rem] bg-paper text-ink p-0 backdrop:bg-black/40"
      aria-label={verb.inf}
    >
      <div className="p-5 sm:p-7 grid gap-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <LineBadge group={verb.group} className="text-lg" />
            <h2 className="m-0 text-4xl font-extrabold tracking-tight" lang="sv">{verb.inf}</h2>
            <Speak text={[verb.inf, verb.pres, verb.pret, verb.sup].join(', ')} />
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="size-10 rounded-full hover:bg-sunk text-2xl leading-none" aria-label="Close">×</button>
        </div>
        <div>
          <p className="m-0 text-lg">{verb.en}</p>
          <div className="mt-2"><Tags verb={verb} /></div>
        </div>

        <div className="rounded-2xl bg-surface ring-1 ring-rule p-4">
          <Paradigm verb={verb} />
          {verb.part && (
            <p className="m-0 mt-3 text-[0.95rem]"><span className="text-muted">{FORM_NAMES.part}: </span><span lang="sv">{verb.part}</span></p>
          )}
          {variants.length > 0 && (
            <p className="m-0 mt-2 text-[0.95rem] text-muted">
              Also accepted:{' '}
              {variants.map(([k, xs], i) => <span key={k}>{i > 0 && '; '}{FORM_NAMES[k as FormKey]} <span lang="sv" className="text-ink">{xs!.join(', ')}</span></span>)}
            </p>
          )}
          {verb.note && <p className="m-0 mt-2 text-[0.95rem]">{verb.note}</p>}
        </div>

        <section>
          <h3 className="m-0 mb-2 text-lg font-extrabold">Why group {verb.group}</h3>
          <ol className="m-0 p-0 list-none grid gap-1">
            {route(verb).map((s) => (
              <li key={s.q}><span className="text-muted">{s.q}</span> <span lang="sv">{s.a}</span>{s.group && <strong> → group {s.group}</strong>}</li>
            ))}
          </ol>
          <p className="m-0 mt-2 text-[0.95rem]">{g.rule}</p>
        </section>

        {examples.length > 0 && (
          <section>
            <h3 className="m-0 mb-2 text-lg font-extrabold">In sentences</h3>
            <ul className="m-0 p-0 list-none grid gap-1.5" lang="sv">
              {examples.map(({ f, s }) => {
                const full = `${s!.before}${s!.answer}${s!.after}`
                return (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-sm text-muted w-24 shrink-0" lang="en">{FORM_NAMES[f]}</span>
                    <span>{s!.before}<strong>{s!.answer}</strong>{s!.after}</span>
                    <Speak text={full} />
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section>
          {drill
            ? <Drill pool={[verb]} forms={['pres', 'pret', 'sup', ...(verb.imp ? ['imp' as FormKey] : [])]} mode="single" />
            : <button type="button" onClick={() => setDrill(true)} className="h-11 px-5 rounded-xl bg-ink text-paper font-bold">Practise this verb</button>}
        </section>
      </div>
    </dialog>
  )
}
