import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LineBadge, Word } from '../components/bits'
import { ERROR_LABELS, FORM_NAMES, isCareless, type DiagnosisType } from '../lib/diagnose'
import { groupLabel, VERB_BY_ID } from '../lib/groups'
import type { FormKey } from '../lib/types'
import { useStore } from '../store'

/** Like the original's "Misstag": every form you got wrong, until you get it right. */
export default function Mistakes() {
  const { progress, update } = useStore()
  // the list opens as an exercise: the infinitive shown, the other forms to write
  const practise = () => update({ cols: { imp: 'write', pres: 'write', pret: 'write', sup: 'write' }, random: false })

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
        <h1 className="page-title">Mina fel</h1>
        <div className="panel p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-5xl font-bold display tabular-nums">{count}</p>
            <p className="m-0 text-muted">
              {count === 1 ? 'form' : 'former'} i {ids.length} verb att öva mer på. Ett fel försvinner när du svarar rätt. Slarvfel, där ändelsen är rätt, räknas inte.
            </p>
          </div>
          {ids.length > 0 && <Link to={`/?ord=${ids.map(encodeURIComponent).join(',')}`} onClick={practise} className="btn btn-primary">Öva på mina fel</Link>}
        </div>
      </header>

      {byType.length === 0 ? (
        <p className="m-0 text-muted">Inga fel ännu. När du svarar fel hamnar formen här, sorterad efter typ av fel.</p>
      ) : (
        <section aria-label="Fel efter typ" className="grid gap-6">
          {byType.map(({ type, list }) => (
            <div key={type}>
              <h2 className="m-0 mb-2 text-xl font-bold">{ERROR_LABELS[type]} <span className="text-muted font-normal text-base">({list.length})</span></h2>
              <ul className="m-0 p-0 list-none panel divide-y divide-[color:var(--rule)]">
                {list.slice(0, 15).map(({ id, n, answer }) => {
                  const [vid, form] = id.split(':')
                  const v = VERB_BY_ID.get(vid)
                  if (!v) return null
                  return (
                    <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                      <LineBadge group={v.group} label={groupLabel(v)} />
                      <span className="font-bold" lang="sv">{v.inf}</span>
                      <span className="sc text-muted text-[0.95rem]">{form === 'group' ? 'grupp' : FORM_NAMES[form as FormKey]}</span>
                      <span lang="sv">
                        {answer && <s className="text-bad mr-2">{answer}</s>}
                        {form === 'group' ? <strong>grupp {v.group}</strong> : <Word verb={v} form={form as FormKey} />}
                      </span>
                      <span className="ml-auto text-sm italic text-muted tabular-nums">{n} gång{n > 1 ? 'er' : ''}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

    </div>
  )
}
