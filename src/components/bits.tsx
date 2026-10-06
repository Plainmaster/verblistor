import { useEffect, useState } from 'react'
import { segments } from '../lib/conjugate'
import { FORM_NAMES } from '../lib/diagnose'
import { SFI_LABEL, isTop } from '../lib/filters'
import { canSpeak, onVoicesReady, speak } from '../lib/speech'
import type { FormKey, Group, Verb } from '../lib/types'
import { useStore } from '../store'

export function LineBadge({ group, className = '' }: { group: Group; className?: string }) {
  return (
    <span className={`line-badge ${className}`} data-group={group} role="img" aria-label={`Group ${group}`}>
      {group}
    </span>
  )
}

/** A verb form with its ending (or changed vowel) highlighted in the group colour. */
export function Word({ verb, form, text }: { verb: Verb; form?: FormKey; text?: string }) {
  const value = text ?? (form === 'part' ? verb.part : form ? verb[form] : verb.inf) ?? '–'
  if (value === '–') return <span className="text-muted">–</span>
  return (
    <span data-group={verb.group} lang="sv">
      {segments(value, verb.inf, verb.group).map((s, i) =>
        s.kind === 'stem' ? <span key={i}>{s.text}</span> : <span key={i} className={s.kind}>{s.text}</span>,
      )}
    </span>
  )
}

export function Speak({ text, label }: { text: string; label?: string }) {
  const { settings } = useStore()
  const [ok, setOk] = useState(canSpeak)
  useEffect(() => onVoicesReady(() => setOk(canSpeak())), [])
  if (!ok || !settings.speech) return null
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className="inline-grid place-items-center size-9 rounded-full text-muted hover:text-ink hover:bg-sunk"
      aria-label={label ?? `Listen: ${text}`}
      title="Listen"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  )
}

const PARADIGM: FormKey[] = ['inf', 'pres', 'pret', 'sup', 'imp']

/** The five main forms in a row, endings highlighted; `focus` marks the form that was asked. */
export function Paradigm({ verb, focus, compact = false }: { verb: Verb; focus?: FormKey[]; compact?: boolean }) {
  return (
    <dl className={`grid grid-cols-2 sm:grid-cols-5 gap-x-4 ${compact ? 'gap-y-1' : 'gap-y-3'}`}>
      {PARADIGM.map((k) => (
        <div key={k} className={`min-w-0 ${focus?.includes(k) ? '' : ''}`}>
          <dt className={`text-sm ${focus?.includes(k) ? 'text-ink font-bold' : 'text-muted'}`}>{FORM_NAMES[k]}</dt>
          <dd className={`m-0 ${compact ? 'text-lg' : 'text-xl'} font-medium break-words`}>
            {k === 'sup' && verb[k] ? <span className="text-muted font-normal">har </span> : null}
            <Word verb={verb} form={k} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Tags({ verb }: { verb: Verb }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5 align-middle">
      {isTop(verb) && <Tag tone="ink" title={`Frequency rank ${verb.freq} among Swedish verbs`}>★ Top 100</Tag>}
      {verb.irregular && <Tag tone="g4">Irregular</Tag>}
      {verb.family && <Tag tone="g4" title="Vowel pattern: infinitive – preteritum – supinum">{verb.family}</Tag>}
      {verb.sVerb && <Tag>s-verb</Tag>}
      {verb.particle && <Tag title="Stressed particle">particle</Tag>}
      {verb.reflexive && <Tag>reflexive</Tag>}
      {verb.modal && <Tag>modal</Tag>}
      <Tag title={`About ${SFI_LABEL[verb.cefr]}`}>{verb.cefr}</Tag>
    </span>
  )
}

export function Tag({ children, tone, title }: { children: React.ReactNode; tone?: 'ink' | 'g4'; title?: string }) {
  const cls = tone === 'ink'
    ? 'bg-ink text-paper'
    : tone === 'g4'
      ? 'text-ink bg-[color:color-mix(in_srgb,var(--g4)_14%,transparent)] ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--g4)_55%,transparent)]'
      : 'text-muted ring-1 ring-inset ring-rule'
  return <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.8rem] font-bold leading-5 ${cls}`}>{children}</span>
}

/** On-screen å ä ö that type into whichever input has focus. */
export function SwedishKeys() {
  const insert = (ch: string) => {
    const el = document.activeElement
    if (!(el instanceof HTMLInputElement)) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, el.value.slice(0, start) + ch + el.value.slice(end))
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.setSelectionRange(start + 1, start + 1)
  }
  return (
    <div className="flex gap-2" aria-label="Swedish letters">
      {['å', 'ä', 'ö'].map((c) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); insert(c) }}
          className="h-11 min-w-11 px-3 rounded-xl bg-surface ring-1 ring-rule text-xl font-bold hover:bg-sunk active:translate-y-px"
          lang="sv"
        >
          {c}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string; title?: string }[]; onChange: (v: T) => void; label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-xl bg-sunk p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`px-3 h-9 rounded-lg text-[0.95rem] font-bold ${value === o.value ? 'bg-surface text-ink shadow-sm ring-1 ring-rule' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({ on, onClick, children, group, title }: {
  on: boolean; onClick: () => void; children: React.ReactNode; group?: Group; title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      title={title}
      data-group={group}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[0.95rem] font-bold ring-1 ring-inset transition-colors ${
        on ? 'bg-ink text-paper ring-ink' : 'bg-surface text-muted ring-rule hover:text-ink'
      }`}
    >
      {group && <span className="size-2.5 rounded-full" style={{ background: 'var(--g)' }} aria-hidden />}
      {children}
    </button>
  )
}
