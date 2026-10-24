import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyShortcuts, expected } from '../lib/check'
import { diagnose, FORM_NAMES, isCareless, type Diagnosis } from '../lib/diagnose'
import { GROUP_BY_ID } from '../lib/groups'
import { headVerb, makeSentence, SENTENCE_FORMS, type Sentence } from '../lib/sentences'
import { pickNext } from '../lib/session'
import type { Grade } from '../lib/srs'
import type { FormKey, Verb } from '../lib/types'
import { useStore } from '../store'
import { LineBadge, Paradigm, Speak, SwedishKeys, Word } from './bits'

interface Item {
  verb: Verb
  form: FormKey
  sentence?: Sentence
}

const gradeOf = (d: Diagnosis): Grade => (d.type === 'correct' ? 'good' : isCareless(d.type) ? 'hard' : 'wrong')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** One form at a time, either on its own or in a sentence. Picks due reviews first (spaced repetition). */
export default function Drill({ pool, forms, mode }: { pool: Verb[]; forms: FormKey[]; mode: 'single' | 'sentence' }) {
  const { settings, progress, record } = useStore()
  const [item, setItem] = useState<Item | null>(null)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [tally, setTally] = useState({ n: 0, ok: 0 })
  const recent = useRef<string[]>([])
  const cardsRef = useRef(progress.cards)
  useEffect(() => { cardsRef.current = progress.cards }, [progress.cards])
  const input = useRef<HTMLInputElement>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)

  const sentenceForms = useMemo(() => {
    const f = forms.filter((x) => SENTENCE_FORMS.includes(x))
    return f.length ? f : ['pres', 'pret', 'sup'] as FormKey[]
  }, [forms])

  const next = useCallback(() => {
    const now = Date.now()
    let it: Item | null = null
    if (mode === 'sentence') {
      const usable = pool.filter((v) => v.ctx && !v.modal)
      const skip = [...recent.current]
      for (let i = 0; i < 12 && !it; i++) {
        const p = pickNext(usable, sentenceForms, cardsRef.current, now, skip)
        if (!p) break
        const sentence = makeSentence(p.verb, p.form)
        if (sentence) it = { verb: p.verb, form: p.form, sentence }
        else skip.push(p.verb.id)
      }
    } else {
      const p = pickNext(pool, forms, cardsRef.current, now, recent.current)
      if (p) it = { verb: p.verb, form: p.form }
    }
    if (it) recent.current = [it.verb.id, ...recent.current].slice(0, Math.min(3, Math.floor(pool.length / 2)))
    setItem(it)
    setValue('')
    setResult(null)
  }, [pool, forms, mode, sentenceForms])

  useEffect(() => { next() }, [next])

  useEffect(() => {
    if (result) nextBtn.current?.focus()
    else input.current?.focus()
  }, [result, item])

  if (!item) {
    return (
      <div className="rounded-3xl bg-surface ring-1 ring-rule p-6">
        <p className="m-0 text-lg font-bold">Det finns inga verb att öva på här.</p>
        <p className="m-0 mt-1 text-muted">
          {mode === 'sentence' ? 'Det finns inga meningar för de här verben. Prova en annan övning eller fler verb.' : 'Välj fler verb i listan.'}
        </p>
      </div>
    )
  }

  const v = item.verb
  const submit = () => {
    if (result) return
    const d = diagnose(value, item.sentence ? headVerb(v) : v, item.form)
    record(v, item.form, gradeOf(d), d, value)
    setTally((t) => ({ n: t.n + 1, ok: t.ok + (d.type === 'correct' ? 1 : 0) }))
    setResult(d)
  }
  const ok = result?.type === 'correct'

  return (
    <section aria-label="Övning" className="pop" key={`${v.id}-${item.form}-${tally.n}`}>
      <div className="rounded-3xl bg-surface ring-1 ring-rule p-5 sm:p-8">
        <form onSubmit={(e) => { e.preventDefault(); submit() }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}>
          {item.sentence ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="m-0 text-muted">
                  Skriv rätt form av <span className="font-bold text-ink" lang="sv">{v.inf}</span> <span lang="en">({v.en})</span>
                </p>
                <Speak text={v.inf} />
              </div>
              <SentenceInput s={item.sentence} value={value} state={result ? (ok ? 'ok' : 'bad') : undefined}
                onChange={(x) => setValue(settings.shortcuts ? applyShortcuts(x) : x)} inputRef={input} disabled={!!result} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                {settings.showGroup && <LineBadge group={v.group} className="text-base" />}
                <h2 className="m-0 text-[2.6rem] sm:text-6xl font-extrabold leading-none" lang="sv">{v.inf}</h2>
                <Speak text={v.inf} />
              </div>
              <p className="m-0 mt-2 text-lg text-muted" lang="en">{v.en}</p>
              <label className="block mt-6">
                <span className="block text-lg mb-2">
                  Vad är <strong>{FORM_NAMES[item.form]}</strong>?
                  {item.form === 'sup' && <span className="text-muted"> Jag har …</span>}
                  {item.form === 'pret' && <span className="text-muted"> Igår …</span>}
                  {item.form === 'pres' && <span className="text-muted"> Varje dag …</span>}
                </span>
                <input ref={input} className="answer-input" lang="sv" value={value} readOnly={!!result}
                  data-state={result ? (ok ? 'ok' : 'bad') : undefined}
                  onChange={(e) => setValue(settings.shortcuts ? applyShortcuts(e.target.value) : e.target.value)} />
              </label>
            </>
          )}

          {!result && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <SwedishKeys />
              <button type="submit" className="btn btn-primary">Rätta</button>
            </div>
          )}
        </form>

        {result && <Feedback item={item} result={result} />}
        {result && (
          <div className="mt-5 flex justify-end">
            <button ref={nextBtn} type="button" onClick={next} className="btn btn-primary">Nästa</button>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-muted flex flex-wrap justify-between gap-2">
        <span>Enter rättar och går vidare.{settings.shortcuts && ' Skriv aa, ae, oe för å, ä, ö.'}</span>
        <span className="tabular-nums" aria-live="polite">Rätt {tally.ok} av {tally.n}</span>
      </p>
    </section>
  )
}

function SentenceInput({ s, value, state, onChange, inputRef, disabled }: {
  s: Sentence; value: string; state?: string; onChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>; disabled: boolean
}) {
  const cueIdx = s.before.indexOf(s.cue)
  const before = cueIdx >= 0 && s.cue !== '!'
    ? <>{s.before.slice(0, cueIdx)}<mark className="bg-transparent text-ink font-extrabold underline decoration-2 underline-offset-4 decoration-[color:var(--accent)]">{s.cue}</mark>{s.before.slice(cueIdx + s.cue.length)}</>
    : s.before
  return (
    <p className="mt-5 mb-0 text-2xl sm:text-[1.8rem] leading-[2.4] font-medium" lang="sv">
      {before}
      <input ref={inputRef} aria-label="Verbet som saknas" className="answer-input inline-block align-baseline !text-[inherit] !py-0.5 !px-2"
        style={{ width: `${Math.max(5, s.answer.length + 2)}ch` }} value={value} data-state={state} readOnly={disabled}
        onChange={(e) => onChange(e.target.value)} />
      {s.after}
    </p>
  )
}

function Feedback({ item, result }: { item: Item; result: Diagnosis }) {
  const v = item.verb
  const g = GROUP_BY_ID.get(v.group)!
  const ok = result.type === 'correct'
  const sentence = item.sentence ? `${item.sentence.before}${expected(headVerb(v), item.form)[0]}${item.sentence.after}` : null

  return (
    <div className="mt-6 border-t border-rule pt-5" aria-live="polite">
      <p className={`m-0 text-2xl font-extrabold display ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'Rätt!' : 'Inte riktigt'}</p>
      {!ok && <p className="m-0 mt-1">{result.message}</p>}
      {!ok && !item.sentence && <p className="m-0 mt-1 text-lg" lang="sv"><Word verb={v} form={item.form} /></p>}
      {sentence && (
        <p className="m-0 mt-2 flex items-center gap-2" lang="sv">
          <span className="text-lg">{cap(sentence)}</span>
          <Speak text={sentence} />
        </p>
      )}
      {item.sentence && !ok && (
        <p className="m-0 mt-1 text-muted">
          <strong className="text-ink">{item.sentence.cue === '!' ? 'Utropet' : cap(item.sentence.cue)}</strong> visar att det ska vara {FORM_NAMES[item.form]}.
        </p>
      )}

      <div className="mt-5 rounded-2xl bg-sunk p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <LineBadge group={v.group} />
          <span className="font-bold" lang="sv">{v.inf}</span>
          <Speak text={[v.inf, v.pres, v.pret, v.sup].join(', ')} label="Lyssna på alla former" />
        </div>
        <div className="mt-3"><Paradigm verb={v} focus={[item.form]} compact /></div>
        <p className="m-0 mt-3 text-[0.95rem]">
          <strong>{g.name}:</strong> {g.rule}{' '}
          <Link className="underline underline-offset-2 text-ink" to={v.family ? `/grupper/monster/${encodeURIComponent(v.family)}` : `/grupper/${v.group}`}>Läs mer</Link>
          {v.note && <span className="block mt-1 text-muted">{v.note}</span>}
        </p>
      </div>
    </div>
  )
}
