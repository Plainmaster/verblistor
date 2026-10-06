import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chip, Segmented } from '../components/bits'
import Drill from '../components/Drill'
import { FORM_NAMES } from '../lib/diagnose'
import { ALL_GROUPS, ALL_LEVELS, PRESETS, SFI_LABEL, filterVerbs, type Filter, type Focus } from '../lib/filters'
import { VERBS } from '../lib/groups'
import { dueCards } from '../lib/srs'
import type { Hints, Mode } from '../lib/storage'
import { today } from '../lib/storage'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

const MODES: { value: Mode; label: string; title: string }[] = [
  { value: 'single', label: 'One form', title: 'One form at a time: fast repetition' },
  { value: 'sentence', label: 'In a sentence', title: 'Fill the verb into a sentence; the time word tells you the tense' },
  { value: 'paradigm', label: 'All forms', title: 'Fill in the whole row of forms' },
  { value: 'group', label: 'Which group?', title: 'Recognise the conjugation group' },
]

const FOCUS: { value: Focus; label: string }[] = [
  { value: 'all', label: 'All verbs' },
  { value: 'top', label: '★ Top 100' },
  { value: 'irregular', label: 'Irregular only' },
  { value: 'sVerb', label: 's-verbs' },
  { value: 'reflexive', label: 'Reflexive' },
  { value: 'particle', label: 'Particle verbs' },
]

const PRACTICE_FORMS: FormKey[] = ['inf', 'pres', 'pret', 'sup', 'imp', 'part']

export default function Practice() {
  const { settings, update, progress } = useStore()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const reviewOnly = params.get('review') === '1'

  const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x])
  const setFilter = (patch: Partial<Filter>) => update({ filter: { ...settings.filter, ...patch } })

  const pool = useMemo(() => {
    const base = filterVerbs(VERBS, settings.filter)
    if (!reviewOnly) return base
    const due = new Set(dueCards(progress.cards, Date.now()).map((c) => c.id.split(':')[0]))
    return VERBS.filter((v) => due.has(v.id))
  }, [settings.filter, reviewOnly])

  const day = progress.days[today()]
  const done = day?.n ?? 0
  const activePreset = PRESETS.find((p) => JSON.stringify(p.filter) === JSON.stringify(settings.filter))

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight">Öva</h1>
          <p className="m-0 text-muted">
            {reviewOnly
              ? `Reviewing ${pool.length} verbs that are due.`
              : `${pool.length} verbs selected${activePreset ? `: ${activePreset.label}` : ''}.`}
          </p>
        </div>
        <DailyGoal done={done} goal={settings.dailyGoal} />
      </header>

      {reviewOnly ? (
        <button type="button" className="justify-self-start text-sm underline underline-offset-2" onClick={() => setParams({})}>
          Back to my selection
        </button>
      ) : (
        <section aria-label="What to practise" className="grid gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                aria-pressed={activePreset?.id === p.id}
                onClick={() => update({ filter: p.filter, ...(p.forms ? { forms: p.forms } : { forms: ['pres', 'pret', 'sup'] }) })}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-left ring-1 ring-inset ${
                  activePreset?.id === p.id ? 'bg-ink text-paper ring-ink' : 'bg-surface ring-rule hover:bg-sunk'
                }`}
              >
                <span className="block font-bold leading-tight">{p.label}</span>
                <span className={`block text-xs leading-tight mt-0.5 ${activePreset?.id === p.id ? 'opacity-80' : 'text-muted'}`}>{p.hint}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Practice mode" value={settings.mode} options={MODES} onChange={(mode) => update({ mode })} />
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="h-9 px-3 rounded-xl text-[0.95rem] font-bold ring-1 ring-inset ring-rule bg-surface hover:bg-sunk"
            >
              {open ? 'Hide options' : 'Groups, levels and forms'}
            </button>
          </div>

          {open && (
            <div className="grid gap-4 rounded-2xl bg-surface ring-1 ring-rule p-4 sm:p-5">
              <Row label="Groups">
                {ALL_GROUPS.map((g) => (
                  <Chip key={g} group={g} on={settings.filter.groups.includes(g)} onClick={() => setFilter({ groups: toggle(settings.filter.groups, g) })}>
                    {g}
                  </Chip>
                ))}
              </Row>
              <Row label="Level">
                {ALL_LEVELS.map((l) => (
                  <Chip key={l} on={settings.filter.levels.includes(l)} title={`About ${SFI_LABEL[l]}`} onClick={() => setFilter({ levels: toggle(settings.filter.levels, l) })}>
                    {l} <span className="font-normal opacity-75">{SFI_LABEL[l]}</span>
                  </Chip>
                ))}
              </Row>
              <Row label="Focus">
                {FOCUS.map((f) => (
                  <Chip key={f.value} on={settings.filter.focus === f.value} onClick={() => setFilter({ focus: f.value })}>{f.label}</Chip>
                ))}
              </Row>
              {settings.mode !== 'group' && (
                <Row label="Forms">
                  {PRACTICE_FORMS.map((f) => (
                    <Chip
                      key={f}
                      on={settings.forms.includes(f)}
                      onClick={() => {
                        const next = toggle(settings.forms, f)
                        if (next.length) update({ forms: PRACTICE_FORMS.filter((x) => next.includes(x)) })
                      }}
                    >
                      {FORM_NAMES[f]}
                    </Chip>
                  ))}
                </Row>
              )}
              {settings.mode === 'paradigm' && (
                <Row label="Given">
                  <Segmented<Hints>
                    label="Which form is given"
                    value={settings.hints}
                    onChange={(hints) => update({ hints })}
                    options={[
                      { value: 'inf', label: 'Infinitive' },
                      { value: 'random', label: 'Random form' },
                      { value: 'none', label: 'Only English' },
                    ]}
                  />
                </Row>
              )}
              <Row label="Show">
                <Chip on={settings.showGroup} onClick={() => update({ showGroup: !settings.showGroup })}>Group badge</Chip>
                <Chip on={settings.shortcuts} onClick={() => update({ shortcuts: !settings.shortcuts })}>aa → å shortcuts</Chip>
                <Chip on={settings.speech} onClick={() => update({ speech: !settings.speech })}>Pronunciation</Chip>
              </Row>
            </div>
          )}
        </section>
      )}

      <Drill pool={pool} forms={settings.forms} mode={settings.mode} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[7rem_1fr] gap-2 items-start">
      <span className="text-sm font-bold text-muted pt-2">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function DailyGoal({ done, goal }: { done: number; goal: number }) {
  const pct = Math.min(1, done / goal)
  return (
    <div className="flex items-center gap-3" title={`${done} of ${goal} answers today`}>
      <svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--rule)" strokeWidth="4" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--ok)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${pct * 94.25} 94.25`} />
      </svg>
      <span className="text-sm leading-tight">
        <span className="block font-bold tabular-nums">{done}/{goal}</span>
        <span className="text-muted">today</span>
      </span>
    </div>
  )
}
