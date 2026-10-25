import { useRef, useState } from 'react'
import { today } from '../lib/storage'
import { useStore } from '../store'

/** Sun or moon in the header: switches between the light and the dark page. */
export function ThemeButton() {
  const { settings, update } = useStore()
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const label = dark ? 'Ljust läge' : 'Mörkt läge'
  return (
    <button type="button" onClick={() => update({ theme: dark ? 'light' : 'dark' })} aria-label={label} title={label}
      className="inline-grid place-items-center size-9 rounded-[2px] text-muted hover:text-ink hover:bg-sunk">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />}
      </svg>
    </button>
  )
}

/** The cog in the header: appearance, practice preferences and the learner's own data, in one place. */
export default function SettingsButton() {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} aria-label="Inställningar" title="Inställningar"
        className="inline-grid place-items-center size-9 rounded-[2px] text-muted hover:text-ink hover:bg-sunk">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      </button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
        className="m-auto w-[min(34rem,calc(100%-2rem))] bg-paper text-ink p-0 callout backdrop:bg-black/50" aria-label="Inställningar">
        <Settings onClose={() => ref.current?.close()} />
      </dialog>
    </>
  )
}

function Settings({ onClose }: { onClose: () => void }) {
  const { settings, update, exportData, importData, resetProgress } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `verblistor-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Säkerhetskopian är sparad.')
  }

  const upload = async (f: File) => {
    try {
      importData(await f.text())
      setMsg('Säkerhetskopian är återställd.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Filen gick inte att läsa.')
    }
  }

  const check = (on: boolean, label: string, hint: string, onChange: () => void) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" className="mt-1.5 size-4 accent-[color:var(--ink)]" checked={on} onChange={onChange} />
      <span>{label}<span className="block text-sm italic text-muted">{hint}</span></span>
    </label>
  )

  return (
    <div className="p-5 sm:p-7 grid gap-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 text-2xl font-bold">Inställningar</h2>
        <button type="button" onClick={onClose} className="size-9 -mt-1 -mr-2 rounded-[2px] hover:bg-sunk text-2xl leading-none" aria-label="Stäng">×</button>
      </div>

      <section className="grid gap-3">
        <h3 className="m-0 sc text-[1rem] text-muted">Övning</h3>
        {check(settings.speech, 'Uppläsning', 'Klicka på en form för att höra den.', () => update({ speech: !settings.speech }))}
      </section>

      <section className="grid gap-3">
        <h3 className="m-0 sc text-[1rem] text-muted">Dina resultat</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={download} className="btn btn-quiet">Spara säkerhetskopia</button>
          <button type="button" onClick={() => file.current?.click()} className="btn btn-quiet">Återställ</button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {confirmReset ? (
            <span className="flex items-center gap-2">
              <span className="text-sm">Radera allt?</span>
              <button type="button" onClick={() => { resetProgress(); setConfirmReset(false); setMsg('Allt är raderat.') }} className="btn bg-bad text-white">Radera</button>
              <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-quiet">Avbryt</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="btn text-bad hover:bg-sunk">Radera mina resultat</button>
          )}
        </div>
        <p className="m-0 text-sm text-muted" aria-live="polite">
          {msg || 'Dina resultat sparas bara i den här webbläsaren. Spara en säkerhetskopia om du vill flytta dem till en annan enhet.'}
        </p>
      </section>
    </div>
  )
}
