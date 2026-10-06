import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyShortcuts, expected } from '../lib/check'
import { diagnose, FORM_NAMES, type Diagnosis } from '../lib/diagnose'
import { formsFor } from '../lib/filters'
import { GROUPS, GROUP_BY_ID, route } from '../lib/groups'
import { headVerb, makeSentence, SENTENCE_FORMS, type Sentence } from '../lib/sentences'
import { pickNext } from '../lib/session'
import type { Grade } from '../lib/srs'
import type { Mode } from '../lib/storage'
import type { FormKey, Group, Verb } from '../lib/types'
import { useStore } from '../store'
import { LineBadge, Paradigm, Speak, SwedishKeys, Tags, Word } from './bits'

interface Item {
  verb: Verb
  asked: FormKey[]
  given?: FormKey
  sentence?: Sentence
  isNew: boolean
}

interface Result {
  diagnoses: Partial<Record<FormKey, Diagnosis>>
  groupPick?: Group
  allOk: boolean
}

const gradeOf = (d: Diagnosis): Grade => (d.type === 'correct' ? 'good' : d.type === 'accent' ? 'hard' : 'wrong')

export default function Drill({ pool, forms, mode }: { pool: Verb[]; forms: FormKey[]; mode: Mode }) {
  const { settings, progress, record } = useStore()
  const [item, setItem] = useState<Item | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [tally, setTally] = useState({ n: 0, ok: 0 })
  const recent = useRef<string[]>([])
  const cardsRef = useRef(progress.cards)
  useEffect(() => { cardsRef.current = progress.cards }, [progress.cards])
  const firstInput = useRef<HTMLInputElement>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)

  const sentenceForms = useMemo(() => {
    const f = forms.filter((x) => SENTENCE_FORMS.includes(x))
    return f.length ? f : ['pres', 'pret', 'sup'] as FormKey[]
  }, [forms])

  const next = useCallback(() => {
    const now = Date.now()
    const cards = cardsRef.current
    const remember = (id: string) => { recent.current = [id, ...recent.current].slice(0, Math.min(3, Math.floor(pool.length / 2))) }
    let it: Item | null = null

    if (mode === 'sentence') {
      const usable = pool.filter((v) => v.ctx && !v.modal)
      const skip = [...recent.current]
      for (let i = 0; i < 12 && !it; i++) {
        const p = pickNext(usable, sentenceForms, cards, now, skip)
        if (!p) break
        const sentence = makeSentence(p.verb, p.form)
        if (sentence) it = { verb: p.verb, asked: [p.form], sentence, isNew: p.kind === 'new' }
        else skip.push(p.verb.id)
      }
    } else if (mode === 'group') {
      const p = pickNext(pool, ['group' as FormKey], cards, now, recent.current)
      if (p) it = { verb: p.verb, asked: [], isNew: p.kind === 'new' }
    } else if (mode === 'paradigm') {
      const p = pickNext(pool, forms, cards, now, recent.current)
      if (p) {
        const all = formsFor(p.verb, [...new Set<FormKey>(['inf', ...forms])])
        const given = settings.hints === 'none' ? undefined : settings.hints === 'inf' ? 'inf' : all[Math.floor(Math.random() * all.length)]
        it = { verb: p.verb, asked: all.filter((f) => f !== given), given, isNew: p.kind === 'new' }
      }
    } else {
      const p = pickNext(pool, forms, cards, now, recent.current)
      if (p) it = { verb: p.verb, asked: [p.form], isNew: p.kind === 'new' }
    }

    if (it) remember(it.verb.id)
    setItem(it)
    setValues({})
    setResult(null)
  }, [pool, forms, mode, sentenceForms, settings.hints])

  useEffect(() => { next() }, [next])

  useEffect(() => {
    if (result) nextBtn.current?.focus()
    else firstInput.current?.focus()
  }, [result, item])

  const submit = (groupPick?: Group) => {
    if (!item || result) return
    const v = item.verb
    if (mode === 'group') {
      const ok = groupPick === v.group
      const d: Diagnosis = ok
        ? { type: 'correct', message: 'Rätt!' }
        : { type: 'wrongGroup', message: `${v.inf} is group ${v.group}, not ${groupPick}.` }
      record(v, 'group', ok ? 'good' : 'wrong', d, groupPick ?? '')
      setTally((t) => ({ n: t.n + 1, ok: t.ok + (ok ? 1 : 0) }))
      setResult({ diagnoses: {}, groupPick, allOk: ok })
      return
    }
    const target = item.sentence ? headVerb(v) : v
    const diagnoses: Result['diagnoses'] = {}
    for (const f of item.asked) {
      const d = diagnose(values[f] ?? '', target, f)
      diagnoses[f] = d
      record(v, f, gradeOf(d), d, values[f] ?? '')
    }
    const allOk = Object.values(diagnoses).every((d) => d.type === 'correct')
    setTally((t) => ({ n: t.n + 1, ok: t.ok + (allOk ? 1 : 0) }))
    setResult({ diagnoses, allOk })
  }

  useEffect(() => {
    if (mode !== 'group' || result) return
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < GROUPS.length && !e.metaKey && !e.ctrlKey) submit(GROUPS[idx].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!item) {
    return (
      <div className="rounded-2xl bg-surface ring-1 ring-rule p-6">
        <p className="m-0 text-lg font-bold">No verbs match these settings.</p>
        <p className="m-0 mt-1 text-muted">Add a group or level above to start practising.</p>
      </div>
    )
  }

  const v = item.verb
  const setVal = (f: string, raw: string) => setValues((s) => ({ ...s, [f]: settings.shortcuts ? applyShortcuts(raw) : raw }))
  const state = (f: FormKey) => (!result ? undefined : result.diagnoses[f]?.type === 'correct' ? 'ok' : 'bad')

  return (
    <section aria-label="Practice" className="pop" key={`${v.id}-${item.asked.join()}-${tally.n}`}>
      <div className="flex items-baseline justify-between gap-4 mb-3 text-muted">
        <span className="text-sm">
          {item.isNew ? 'New verb' : 'Review'}
        </span>
        <span className="text-sm tabular-nums" aria-live="polite">
          Rätt {tally.ok}/{tally.n}{tally.n > 0 && <span> ({Math.round((tally.ok / tally.n) * 100)}%)</span>}
        </span>
      </div>

      <div className="rounded-2xl bg-surface ring-1 ring-rule p-5 sm:p-7">
        <form
          onSubmit={(e) => { e.preventDefault(); submit() }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        >
          <Prompt item={item} mode={mode} showGroup={settings.showGroup} />

          {mode === 'group' ? (
            <GroupChoice verb={v} result={result} onPick={submit} />
          ) : mode === 'sentence' && item.sentence ? (
            <SentenceInput
              s={item.sentence} value={values[item.asked[0]] ?? ''} state={state(item.asked[0])}
              onChange={(x) => setVal(item.asked[0], x)} inputRef={firstInput} disabled={!!result}
            />
          ) : (
            <div className={`mt-5 grid gap-4 ${item.asked.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {item.given && (
                <div>
                  <span className="block text-sm text-muted mb-1">{FORM_NAMES[item.given]}</span>
                  <div className="text-2xl font-medium px-1 py-2" lang="sv">{v[item.given as 'inf']}</div>
                </div>
              )}
              {item.asked.map((f, i) => (
                <label key={f} className="block">
                  <span className="block text-sm font-bold mb-1">
                    {FORM_NAMES[f]}{f === 'sup' && <span className="font-normal text-muted"> (har …)</span>}
                  </span>
                  <input
                    ref={i === 0 ? firstInput : undefined}
                    className="answer-input"
                    lang="sv"
                    value={values[f] ?? ''}
                    data-state={state(f)}
                    readOnly={!!result}
                    onChange={(e) => setVal(f, e.target.value)}
                  />
                  {result && result.diagnoses[f]?.type !== 'correct' && (
                    <span className="block mt-1 text-[0.95rem]" lang="sv">
                      <Word verb={v} form={f} />
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {mode !== 'group' && !result && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <SwedishKeys />
              <button type="submit" className="h-11 px-5 rounded-xl bg-ink text-paper font-bold">
                Check
              </button>
            </div>
          )}
        </form>

        {result && <Feedback item={item} result={result} />}

        {result && (
          <div className="mt-5 flex justify-end">
            <button ref={nextBtn} type="button" onClick={next} className="h-11 px-5 rounded-xl bg-ink text-paper font-bold">
              Next
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">
        Press Enter to check and to continue.{settings.shortcuts && ' Type aa, ae, oe for å, ä, ö.'}
        {mode === 'group' && ' Keys 1–5 pick a group.'}
      </p>
    </section>
  )
}

function Prompt({ item, mode, showGroup }: { item: Item; mode: Mode; showGroup: boolean }) {
  const v = item.verb
  if (mode === 'sentence') {
    return (
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-muted">
          Fill in <span className="font-bold text-ink" lang="sv">{v.inf}</span> <span>({v.en})</span>
        </p>
        <Speak text={v.inf} />
      </div>
    )
  }
  const showHeadword = mode !== 'paradigm' || item.given === 'inf'
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        {showGroup && mode !== 'group' && <LineBadge group={v.group} className="text-base" />}
        {showHeadword && (
          <h2 className="m-0 text-[2.4rem] sm:text-5xl font-extrabold tracking-tight leading-none" lang="sv">{v.inf}</h2>
        )}
        {showHeadword && <Speak text={v.inf} />}
      </div>
      <p className="m-0 mt-2 text-lg text-muted">{v.en}</p>
      {mode === 'single' && (
        <p className="m-0 mt-4 text-lg">
          What is the <strong>{FORM_NAMES[item.asked[0]]}</strong>?
          {item.asked[0] === 'sup' && <span className="text-muted"> Jag har …</span>}
          {item.asked[0] === 'pret' && <span className="text-muted"> Igår …</span>}
        </p>
      )}
      {mode === 'group' && (
        <p className="m-0 mt-4 text-xl" lang="sv">
          <span className="text-muted">presens</span> <strong>{v.pres}</strong>
          <span className="text-muted ml-4">preteritum</span> <strong>{v.pret}</strong>
        </p>
      )}
    </div>
  )
}

function SentenceInput({ s, value, state, onChange, inputRef, disabled }: {
  s: Sentence; value: string; state?: string; onChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>; disabled: boolean
}) {
  const cueIdx = s.before.indexOf(s.cue)
  const before = cueIdx >= 0 && s.cue !== '!'
    ? <>{s.before.slice(0, cueIdx)}<mark className="bg-transparent text-ink font-extrabold underline decoration-2 underline-offset-4 decoration-focus">{s.cue}</mark>{s.before.slice(cueIdx + s.cue.length)}</>
    : s.before
  const width = Math.max(5, s.answer.length + 2)
  return (
    <p className="mt-5 mb-0 text-2xl sm:text-[1.8rem] leading-[2.4] font-medium" lang="sv">
      {before}
      <input
        ref={inputRef}
        aria-label="Missing verb"
        className="answer-input inline-block align-baseline !text-[inherit] !py-0.5 !px-2"
        style={{ width: `${width}ch` }}
        value={value}
        data-state={state}
        readOnly={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {s.after}
    </p>
  )
}

function GroupChoice({ verb, result, onPick }: { verb: Verb; result: Result | null; onPick: (g: Group) => void }) {
  return (
    <div className="mt-6 grid grid-cols-5 gap-2" role="group" aria-label="Choose the group">
      {GROUPS.map((g, i) => {
        const picked = result?.groupPick === g.id
        const correct = result && g.id === verb.group
        return (
          <button
            key={g.id}
            type="button"
            disabled={!!result}
            onClick={() => onPick(g.id)}
            data-group={g.id}
            className={`flex flex-col items-center gap-1 rounded-xl py-3 ring-1 ring-inset ${
              correct ? 'ring-2 ring-ok bg-sunk' : picked ? 'ring-2 ring-bad' : 'ring-rule hover:bg-sunk'
            }`}
          >
            <span className="line-badge text-lg">{g.id}</span>
            <span className="text-xs text-muted hidden sm:block">{g.short}</span>
            <span className="sr-only">key {i + 1}</span>
          </button>
        )
      })}
    </div>
  )
}

function Feedback({ item, result }: { item: Item; result: Result }) {
  const v = item.verb
  const g = GROUP_BY_ID.get(v.group)!
  const messages = Object.entries(result.diagnoses)
    .filter(([, d]) => d && d.type !== 'correct')
    .map(([f, d]) => ({ f: f as FormKey, d: d! }))
  const sentenceAnswer = item.sentence
    ? `${item.sentence.before}${expected(headVerb(v), item.asked[0])[0]}${item.sentence.after}`
    : null

  return (
    <div className="mt-6 border-t border-rule pt-5" aria-live="polite">
      <p className={`m-0 text-xl font-extrabold ${result.allOk ? 'text-ok' : 'text-bad'}`}>
        {result.allOk ? 'Rätt!' : 'Not quite'}
      </p>
      {messages.map(({ f, d }) => (
        <p key={f} className="m-0 mt-1">{item.asked.length > 1 && <strong>{FORM_NAMES[f]}: </strong>}{d.message}</p>
      ))}
      {sentenceAnswer && (
        <p className="m-0 mt-2 flex items-center gap-2" lang="sv">
          <span className="text-lg">{sentenceAnswer.charAt(0).toUpperCase() + sentenceAnswer.slice(1)}</span>
          <Speak text={sentenceAnswer} />
        </p>
      )}
      {item.sentence && !result.allOk && (
        <p className="m-0 mt-1 text-muted">
          <strong className="text-ink">{item.sentence.cue === '!' ? 'An exclamation' : item.sentence.cue}</strong> signals the {FORM_NAMES[item.asked[0]]}.
        </p>
      )}

      {result.groupPick !== undefined && (
        <ol className="m-0 mt-3 p-0 list-none grid gap-1">
          {route(v).map((s) => (
            <li key={s.q} className="flex flex-wrap gap-x-2"><span className="text-muted">{s.q}</span> <span lang="sv">{s.a}</span>
              {s.group && <span className="font-bold">→ group {s.group}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 rounded-xl bg-sunk p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <LineBadge group={v.group} />
          <span className="font-bold" lang="sv">{v.inf}</span>
          <span className="text-muted">{v.en}</span>
          <Speak text={[v.inf, v.pres, v.pret, v.sup].join(', ')} label="Listen to all forms" />
          <Tags verb={v} />
        </div>
        <div className="mt-3"><Paradigm verb={v} focus={item.asked} compact /></div>
        <p className="m-0 mt-3 text-[0.95rem]">
          <strong>{g.name}:</strong> {g.rule}{' '}
          <Link className="underline underline-offset-2 text-ink" to={`/learn/${v.group}`}>How {g.name.toLowerCase()} works</Link>
          {v.note && <span className="block mt-1 text-muted">{v.note}</span>}
        </p>
      </div>
    </div>
  )
}
