import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FORM_NAMES } from '../lib/diagnose'
import { ALSO_MAIN, helperType } from '../lib/filters'
import { GROUP_BY_ID, learnPath, patternLabel, subgroupOf, sVerbNote } from '../lib/groups'
import { example, type Example } from '../lib/sentences'
import type { FormKey, SenseKind, Verb } from '../lib/types'
import { speak } from '../lib/speech'
import { PARADIGM, TipIcon, useCanSpeak, type Icon } from './bits'

/** What opens under a row: the meaning, the forms in sentences and what is good to know.
 *  Forms the learner is still to write, or has covered, have no sentence until they are shown, so the sentence never gives the answer. */
export default function VerbDetail({ verb, covered = [], shown = true, onClosed }: {
  verb: Verb; covered?: FormKey[]; shown?: boolean; onClosed?: () => void
}) {
  // mounted folded, then unfolded on the next frame, so the height glides both ways
  const [unfolded, setUnfolded] = useState(false)
  useEffect(() => {
    const f = requestAnimationFrame(() => setUnfolded(shown))
    return () => cancelAnimationFrame(f)
  }, [shown])
  const g = GROUP_BY_ID.get(verb.group)!
  const sub = subgroupOf(verb)
  const pron = (s: string) => s.replace(/ (mig|dig|sig|oss|er)/g, ' sig')
  const variants = Object.entries(verb.alt ?? {})
    .map(([k, xs]) => [k, (xs ?? []).filter((x) => pron(x) !== pron(verb[k as 'inf'] ?? ''))] as const)
    .filter(([, xs]) => xs.length)
  // the forms spelled out (pattern, usage with jag + presens, old forms) wait until nothing is covered
  const open = covered.length === 0
  // how the verb is used, for the helper verbs
  const usage = verb.id === 'ha' ? 'Har + supinum berättar vad som har hänt: Jag har ätit. Har betyder också äga: Jag har en bil.'
    : verb.id === 'skola' ? 'Ska + infinitiv handlar om framtiden: Jag ska äta.'
      : ALSO_MAIN[verb.id] ? `Står före ett annat verb eller ensamt: ${ALSO_MAIN[verb.id].join(' ')}`
        : helperType(verb) === 'modal' || helperType(verb) === 'more' ? `Står före ett annat verb, utan att: Jag ${verb.pres} åka.`
          : null
  // how to remember the forms, with a model verb to lean on
  const irregular = 'Formerna följer inget mönster. Lär dig dem utantill.'
  // the model verb itself (köper – köpte – köpt) gets its endings instead of a comparison with itself
  const like = (model: string, own: string) => verb.pres.split(' ')[0] === model.split(' ')[0] ? own : `Böjs som ${model}.`
  const stem = verb.imp?.split(' ')[0]
  const forms = verb.sVerb ? sVerbNote(verb)
    : sub ? `${like(sub.typ, 'Vokalen byts i preteritum och supinum.')} Vokalerna: ${patternLabel(sub.family)}.`
      : verb.umlaut ? 'Vokalen byts i preteritum och supinum, men ändelserna är som vanligt.'
        : verb.group === '4' || helperType(verb) === 'modal' ? irregular
          : verb.group === '2b' ? `${like(g.short, 'Lägg till -er, -te och -t.')} Det blir -te${stem ? `, eftersom ${stem} slutar på ${stem.slice(-1)}` : ' efter p, k, s, t och x'}.`
            : like(g.short, `Lägg till ${ENDINGS[verb.group]}.`)
  const tips: { icon: Icon; text: React.ReactNode }[] = [
    verb.sense && { icon: 'puzzle' as const, text: <SenseHint verb={verb} kind={verb.sense.kind} /> },
    verb.note && { icon: 'info' as const, text: verb.note },
    open && usage && { icon: 'info' as const, text: usage },
    open && forms && { icon: 'bulb' as const, text: forms },
  ].filter((t) => !!t)
  const meanings = verb.sense?.text.split(/\s*\d\)\s*/).filter(Boolean) ?? []
  const lines = PARADIGM.filter((f) => verb[f as 'inf'] && !covered.includes(f)).map((f) => [f, example(verb, f)] as const).filter(([, ex]) => ex)

  return (
    <div className={`grid fold ${unfolded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      onClick={(e) => e.stopPropagation()}
      onTransitionEnd={(e) => { if (e.target === e.currentTarget && e.propertyName === 'grid-template-rows' && !shown) onClosed?.() }}>
      <div className="min-h-0 overflow-hidden">
        <div className="grid gap-4 pt-3 pb-2 sm:pl-[3rem] sm:pr-12 cursor-auto">
          {meanings.length > 0 && (
            <ol className={`m-0 p-0 list-none grid gap-0.5 text-[1.08rem] ${meanings.length > 1 ? '[counter-reset:m]' : ''}`} lang="sv">
              {meanings.map((m) => (
                <li key={m} className={meanings.length > 1 ? "before:[counter-increment:m] before:content-[counter(m)'.'] before:mr-2 before:text-muted" : ''}>
                  {meanings.length === 1 && <span className="text-muted">{verb.inf} = </span>}{m}
                </li>
              ))}
            </ol>
          )}

          {lines.length > 0 && (
            <ul className="m-0 p-0 list-none grid gap-1.5" aria-label="Formerna i meningar">
              {lines.map(([f, ex]) => (
                <li key={f} className="grid sm:grid-cols-[7rem_1fr] gap-x-3 items-start">
                  <span className="text-[0.95rem] text-muted sm:pt-1">{FORM_NAMES[f]}</span>
                  <Sentence ex={ex!} />
                </li>
              ))}
            </ul>
          )}

          <ul className="m-0 p-0 list-none grid gap-2 text-[1.02rem]" lang="sv" aria-label="Tänk på">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <TipIcon icon={t.icon} />
                <span className="min-w-0">{t.text}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5">
              <TipIcon icon="book" />
              <Link className="underline underline-offset-2 text-ink" to={learnPath(verb)}>Mer om {g.name.toLowerCase()}</Link>
              {open && verb.part && <span className="text-muted">· particip: <span lang="sv" className="text-ink">{verb.part}</span></span>}
            </li>
          </ul>
          {open && variants.length > 0 && (
            <p className="m-0 -mt-1 text-[0.95rem] text-muted">
              Äldre eller ovanliga former: <span lang="sv">{variants.map(([, xs]) => xs!.join(', ')).join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** An example sentence with the verb's own words in bold; a click anywhere on it reads it aloud. */
function Sentence({ ex }: { ex: Example }) {
  const can = useCanSpeak()
  const words = ex.parts.map((p, i) => (p.mark ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))
  // what the verb means here, when that is not its main meaning
  const note = ex.note && <span className="block mt-0.5 text-[0.95rem] italic text-muted">{ex.note}</span>
  if (!can) {
    return (
      <p className="m-0 flex items-start gap-1.5 text-[1.05rem] leading-snug" lang="sv">
        <span className="size-8 -ml-1 shrink-0" aria-hidden />
        <span className="pt-1">{words}{note}</span>
      </p>
    )
  }
  return (
    <button type="button" onClick={() => speak(ex.text)} title="Lyssna" aria-label={`Lyssna: ${ex.text}`} lang="sv"
      className="group/say -ml-1 pr-2 flex items-start gap-1.5 text-left text-[1.05rem] leading-snug rounded-[2px] hover:bg-sunk">
      <span className="size-8 shrink-0 grid place-items-center text-muted group-hover/say:text-ink">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      </span>
      <span className="pt-1">{words}{note}</span>
    </button>
  )
}

const ENDINGS: Record<string, string> = { 1: '-r, -de och -t', '2a': '-er, -de och -t', 3: '-r, -dde och -tt' }

const SENSE: Record<SenseKind, (verb: React.ReactNode, particle: React.ReactNode) => React.ReactNode> = {
  ny: (v, p) => <>Betydelsen är ny. Du kan inte gissa den från {v} och {p}.</>,
  utvidgad: (v, p) => <>Du kan gissa betydelsen från {v} och {p}.</>,
  båda: () => 'Verbet har två betydelser. Den ena kan du gissa, den andra inte.',
  bara: (v, p) => <>{v} används alltid med {p}.</>,
}

/** What the particle does to the meaning, as two teachers judged it. */
function SenseHint({ verb, kind }: { verb: Verb; kind: SenseKind }) {
  const word = (w: string) => <i lang="sv">{w}</i>
  return <>{SENSE[kind](word(verb.inf.split(' ')[0]), word(verb.particle ?? ''))}</>
}
