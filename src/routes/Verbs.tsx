import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LineBadge, PARADIGM, Say, Speak, Tags } from '../components/bits'
import SelectionControls from '../components/Selection'
import VerbList from '../components/VerbList'
import { FORM_NAMES } from '../lib/diagnose'
import { ALSO_MAIN, helperType, isTop } from '../lib/filters'
import { GROUP_BY_ID, groupLabel, learnPath, patternLabel, subgroupOf, sVerbNote, VERBS, VERB_BY_ID } from '../lib/groups'
import { example, type Example } from '../lib/sentences'
import { useSelection } from '../lib/selection'
import type { SenseKind, Verb } from '../lib/types'

const series = (v: Verb) => (['inf', 'pres', 'pret', 'sup'] as const).filter((f) => !v.rare?.includes(f)).map((f) => v[f]).join(', ')

export default function Verbs() {
  const { filter, verbs, sort, openVerb, setOpenVerb } = useSelection()
  const open = openVerb ? VERB_BY_ID.get(openVerb) : undefined

  return (
    <>
      <div className="grid gap-6 print:hidden">
        <header>
          <h1 className="page-title">Verblistor</h1>
          <p className="m-0 mt-3 max-w-[62ch] text-lg text-muted">
            {VERBS.length} svenska verb. Klicka på en form för att höra den. Klicka på raden för att öppna verbet. Med ögonen döljer du en kolumn eller övar på den.
          </p>
        </header>

        <SelectionControls />

        <VerbList verbs={verbs} sort={sort} kind={filter.kind} onOpen={setOpenVerb} />
        {verbs.length === 0 && <p className="m-0 text-muted">Inga verb passar urvalet. Prova att välja fler grupper eller typer.</p>}
      </div>

      {open && <VerbDetail key={open.id} verb={open} onClose={() => setOpenVerb(null)} />}
    </>
  )
}

function VerbDetail({ verb, onClose }: { verb: Verb; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [verb])

  const g = GROUP_BY_ID.get(verb.group)!
  const sub = subgroupOf(verb)
  const pron = (s: string) => s.replace(/ (mig|dig|sig|oss|er)/g, ' sig')
  const variants = Object.entries(verb.alt ?? {})
    .map(([k, xs]) => [k, (xs ?? []).filter((x) => pron(x) !== pron(verb[k as 'inf'] ?? ''))] as const)
    .filter(([, xs]) => xs.length)
  // one line on what to learn: the vowel pattern, the vowel shift, or the group's rule
  const pattern = sub ? `${patternLabel(sub.family)}, som ${sub.typ}.`
    : verb.sVerb && verb.group !== '4' ? `Som andra verb i ${g.name.toLowerCase()}, med -s på slutet: ${verb.pret}, ${verb.sup}.`
    : verb.umlaut ? 'Omljud: vokalen byts, ändelserna är de vanliga.'
      : verb.id === 'ha' ? 'Hjälpverb för perfekt: har + supinum, Jag har ätit. Också ett vanligt verb: Jag har en bil.'
        : verb.id === 'skola' ? 'Hjälpverb för futurum: ska + infinitiv, Jag ska äta. Lär dig ska – skulle.'
        : ALSO_MAIN[verb.id] ? `Både hjälpverb och vanligt verb: ${ALSO_MAIN[verb.id].join(' ')}`
        : helperType(verb) === 'modal' ? `Hjälpverb: står före ett annat verb, utan att: Jag ${verb.pres} åka. Lär in formerna som de är.`
        : helperType(verb) === 'more' ? `${g.rule} Står före ett annat verb, utan att: Jag ${verb.pres} åka.`
        : verb.group === '4' ? 'Oregelbundet: lär in formerna som de är.'
          : g.rule
  const tips = [
    verb.sense && <SenseHint key="sense" verb={verb} kind={verb.sense.kind} />,
    verb.sVerb && sVerbNote(verb),
    verb.note,
  ].filter(Boolean)
  const meanings = verb.sense?.text.split(/\s*\d\)\s*/).filter(Boolean) ?? []

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
      className="m-0 ml-auto h-full max-h-none w-full max-w-none sm:max-w-[40rem] bg-paper text-ink p-0 border-l border-ink backdrop:bg-black/50"
      aria-label={verb.inf}
    >
      <div className="p-5 sm:p-8 grid gap-8">
        <header className="flex items-start justify-between gap-3">
          {/* the heading takes the focus on opening, so no button lights up before it is used */}
          <div tabIndex={-1} autoFocus className="outline-none min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="m-0 text-4xl font-bold" lang="sv">{verb.inf}</h2>
              <Speak text={series(verb)} label="Lyssna på alla former" />
            </div>
            <p className="m-0 mt-1 text-lg italic text-muted" lang="en">{verb.en}</p>
            {meanings.length > 0 && (
              <ol className={`m-0 mt-3 p-0 list-none grid gap-0.5 text-xl ${meanings.length > 1 ? '[counter-reset:m]' : ''}`} lang="sv">
                {meanings.map((m) => (
                  <li key={m} className={meanings.length > 1 ? "before:[counter-increment:m] before:content-[counter(m)'.'] before:mr-2 before:text-muted" : ''}>{m}</li>
                ))}
              </ol>
            )}
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="size-10 shrink-0 rounded-[2px] hover:bg-sunk text-2xl leading-none" aria-label="Stäng">×</button>
        </header>

        <section aria-label="Formerna i meningar">
          <ol className="m-0 p-0 list-none border-t-[1.5px] border-ink">
            {PARADIGM.filter((f) => verb[f as 'inf']).map((f) => {
              const ex = example(verb, f)
              return (
                <li key={f} className="grid sm:grid-cols-[7.5rem_1fr] gap-x-4 gap-y-0.5 py-3 border-b border-rule">
                  <span className="sc text-[0.95rem] text-muted sm:pt-1.5">{FORM_NAMES[f]}</span>
                  <div className="min-w-0">
                    <span className="text-2xl font-medium"><Say verb={verb} form={f} /></span>
                    {ex && <Sentence ex={ex} />}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {tips.length > 0 && (
          <section aria-label="Tänk på" className="grid gap-2 border-l-[3px] border-ink pl-4">
            <h3 className="m-0 sc text-[0.95rem] text-muted font-normal">Tänk på</h3>
            <ul className="m-0 p-0 list-none grid gap-2 text-[1.05rem]" lang="sv">
              {tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        )}

        <section aria-label="Böjning" className="grid gap-1.5">
          <h3 className="m-0 sc text-[0.95rem] text-muted font-normal">Böjning</h3>
          <p className="m-0 flex items-center gap-2.5 flex-wrap">
            <LineBadge group={verb.group} label={groupLabel(verb)} />
            <Link className="font-semibold underline underline-offset-2 text-ink" to={learnPath(verb)}>{g.name}</Link>
          </p>
          <p className="m-0 text-[1.05rem]" lang="sv">{pattern}</p>
          {verb.part && <p className="m-0 text-[1.05rem]"><span className="text-muted">Particip:</span> <span lang="sv">{verb.part}</span></p>}
        </section>

        {(variants.length > 0 || isTop(verb) || verb.sVerb || verb.particle || verb.reflexive) && (
          <footer className="grid gap-2 text-[0.95rem] text-muted border-t border-rule pt-4">
            {(isTop(verb) || verb.sVerb || verb.particle || verb.reflexive) && <div><Tags verb={verb} /></div>}
            {variants.length > 0 && (
              <p className="m-0">
                Äldre eller ovanliga former:{' '}
                <span lang="sv">{variants.map(([, xs]) => xs!.join(', ')).join(', ')}</span>
              </p>
            )}
          </footer>
        )}
      </div>
    </dialog>
  )
}

/** An example sentence with the verb's own words in bold, read aloud as a whole. */
function Sentence({ ex }: { ex: Example }) {
  return (
    <p className="m-0 mt-1 flex items-start gap-1.5 text-[1.08rem] leading-snug" lang="sv">
      <Speak text={ex.text} label={`Lyssna: ${ex.text}`} className="size-8 -ml-1.5 -mt-0.5" />
      <span className="pt-0.5">
        {ex.parts.map((p, i) => (p.mark ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
      </span>
    </p>
  )
}

const SENSE: Record<SenseKind, { label: string; hint: (verb: React.ReactNode, particle: React.ReactNode) => React.ReactNode }> = {
  ny: { label: 'Ny betydelse', hint: (v, p) => <>går inte att gissa från {v} och {p}.</> },
  utvidgad: { label: 'Utvidgad betydelse', hint: (v, p) => <>går att gissa från {v} och {p}.</> },
  båda: { label: 'Två betydelser', hint: () => 'den ena går att gissa, den andra inte.' },
  bara: { label: 'Bara med partikeln', hint: (v) => <>{v} används inte ensamt.</> },
}

/** What the particle does to the meaning, as two teachers judged it. */
function SenseHint({ verb, kind }: { verb: Verb; kind: SenseKind }) {
  const s = SENSE[kind]
  const word = (w: string) => <i lang="sv">{w}</i>
  return <><strong>{s.label}:</strong> {s.hint(word(verb.inf.split(' ')[0]), word(verb.particle ?? ''))}</>
}
