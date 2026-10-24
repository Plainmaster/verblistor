import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, Segmented, ShareButton } from '../components/bits'
import Drill from '../components/Drill'
import TableDrill from '../components/TableDrill'
import { FORM_NAMES } from '../lib/diagnose'
import { describe, useSelection } from '../lib/selection'
import type { Hints, Mode } from '../lib/storage'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

const MODES: { value: Mode; label: string; title: string }[] = [
  { value: 'table', label: 'Tabell', title: 'Fyll i en hel sida med verb' },
  { value: 'single', label: 'En i taget', title: 'En form i taget, med repetition av det du missar' },
  { value: 'sentence', label: 'I meningar', title: 'Tidsordet (igår, varje dag, har) visar vilket tempus' },
]

const FORMS: FormKey[] = ['pres', 'pret', 'sup', 'imp', 'part']

export default function Practice() {
  const { settings, update } = useStore()
  const { filter, verbs, query } = useSelection()
  const [open, setOpen] = useState(false)
  const toggle = (f: FormKey) => {
    const next = settings.forms.includes(f) ? settings.forms.filter((x) => x !== f) : [...settings.forms, f]
    if (next.length) update({ forms: FORMS.filter((x) => next.includes(x)) })
  }
  const columns = useMemo<FormKey[]>(() => ['inf', ...settings.forms.filter((f) => f !== 'part')], [settings.forms])

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-4xl sm:text-5xl font-extrabold">Öva</h1>
          <p className="m-0 mt-2 text-lg text-muted">
            {verbs.length} verb: {describe(filter)}.{' '}
            <Link to={`/${query}`} className="text-ink underline underline-offset-2">Ändra urval</Link>
          </p>
        </div>
        <ShareButton label="Dela övningen" />
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Övning" value={settings.mode} options={MODES} onChange={(mode) => update({ mode })} />
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="h-9 px-3 rounded-full text-[0.95rem] font-bold text-muted hover:text-ink">
          {open ? 'Dölj inställningar' : 'Inställningar'}
        </button>
      </div>

      {open && (
        <div className="grid gap-4 rounded-3xl bg-surface ring-1 ring-rule p-4 sm:p-6">
          <Row label="Former">
            {FORMS.filter((f) => settings.mode !== 'table' || f !== 'part').map((f) => (
              <Chip key={f} on={settings.forms.includes(f)} onClick={() => toggle(f)}>{FORM_NAMES[f]}</Chip>
            ))}
          </Row>
          {settings.mode === 'table' && (
            <Row label="Ledtråd">
              <Segmented<Hints> label="Vilken form som är ifylld" value={settings.hints} onChange={(hints) => update({ hints })}
                options={[{ value: 'inf', label: 'Infinitiv' }, { value: 'random', label: 'Slumpad form' }, { value: 'en', label: 'Bara engelska' }]} />
            </Row>
          )}
          <Row label="Visa">
            <Chip on={settings.showGroup} onClick={() => update({ showGroup: !settings.showGroup })}>Grupp</Chip>
            <Chip on={settings.speech} onClick={() => update({ speech: !settings.speech })}>Uppläsning</Chip>
            <Chip on={settings.shortcuts} onClick={() => update({ shortcuts: !settings.shortcuts })}>aa → å</Chip>
          </Row>
        </div>
      )}

      {settings.mode === 'table'
        ? <TableDrill pool={verbs} columns={columns} hints={settings.hints} />
        : <Drill pool={verbs} forms={settings.forms} mode={settings.mode} />}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[6rem_1fr] gap-2 items-start">
      <span className="text-sm font-bold text-muted pt-2">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
