import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineBadge, Segmented, Word } from '../components/bits'
import { ERROR_LABELS, FORM_NAMES, isCareless, type DiagnosisType } from '../lib/diagnose'
import { VERB_BY_ID } from '../lib/groups'
import { today, type Theme } from '../lib/storage'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

/** Like the original's "Misstag": every form you got wrong, until you get it right. */
export default function Mistakes() {
  const { progress } = useStore()

  const { byType, ids, count } = useMemo(() => {
    const real = Object.entries(progress.mistakes).filter(([, m]) => !isCareless(m.type))
    const map = new Map<DiagnosisType, { id: string; n: number; answer: string }[]>()
    for (const [id, m] of real) {
      map.set(m.type, [...(map.get(m.type) ?? []), { id, n: m.n, answer: m.answer }])
    }
    const byType = [...map.entries()]
      .map(([type, list]) => ({ type, list: list.sort((a, b) => b.n - a.n) }))
      .sort((a, b) => b.list.length - a.list.length)
    const ids = [...new Set(real.map(([k]) => k.split(':')[0]))].filter((id) => VERB_BY_ID.has(id))
    return { byType, ids, count: real.length }
  }, [progress.mistakes])

  return (
    <div className="grid gap-10">
      <header className="grid gap-4">
        <h1 className="m-0 text-4xl sm:text-5xl font-extrabold">Mina fel</h1>
        <div className="rounded-3xl bg-surface ring-1 ring-rule p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-4xl font-extrabold display tabular-nums">{count}</p>
            <p className="m-0 text-muted">
              {count === 1 ? 'form' : 'former'} i {ids.length} verb att öva mer på. Ett fel försvinner när du svarar rätt. Slarvfel, där ändelsen är rätt, räknas inte.
            </p>
          </div>
          {ids.length > 0 && <Link to={`/ova?ord=${ids.map(encodeURIComponent).join(',')}`} className="btn btn-primary">Öva på mina fel</Link>}
        </div>
      </header>

      {byType.length === 0 ? (
        <p className="m-0 text-muted">Inga fel ännu. När du svarar fel hamnar formen här, sorterad efter typ av fel.</p>
      ) : (
        <section aria-label="Fel efter typ" className="grid gap-6">
          {byType.map(({ type, list }) => (
            <div key={type}>
              <h2 className="m-0 mb-2 text-xl font-extrabold">{ERROR_LABELS[type]} <span className="text-muted font-normal text-base">({list.length})</span></h2>
              <ul className="m-0 p-0 list-none rounded-2xl bg-surface ring-1 ring-rule divide-y divide-[color:var(--rule)]">
                {list.slice(0, 15).map(({ id, n, answer }) => {
                  const [vid, form] = id.split(':')
                  const v = VERB_BY_ID.get(vid)
                  if (!v) return null
                  return (
                    <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                      <LineBadge group={v.group} />
                      <span className="font-bold" lang="sv">{v.inf}</span>
                      <span className="text-muted text-sm">{form === 'group' ? 'grupp' : FORM_NAMES[form as FormKey]}</span>
                      <span lang="sv">
                        {answer && <s className="text-bad mr-2">{answer}</s>}
                        {form === 'group' ? <strong>grupp {v.group}</strong> : <Word verb={v} form={form as FormKey} />}
                      </span>
                      <span className="ml-auto text-sm text-muted tabular-nums">{n} gång{n > 1 ? 'er' : ''}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      <Settings />
    </div>
  )
}

function Settings() {
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

  return (
    <section aria-labelledby="settings" className="grid gap-4 border-t border-rule pt-8">
      <h2 id="settings" className="m-0 text-xl font-extrabold">Inställningar</h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-24 text-sm font-bold text-muted">Utseende</span>
        <Segmented<Theme> label="Utseende" value={settings.theme} onChange={(theme) => update({ theme })}
          options={[{ value: 'system', label: 'Automatiskt' }, { value: 'light', label: 'Ljust' }, { value: 'dark', label: 'Mörkt' }]} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-24 text-sm font-bold text-muted">Dina data</span>
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
  )
}
