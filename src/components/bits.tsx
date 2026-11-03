import { useEffect, useState } from 'react'
import { segments } from '../lib/conjugate'
import { isTop } from '../lib/filters'
import { canSpeak, onVoicesReady, speak } from '../lib/speech'
import type { FormKey, Group, Verb } from '../lib/types'
import { useStore } from '../store'

/** The group as a quiet mark in the group's ink; `label` adds Kjellin's detail (2a omlj, 4c). */
export function LineBadge({ group, label, className = '' }: { group: Group; label?: string; className?: string }) {
  return (
    <span className={`line-badge ${className}`} data-group={group} title={label?.endsWith('omlj') ? `Grupp ${group}, omljud: vokalen byts, ändelserna är de vanliga` : `Grupp ${label ?? group}`}>
      {label ?? group}
    </span>
  )
}

/** A verb form with its ending (or changed vowel) highlighted in the group colour. */
export function Word({ verb, form, text }: { verb: Verb; form?: FormKey; text?: string }) {
  const value = text ?? (form === 'part' ? verb.part : form ? verb[form] : verb.inf) ?? '–'
  if (value === '–') return <span className="text-muted">–</span>
  const rare = !!form && !!verb.rare?.includes(form)
  return (
    <span data-group={verb.group} lang="sv" className={rare ? 'rare' : undefined} title={rare ? 'Finns, men används nästan aldrig. Säg hellre något annat.' : undefined}>
      {segments(value, verb.inf, verb.group, verb.imp).map((s, i) =>
        s.kind === 'stem' ? <span key={i}>{s.text}</span> : <span key={i} className={s.kind}>{s.text}</span>,
      )}
    </span>
  )
}

export function useCanSpeak(): boolean {
  const { settings } = useStore()
  const [ok, setOk] = useState(canSpeak)
  useEffect(() => onVoicesReady(() => setOk(canSpeak())), [])
  return ok && settings.speech
}

/** A verb form you can click to hear just that form. */
export function Say({ verb, form, plain = false }: { verb: Verb; form: FormKey; plain?: boolean }) {
  const ok = useCanSpeak()
  const text = form === 'part' ? verb.part : verb[form]
  // `plain` is the infinitive as the row's heading: no ending marked, the row's own styling for rare forms
  const shown = plain ? <span lang="sv">{text}</span> : <Word verb={verb} form={form} />
  // rare forms are not read aloud: they are not meant to be used, and the voice may say another word (bort)
  if (!ok || !text || verb.rare?.includes(form)) return shown
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); speak(text) }}
      title={`Lyssna: ${text}`}
      className="text-left rounded-[2px] -mx-1 px-1 hover:bg-sunk hover:underline hover:decoration-dotted hover:underline-offset-4 cursor-pointer"
    >
      {shown}
    </button>
  )
}

export function Speak({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const ok = useCanSpeak()
  if (!ok) return null
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); speak(text) }}
      className={`inline-grid place-items-center size-9 shrink-0 rounded-[2px] text-muted hover:text-ink hover:bg-sunk print:hidden ${className}`}
      aria-label={label ?? `Lyssna: ${text}`}
      title="Lyssna"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  )
}

/** The order used in Swedish SFI grammar tables. */
export const PARADIGM: FormKey[] = ['imp', 'inf', 'pres', 'pret', 'sup']

export function Tags({ verb }: { verb: Verb }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5 align-middle">
      {isTop(verb) && <Tag tone="ink" title="Bland de 100 vanligaste verben">Topp 100</Tag>}
      {verb.sVerb && <Tag title="Slutar alltid på -s">s-verb</Tag>}
      {verb.particle && <Tag title="Betonad partikel">partikelverb</Tag>}
      {verb.reflexive && <Tag>reflexivt</Tag>}
    </span>
  )
}

export function Tag({ children, tone, title }: { children: React.ReactNode; tone?: 'ink' | 'g4'; title?: string }) {
  const cls = tone === 'ink'
    ? 'bg-ink text-paper ring-1 ring-inset ring-ink'
    : tone === 'g4'
      ? 'text-[color:var(--g4)] ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--g4)_60%,transparent)]'
      : 'text-muted ring-1 ring-inset ring-rule-strong'
  return <span title={title} className={`inline-flex items-center rounded-[2px] px-1.5 text-[0.95rem] leading-6 sc ${cls}`}>{children}</span>
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
    <div className="flex gap-1.5 sm:gap-2" aria-label="Svenska bokstäver" title="Det går också att skriva aa, ae och oe">
      {['å', 'ä', 'ö'].map((c) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); insert(c) }}
          className="h-10 min-w-9 px-2.5 sm:h-11 sm:min-w-11 sm:px-3 rounded-[3px] bg-surface border border-rule-strong shadow-[0_2px_0_var(--rule-strong)] text-xl font-semibold hover:bg-sunk active:translate-y-0.5 active:shadow-none"
          lang="sv"
        >
          {c}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string; title?: string }[]; onChange: (v: T) => void; label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-[2px] ring-1 ring-inset ring-rule-strong divide-x divide-[color:var(--rule-strong)] overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`px-3.5 max-sm:px-3 h-9 text-[0.98rem] ${value === o.value ? 'bg-ink text-paper font-semibold' : 'text-muted hover:text-ink hover:bg-surface'}`}
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
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[2px] text-[0.98rem] ring-1 ring-inset transition-colors ${
        on ? 'bg-ink text-paper ring-ink font-semibold' : 'bg-transparent text-muted ring-rule-strong hover:text-ink hover:ring-ink'
      }`}
    >
      {group && <span className="size-2.5 rounded-[1px]" style={{ background: 'var(--g)' }} aria-hidden />}
      {children}
    </button>
  )
}

export type Icon = 'bulb' | 'puzzle' | 'info' | 'book'
const ICON_TITLE: Record<Icon, string> = { bulb: 'Tips', puzzle: 'Betydelsen', info: 'Bra att veta', book: 'Gruppen' }

/** Line icons in the same hand as the eyes and the speaker: a bulb for remembering the forms,
 *  a puzzle piece for what verb and particle mean together, an i for the rest. */
export function TipIcon({ icon }: { icon: Icon }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 mt-0.5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      role="img" aria-label={ICON_TITLE[icon]}>
      <title>{ICON_TITLE[icon]}</title>
      {icon === 'bulb' && <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></>}
      {icon === 'puzzle' && <path d="M5 8h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19h-3.5a2 2 0 1 0-4 0H5v-3.5a2 2 0 1 0 0-4Z" />}
      {icon === 'book' && <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" /></>}
      {icon === 'info' && <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" strokeWidth="2.2" /></>}
    </svg>
  )
}
