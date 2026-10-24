import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineBadge, PARADIGM, Paradigm, Speak, Tags, Word } from '../components/bits'
import Drill from '../components/Drill'
import { FORM_NAMES } from '../lib/diagnose'
import { GROUP_BY_ID, VERBS, VERB_BY_ID, families } from '../lib/groups'
import type { FormKey, Group, Verb } from '../lib/types'

/** Guided intro to one group or vowel family: notice the rule, see examples, then a blocked mini-drill. */
export default function Learn() {
  const { group, family } = useParams()
  const [drilling, setDrilling] = useState(false)

  const data = useMemo(() => {
    if (family) {
      const { named, other } = families()
      const verbs = family === 'other' ? other : named.find((f) => f.id === family)?.verbs ?? []
      return {
        title: family === 'other' ? 'Oregelbundna verb' : `Vokalmönster ${family}`,
        badge: '4' as Group,
        intro: family === 'other'
          ? 'De här verben följer inget gemensamt mönster. De hör till de vanligaste i svenskan, så de är värda att lära sig ett och ett.'
          : `I de här verben byts vokalen ${family.replace(/–/g, ' → ')} i infinitiv, preteritum och supinum. Supinum slutar på -it (eller -tt efter lång vokal).`,
        examples: verbs.slice(0, 8),
        pool: verbs,
        notes: [] as { text: string; verbs: Verb[] }[],
        forms: ['pret', 'sup'] as FormKey[],
      }
    }
    const g = GROUP_BY_ID.get(group as Group)
    if (!g) return null
    const pool = VERBS.filter((v) => v.group === g.id && !v.particle && !v.reflexive)
    return {
      title: g.name,
      badge: g.id,
      intro: `${g.rule} ${g.spot}`,
      examples: g.examples.map((id) => VERB_BY_ID.get(id)).filter((v): v is Verb => !!v),
      pool,
      notes: g.notes.map((n) => ({ text: n.text, verbs: n.verbs.map((id) => VERB_BY_ID.get(id)).filter((v): v is Verb => !!v) })),
      forms: ['pres', 'pret', 'sup'] as FormKey[],
    }
  }, [group, family])

  if (!data) return <p>Gruppen finns inte. <Link to="/grupper">Se alla grupper</Link>.</p>

  const g = GROUP_BY_ID.get(data.badge)!
  const drillPool = [...data.pool].sort((a, b) => a.freq - b.freq).slice(0, 25)

  return (
    <div className="grid gap-8">
      <nav className="text-sm"><Link to="/grupper" className="text-muted underline underline-offset-2">Verbgrupper</Link></nav>
      <header className="flex items-start gap-4">
        <LineBadge group={data.badge} className="text-2xl" />
        <div>
          <h1 className="m-0 text-4xl font-extrabold">{data.title}</h1>
          <p className="m-0 mt-2 max-w-[62ch] text-lg">{data.intro}</p>
        </div>
      </header>

      {!family && (
        <section aria-label="Ändelser" className="rounded-3xl bg-surface ring-1 ring-rule p-5">
          <dl className="m-0 grid grid-cols-2 sm:grid-cols-5 gap-4" data-group={g.id}>
            {PARADIGM.map((k) => [k, g.endings[k as keyof typeof g.endings]] as const).map(([k, e]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{FORM_NAMES[k as FormKey]}</dt>
                <dd className="m-0 text-2xl font-extrabold"><span className="end">{e}</span></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="ex">
        <h2 id="ex" className="m-0 mb-3 text-xl font-extrabold">Exempel</h2>
        <ul className="m-0 p-0 list-none grid gap-3">
          {data.examples.map((v) => (
            <li key={v.id} className="rounded-3xl bg-surface ring-1 ring-rule p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-bold text-lg" lang="sv">{v.inf}</span>
                <span className="text-muted">{v.en}</span>
                <Speak text={[v.inf, v.pres, v.pret, v.sup].join(', ')} />
                <Tags verb={v} />
              </div>
              <Paradigm verb={v} compact />
            </li>
          ))}
        </ul>
      </section>

      {data.notes.length > 0 && (
        <section aria-labelledby="watch">
          <h2 id="watch" className="m-0 mb-3 text-xl font-extrabold">Se upp med</h2>
          <ul className="m-0 p-0 list-none grid gap-3">
            {data.notes.map((n) => (
              <li key={n.text} className="relative pl-8" data-group={g.id}>
                <span aria-hidden className="absolute left-0 top-1 size-5 rounded-full border-[4px] bg-surface" style={{ borderColor: 'var(--g)' }} />
                <p className="m-0 font-bold">{n.text}</p>
                <p className="m-0 mt-1 text-lg" lang="sv">
                  {n.verbs.map((v, i) => (
                    <span key={v.id}>{i > 0 && <span className="text-muted"> · </span>}<Word verb={v} form="inf" /> <Word verb={v} form="pres" /> <Word verb={v} form="pret" /> <Word verb={v} form="sup" /></span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="try">
        <h2 id="try" className="m-0 mb-1 text-xl font-extrabold">Öva</h2>
        <p className="m-0 mb-4 text-muted">De {drillPool.length} vanligaste verben i {family ? 'mönstret' : 'gruppen'}, ett i taget.</p>
        {drilling
          ? <Drill pool={drillPool} forms={data.forms} mode="single" />
          : (
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDrilling(true)} className="btn btn-primary">Öva här</button>
              <Link to={family ? `/?typ=${encodeURIComponent(`starka:${family}`)}&topp=alla` : `/?grupp=${data.badge}&topp=alla`} className="btn btn-quiet">
                Visa alla i listan
              </Link>
            </span>
          )}
      </section>
    </div>
  )
}
