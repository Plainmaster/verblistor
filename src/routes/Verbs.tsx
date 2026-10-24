import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { Chip, LineBadge, PARADIGM, Paradigm, Segmented, ShareButton, Speak, Tags, Word } from '../components/bits'
import Drill from '../components/Drill'
import { applyShortcuts } from '../lib/check'
import { FORM_NAMES } from '../lib/diagnose'
import { ALL_GROUPS, type Kind, type Sort, type Top } from '../lib/filters'
import { GROUP_BY_ID, NAMED_FAMILIES, VERBS, VERB_BY_ID, route } from '../lib/groups'
import { makeSentence } from '../lib/sentences'
import { describe, useSelection } from '../lib/selection'
import type { FormKey, Verb } from '../lib/types'

const series = (v: Verb) => [v.inf, v.pres, v.pret, v.sup].join(', ')

export default function Verbs() {
  const { filter, sort, verbs, query, setFilter, setSort, openVerb, setOpenVerb } = useSelection()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [printMode, setPrintMode] = useState<'list' | 'blank'>('list')
  const open = openVerb ? VERB_BY_ID.get(openVerb) : undefined
  const custom = !!filter.ids?.length

  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])
  const pick = (id: string) => setPicked((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const print = (m: 'list' | 'blank') => {
    flushSync(() => setPrintMode(m))
    window.print()
  }

  return (
    <>
      <div className="grid gap-6 print:hidden">
        <header>
          <h1 className="m-0 text-4xl sm:text-5xl font-extrabold">Verblistor</h1>
          <p className="m-0 mt-2 max-w-[60ch] text-lg text-muted">
            {VERBS.length} svenska verb med alla former. Ändelserna är markerade i gruppens färg. Klicka på ett verb för att se mer.
          </p>
        </header>

        {custom ? (
          <div className="rounded-2xl bg-surface ring-1 ring-rule p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0"><strong>Egen lista</strong> med {verbs.length} verb.</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-quiet" onClick={() => { setPicked(new Set(filter.ids)); setFilter({ ids: undefined }) }}>
                Ändra listan
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setFilter({ ids: undefined })}>Visa alla verb</button>
            </div>
          </div>
        ) : (
          <section aria-label="Urval" className="grid gap-3">
            <label className="block">
              <span className="sr-only">Sök på svenska eller engelska</span>
              <input
                type="search"
                className="answer-input !text-lg !rounded-full !px-5"
                placeholder="Sök: skriva, skrev, to write …"
                value={filter.search ?? ''}
                onChange={(e) => setFilter({ search: applyShortcuts(e.target.value) || undefined })}
                lang="sv"
              />
            </label>
            {!filter.search && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grupp">
                  {ALL_GROUPS.map((g) => (
                    <Chip key={g} group={g} on={filter.groups.length < ALL_GROUPS.length && filter.groups.includes(g)} title={GROUP_BY_ID.get(g)!.short}
                      onClick={() => {
                        // with all groups on, a click picks just that group
                        const next = filter.groups.length === ALL_GROUPS.length ? [g] : toggle(filter.groups, g)
                        setFilter({ groups: next.length ? ALL_GROUPS.filter((x) => next.includes(x)) : ALL_GROUPS })
                      }}>
                      {g}
                    </Chip>
                  ))}
                </div>
                <Segmented<Top> label="Hur vanliga" value={filter.top} onChange={(top) => setFilter({ top })}
                  options={[{ value: 100, label: '100 vanligaste' }, { value: 300, label: '300' }, { value: 0, label: 'Alla' }]} />
                <label>
                  <span className="sr-only">Typ av verb</span>
                  <select className="field" value={filter.kind} onChange={(e) => setFilter({ kind: e.target.value as Kind })}>
                    <option value="all">Alla typer</option>
                    <option value="strong">Starka och oregelbundna</option>
                    <optgroup label="Vokalmönster (grupp 4)">
                      {NAMED_FAMILIES.map((f) => <option key={f.id} value={`strong:${f.id}`}>{f.id}</option>)}
                      <option value="strong:other">Utan mönster</option>
                    </optgroup>
                    <option value="sVerb">s-verb</option>
                    <option value="particle">Partikelverb</option>
                    <option value="reflexive">Reflexiva verb</option>
                  </select>
                </label>
              </div>
            )}
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/ova${query}`} className="btn btn-primary">Öva på de här {verbs.length}</Link>
            <ShareButton />
            <button type="button" className="btn btn-quiet hidden sm:inline-flex" onClick={() => print('list')}>Skriv ut</button>
            <button type="button" className="btn btn-quiet hidden sm:inline-flex" onClick={() => print('blank')} title="Infinitiv och engelska ifyllt, resten tomt">Övningsblad</button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sortera
            <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="freq">Vanligast först</option>
              <option value="group">Grupp</option>
              <option value="abc">A–Ö</option>
            </select>
          </label>
        </div>

        <p className="m-0 -mb-3 text-sm text-muted" aria-live="polite">{verbs.length} verb · {describe(filter)}</p>

        <VerbTable verbs={verbs} picked={picked} onPick={pick} onOpen={setOpenVerb} />
        {verbs.length === 0 && <p className="m-0 text-muted">Inga verb passar urvalet. Prova att välja fler grupper eller typer.</p>}
      </div>

      {picked.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 sm:bottom-4 z-40 px-4 print:hidden">
          <div className="mx-auto max-w-xl rounded-full bg-ink text-paper shadow-lg pl-5 pr-2 py-2 flex items-center justify-between gap-3">
            <span className="font-bold">{picked.size} valda</span>
            <span className="flex gap-1">
              <button type="button" className="h-9 px-3 rounded-full hover:bg-white/10" onClick={() => setPicked(new Set())}>Rensa</button>
              <button type="button" className="btn btn-primary !h-9" onClick={() => { setFilter({ ids: [...picked] }); setPicked(new Set()) }}>
                Gör en lista
              </button>
            </span>
          </div>
        </div>
      )}

      <PrintSheet verbs={verbs} title={describe(filter)} blank={printMode === 'blank'} />
      {open && <VerbDetail key={open.id} verb={open} onClose={() => setOpenVerb(null)} />}
    </>
  )
}

function VerbTable({ verbs, picked, onPick, onOpen }: {
  verbs: Verb[]; picked: Set<string>; onPick: (id: string) => void; onOpen: (id: string) => void
}) {
  if (!verbs.length) return null
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-rule overflow-hidden">
      <table className="w-full border-collapse text-left">
        <thead className="hidden sm:table-header-group">
          <tr className="text-sm text-muted">
            <th className="w-10 pl-4"><span className="sr-only">Välj</span></th>
            <th className="w-10 py-3"><span className="sr-only">Grupp</span></th>
            {PARADIGM.map((f) => <th key={f} className={`py-3 pr-3 font-bold ${f === 'imp' ? 'hidden lg:table-cell' : ''}`}>{FORM_NAMES[f]}</th>)}
            <th className="py-3 pr-3 font-bold hidden md:table-cell">engelska</th>
            <th className="w-12"><span className="sr-only">Lyssna</span></th>
          </tr>
        </thead>
        <tbody>
          {verbs.map((v) => (
            <tr key={v.id} className="border-t border-rule first:border-t-0 sm:first:border-t hover:bg-sunk/60 align-middle">
              <td className="pl-4 w-10">
                <input type="checkbox" className="size-4 accent-[color:var(--ink)]" checked={picked.has(v.id)}
                  onChange={() => onPick(v.id)} aria-label={`Välj ${v.inf}`} />
              </td>
              <td className="py-2.5 w-10"><LineBadge group={v.group} /></td>
              <td className="py-2.5 pr-3">
                <button type="button" onClick={() => onOpen(v.id)} className="text-left font-bold text-lg hover:underline underline-offset-4" lang="sv">
                  {v.inf}
                </button>
                <span className="sm:hidden block text-[1.02rem]" lang="sv">
                  <Word verb={v} form="pres" /><span className="text-muted">, </span>
                  <Word verb={v} form="pret" /><span className="text-muted">, </span>
                  <Word verb={v} form="sup" />
                </span>
                <span className="md:hidden block text-sm text-muted">{v.en}</span>
              </td>
              {(['pres', 'pret', 'sup', 'imp'] as FormKey[]).map((f) => (
                <td key={f} className={`py-2.5 pr-3 text-[1.05rem] hidden ${f === 'imp' ? 'lg:table-cell' : 'sm:table-cell'}`}><Word verb={v} form={f} /></td>
              ))}
              <td className="py-2.5 pr-3 text-muted text-[0.95rem] hidden md:table-cell">{v.en}</td>
              <td className="pr-2 w-12"><Speak text={series(v)} label={`Lyssna: ${series(v)}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PrintSheet({ verbs, title, blank }: { verbs: Verb[]; title: string; blank: boolean }) {
  return (
    <div className="hidden print:block">
      <h1 className="m-0 text-2xl font-extrabold">Verblistor <span className="font-normal text-base">– {title}</span></h1>
      {blank && <p className="m-0 mt-1 text-sm">Fyll i de tomma rutorna. Namn: ______________________</p>}
      <table className="w-full mt-4 border-collapse text-left text-[10.5pt]">
        <thead>
          <tr>
            {['', ...PARADIGM.map((f) => FORM_NAMES[f]), 'engelska'].map((h, i) => (
              <th key={i} className="border-b-2 border-black py-1 pr-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {verbs.map((v) => (
            <tr key={v.id} className="break-inside-avoid">
              <td className="border-b border-gray-300 py-1.5 pr-2 font-bold">{v.group}</td>
              <td className="border-b border-gray-300 py-1.5 pr-2 font-bold">{v.inf}</td>
              {(['pres', 'pret', 'sup', 'imp'] as FormKey[]).map((f) => (
                <td key={f} className="border-b border-gray-300 py-1.5 pr-2">{blank ? '' : (v[f as 'pres'] ?? '–')}</td>
              ))}
              <td className="border-b border-gray-300 py-1.5 pr-2 text-gray-600">{v.en}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs">verblistor.pages.dev</p>
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
      className="m-0 ml-auto h-full max-h-none w-full sm:max-w-[40rem] bg-paper text-ink p-0 backdrop:bg-black/50"
      aria-label={verb.inf}
    >
      <div className="p-5 sm:p-8 grid gap-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <LineBadge group={verb.group} className="text-lg" />
            <h2 className="m-0 text-4xl font-extrabold" lang="sv">{verb.inf}</h2>
            <Speak text={series(verb)} label="Lyssna på alla former" />
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="size-10 rounded-full hover:bg-sunk text-2xl leading-none" aria-label="Stäng">×</button>
        </div>
        <div>
          <p className="m-0 text-lg" lang="en">{verb.en}</p>
          <div className="mt-2"><Tags verb={verb} /></div>
        </div>

        <div className="rounded-2xl bg-surface ring-1 ring-rule p-5">
          <Paradigm verb={verb} />
          {verb.part && (
            <p className="m-0 mt-3 text-[0.95rem]"><span className="text-muted">{FORM_NAMES.part}: </span><span lang="sv">{verb.part}</span></p>
          )}
          {variants.length > 0 && (
            <p className="m-0 mt-2 text-[0.95rem] text-muted">
              Går också:{' '}
              {variants.map(([k, xs], i) => <span key={k}>{i > 0 && '; '}{FORM_NAMES[k as FormKey]} <span lang="sv" className="text-ink">{xs!.join(', ')}</span></span>)}
            </p>
          )}
          {verb.note && <p className="m-0 mt-2 text-[0.95rem]">{verb.note}</p>}
        </div>

        <section>
          <h3 className="m-0 mb-2 text-xl font-extrabold">Därför grupp {verb.group}</h3>
          <ol className="m-0 p-0 list-none grid gap-1">
            {route(verb).map((s) => (
              <li key={s.q}><span className="text-muted">{s.q}</span> <span lang="sv">{s.a}</span>{s.group && <strong> → grupp {s.group}</strong>}</li>
            ))}
          </ol>
          <p className="m-0 mt-2 text-[0.95rem]">
            {g.rule}{' '}
            <Link className="underline underline-offset-2 text-ink" to={verb.family ? `/grupper/monster/${encodeURIComponent(verb.family)}` : `/grupper/${verb.group}`}>
              Läs mer
            </Link>
          </p>
        </section>

        {examples.length > 0 && (
          <section>
            <h3 className="m-0 mb-2 text-xl font-extrabold">I meningar</h3>
            <ul className="m-0 p-0 list-none grid gap-1.5" lang="sv">
              {examples.map(({ f, s }) => {
                const full = `${s!.before}${s!.answer}${s!.after}`
                return (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-sm text-muted w-24 shrink-0">{FORM_NAMES[f]}</span>
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
            : <button type="button" onClick={() => setDrill(true)} className="btn btn-primary">Öva på {verb.inf}</button>}
        </section>
      </div>
    </dialog>
  )
}
