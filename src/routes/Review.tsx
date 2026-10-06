import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LineBadge, Word } from '../components/bits'
import { ERROR_LABELS, FORM_NAMES, type DiagnosisType } from '../lib/diagnose'
import { VERB_BY_ID } from '../lib/groups'
import { DAY, dueCards, isLeech } from '../lib/srs'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

export default function Review() {
  const { progress } = useStore()
  const now = Date.now()
  const due = dueCards(progress.cards, now)
  const tomorrow = Object.values(progress.cards).filter((c) => c.due > now && c.due <= now + DAY).length

  const mistakes = useMemo(() => {
    const byType = new Map<DiagnosisType, { id: string; n: number; answer: string }[]>()
    for (const [id, m] of Object.entries(progress.mistakes)) {
      byType.set(m.type, [...(byType.get(m.type) ?? []), { id, n: m.n, answer: m.answer }])
    }
    return [...byType.entries()]
      .map(([type, list]) => ({ type, list: list.sort((a, b) => b.n - a.n) }))
      .sort((a, b) => b.list.length - a.list.length)
  }, [progress.mistakes])

  const leeches = Object.values(progress.cards).filter(isLeech)

  return (
    <div className="grid gap-10">
      <header className="grid gap-4">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight">Repetition</h1>
        <div className="rounded-2xl bg-surface ring-1 ring-rule p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-4xl font-extrabold tabular-nums">{due.length}</p>
            <p className="m-0 text-muted">
              {due.length === 1 ? 'form is' : 'forms are'} due for review{tomorrow > 0 && `, ${tomorrow} more within a day`}.
            </p>
          </div>
          {due.length > 0
            ? <Link to="/?review=1" className="h-11 px-5 inline-flex items-center rounded-xl bg-ink text-paper font-bold no-underline">Review now</Link>
            : <Link to="/" className="h-11 px-5 inline-flex items-center rounded-xl ring-1 ring-rule bg-surface font-bold no-underline text-ink">Practise new verbs</Link>}
        </div>
        <p className="m-0 max-w-[62ch] text-muted">
          Each form you answer comes back after a growing interval: the next day, after three days, then about a week, and so on.
          A wrong answer brings it back within minutes.
        </p>
      </header>

      {leeches.length > 0 && (
        <section aria-labelledby="leech">
          <h2 id="leech" className="m-0 text-xl font-extrabold">Keeps slipping</h2>
          <p className="m-0 mt-1 mb-3 text-muted">Forms you have missed four times or more. Revisit the rule for their group.</p>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
            {leeches.map((c) => {
              const [vid, form] = c.id.split(':')
              const v = VERB_BY_ID.get(vid)
              if (!v) return null
              return (
                <li key={c.id}>
                  <Link to={form === 'group' ? `/learn/${v.group}` : v.family ? `/learn/family/${encodeURIComponent(v.family)}` : `/learn/${v.group}`}
                    className="inline-flex items-center gap-2 rounded-full bg-surface ring-1 ring-rule pl-1 pr-3 py-1 no-underline text-ink hover:bg-sunk">
                    <LineBadge group={v.group} />
                    <span lang="sv">{form === 'group' ? v.inf : <Word verb={v} form={form as FormKey} />}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="mist">
        <h2 id="mist" className="m-0 text-xl font-extrabold">Your mistakes by type</h2>
        {mistakes.length === 0 ? (
          <p className="m-0 mt-2 text-muted">No mistakes yet. When you get a form wrong it shows up here, sorted by the kind of error.</p>
        ) : (
          <div className="mt-4 grid gap-6">
            {mistakes.map(({ type, list }) => (
              <div key={type}>
                <h3 className="m-0 mb-2 text-lg font-bold">{ERROR_LABELS[type]} <span className="text-muted font-normal">({list.length})</span></h3>
                <ul className="m-0 p-0 list-none rounded-2xl bg-surface ring-1 ring-rule divide-y divide-[color:var(--rule)]">
                  {list.slice(0, 12).map(({ id, n, answer }) => {
                    const [vid, form] = id.split(':')
                    const v = VERB_BY_ID.get(vid)
                    if (!v) return null
                    return (
                      <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                        <LineBadge group={v.group} />
                        <span className="font-bold" lang="sv">{v.inf}</span>
                        <span className="text-muted text-sm">{form === 'group' ? 'group' : FORM_NAMES[form as FormKey]}</span>
                        <span lang="sv">
                          {answer && <s className="text-bad mr-2">{answer}</s>}
                          {form === 'group' ? <strong>group {v.group}</strong> : <Word verb={v} form={form as FormKey} />}
                        </span>
                        <span className="ml-auto text-sm text-muted tabular-nums">{n}×</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
