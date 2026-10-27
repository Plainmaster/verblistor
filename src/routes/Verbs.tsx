import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PARADIGM, Say, Speak, Tags } from '../components/bits'
import SelectionControls from '../components/Selection'
import VerbList from '../components/VerbList'
import { FORM_NAMES } from '../lib/diagnose'
import { ALSO_MAIN, helperType, isTop } from '../lib/filters'
import { GROUP_BY_ID, learnPath, patternLabel, subgroupOf, VERBS, VERB_BY_ID } from '../lib/groups'
import { makeSentence } from '../lib/sentences'
import { useSelection } from '../lib/selection'
import type { FormKey, SenseKind, Verb } from '../lib/types'

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
            {VERBS.length} svenska verb. Klicka på en form för att höra den, på infinitiven för att läsa mer. Med ögonen döljer du en kolumn eller övar på den.
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
  const pron = (s: string) => s.replace(/ (mig|dig|sig|oss|er)/g, ' sig')
  const variants = Object.entries(verb.alt ?? {})
    .map(([k, xs]) => [k, (xs ?? []).filter((x) => pron(x) !== pron(verb[k as 'inf'] ?? ''))] as const)
    .filter(([, xs]) => xs.length)
  const sentence = (s: { before: string; answer: string; after: string }) => (
    <span className="text-[0.98rem] font-normal text-muted" lang="sv">
      {s.before}<strong className="text-ink">{s.answer}</strong>{s.after}{' '}
      <Speak text={`${s.before}${s.answer}${s.after}`} className="size-7 align-middle" />
    </span>
  )
  // one line on what to learn: the vowel pattern, the vowel shift, or the group's rule
  const pattern = sub ? `${patternLabel(sub.family)}, som ${sub.typ}.`
    : verb.umlaut ? 'Omljud: vokalen byts, ändelserna är de vanliga.'
      : verb.id === 'ha' ? 'Hjälpverb för perfekt: har + supinum, Jag har ätit. Också ett vanligt verb: Jag har en bil.'
        : verb.id === 'skola' ? 'Hjälpverb för futurum: ska + infinitiv, Jag ska äta. Lär dig ska – skulle.'
        : ALSO_MAIN[verb.id] ? `Både hjälpverb och vanligt verb: ${ALSO_MAIN[verb.id].join(' ')}`
        : helperType(verb) === 'modal' ? `Hjälpverb: står före ett annat verb, utan att: Jag ${verb.pres} åka. Lär in formerna som de är.`
        : helperType(verb) === 'more' ? `${g.rule} Står före ett annat verb, utan att: Jag ${verb.pres} åka.`
        : verb.group === '4' ? 'Oregelbundet: lär in formerna som de är.'
          : g.rule

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
      className="m-0 ml-auto h-full max-h-none w-full max-w-none sm:max-w-[40rem] bg-paper text-ink p-0 border-l border-ink backdrop:bg-black/50"
      aria-label={verb.inf}
    >
      <div className="p-5 sm:p-8 grid gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="m-0 text-4xl font-bold" lang="sv">{verb.inf}</h2>
              <Speak text={series(verb)} label="Lyssna på alla former" />
            </div>
            <p className="m-0 mt-1 text-lg italic text-muted" lang="en">{verb.en}</p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="size-10 rounded-[2px] hover:bg-sunk text-2xl leading-none" aria-label="Stäng">×</button>
        </div>

        <table className="ledger">
          <tbody>
            {PARADIGM.filter((f) => verb[f as 'inf']).map((f) => {
              const s = f === 'pres' || f === 'pret' || f === 'sup' ? !verb.rare?.includes(f) && makeSentence(verb, f, () => 0.4) : null
              return (
                <tr key={f} className="align-baseline">
                  <td className="sc text-[0.95rem] text-muted py-2 pr-4 whitespace-nowrap">{FORM_NAMES[f]}</td>
                  <td className="vr py-2 pl-4 sm:pr-4 text-xl font-medium">
                    <span className="whitespace-nowrap"><Say verb={verb} form={f} /></span>
                    {s && <span className="sm:hidden block mt-0.5">{sentence(s)}</span>}
                  </td>
                  <td className="max-sm:hidden vr py-2 pl-4">{s && sentence(s)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {verb.sense && <Sense verb={verb} sense={verb.sense} />}

        <p className="m-0 text-[1.02rem]">
          <Link className="font-bold underline underline-offset-2 text-ink" to={learnPath(verb)}>{g.name}</Link> · {pattern}
        </p>

        {(verb.part || variants.length > 0 || verb.note || isTop(verb) || verb.sVerb || verb.particle || verb.reflexive) && (
          <div className="grid gap-1.5 text-[0.95rem] text-muted border-t border-rule pt-4">
            <div><Tags verb={verb} /></div>
            {verb.part && <p className="m-0">{FORM_NAMES.part}: <span lang="sv" className="text-ink">{verb.part}</span></p>}
            {variants.length > 0 && (
              <p className="m-0">
                Går också:{' '}
                {variants.map(([k, xs], i) => <span key={k}>{i > 0 && '; '}{FORM_NAMES[k as FormKey]} <span lang="sv" className="text-ink">{xs!.join(', ')}</span></span>)}
              </p>
            )}
            {verb.note && <p className="m-0 text-ink">{verb.note}</p>}
          </div>
        )}
      </div>
    </dialog>
  )
}

const SENSE: Record<SenseKind, { label: string; hint: (verb: React.ReactNode, particle: React.ReactNode) => React.ReactNode }> = {
  ny: { label: 'Ny betydelse', hint: (v, p) => <>Går inte att gissa från {v} och {p}.</> },
  utvidgad: { label: 'Utvidgad betydelse', hint: (v, p) => <>Går att gissa från {v} och {p}.</> },
  båda: { label: 'Två betydelser', hint: () => 'Den ena går att gissa, den andra inte.' },
  bara: { label: 'Finns bara med partikeln', hint: (v) => <>{v} används inte ensamt.</> },
}

/** What the particle does to the meaning, as two teachers judged it. */
function Sense({ verb, sense }: { verb: Verb; sense: NonNullable<Verb['sense']> }) {
  const s = SENSE[sense.kind]
  const word = (w: string) => <i lang="sv">{w}</i>
  // "1) … 2) …" becomes one line per meaning
  const meanings = sense.text.split(/\s*(?=\d\))/).filter(Boolean)
  return (
    <div className="grid gap-1 border-l-2 border-ink pl-3 text-[1.02rem]">
      <p className="m-0"><strong>{s.label}.</strong> <span className="text-muted">{s.hint(word(verb.inf.split(' ')[0]), word(verb.particle ?? ''))}</span></p>
      <p className="m-0" lang="sv">
        Betyder:{meanings.length > 1 ? meanings.map((m) => <span key={m} className="block pl-3">{m}</span>) : ` ${sense.text}`}
      </p>
    </div>
  )
}
