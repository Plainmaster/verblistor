import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PARADIGM, Say, Speak, Tags } from '../components/bits'
import SelectionControls from '../components/Selection'
import VerbList from '../components/VerbList'
import { FORM_NAMES } from '../lib/diagnose'
import { isHelper, isTop } from '../lib/filters'
import { GROUP_BY_ID, learnPath, patternLabel, subgroupOf, VERBS, VERB_BY_ID } from '../lib/groups'
import { makeSentence } from '../lib/sentences'
import { useSelection } from '../lib/selection'
import type { FormKey, Verb } from '../lib/types'

const series = (v: Verb) => (['inf', 'pres', 'pret', 'sup'] as const).filter((f) => !v.rare?.includes(f)).map((f) => v[f]).join(', ')

export default function Verbs() {
  const { verbs, sort, openVerb, setOpenVerb } = useSelection()
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

        <VerbList verbs={verbs} sort={sort} onOpen={setOpenVerb} />
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
  // one line on what to learn: the vowel pattern, the vowel shift, or the group's rule
  const pattern = sub ? `${patternLabel(sub.family)}, som ${sub.typ}.`
    : verb.umlaut ? 'Omljud: vokalen byts, ändelserna är de vanliga.'
      : isHelper(verb) ? 'Hjälpverb: står före ett annat verb. Lär in formerna som de är.'
        : verb.group === '4' ? 'Oregelbundet: lär in formerna som de är.'
          : g.rule

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
      className="m-0 ml-auto h-full max-h-none w-full sm:max-w-[40rem] bg-paper text-ink p-0 border-l border-ink backdrop:bg-black/50"
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
                  <td className="vr py-2 px-4 text-xl font-medium whitespace-nowrap"><Say verb={verb} form={f} /></td>
                  <td className="vr py-2 pl-4 text-[0.98rem] text-muted" lang="sv">
                    {s && <span className="inline-flex items-baseline gap-1">{s.before}<strong className="text-ink">{s.answer}</strong>{s.after}<Speak text={`${s.before}${s.answer}${s.after}`} className="size-7 self-center" /></span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

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
