import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineBadge, Paradigm, Speak, Tags, Word } from '../components/bits'
import Drill from '../components/Drill'
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
        title: family === 'other' ? 'Irregular verbs' : `Vowel pattern ${family}`,
        badge: '4' as Group,
        intro: family === 'other'
          ? 'These verbs follow no common pattern. They are among the most frequent in Swedish, so they are worth learning one by one.'
          : `In these verbs the stem vowel changes ${family.replace(/–/g, ' → ')} across infinitive, preteritum and supinum. Supinum ends in -it (or -tt after a long vowel).`,
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

  if (!data) return <p>That group does not exist. <Link to="/groups">See all groups</Link>.</p>

  const g = GROUP_BY_ID.get(data.badge)!
  const drillPool = [...data.pool].sort((a, b) => a.freq - b.freq).slice(0, 25)

  return (
    <div className="grid gap-8">
      <nav className="text-sm"><Link to="/groups" className="text-muted underline underline-offset-2">Verb groups</Link></nav>
      <header className="flex items-start gap-4">
        <LineBadge group={data.badge} className="text-2xl" />
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight">{data.title}</h1>
          <p className="m-0 mt-2 max-w-[62ch] text-lg">{data.intro}</p>
        </div>
      </header>

      {!family && (
        <section aria-label="Endings" className="rounded-2xl bg-surface ring-1 ring-rule p-5">
          <dl className="m-0 grid grid-cols-2 sm:grid-cols-5 gap-4" data-group={g.id}>
            {Object.entries(g.endings).map(([k, e]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{({ inf: 'infinitiv', pres: 'presens', pret: 'preteritum', sup: 'supinum', imp: 'imperativ' } as Record<string, string>)[k]}</dt>
                <dd className="m-0 text-2xl font-extrabold"><span className="end">{e}</span></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="ex">
        <h2 id="ex" className="m-0 mb-3 text-xl font-extrabold">Examples</h2>
        <ul className="m-0 p-0 list-none grid gap-3">
          {data.examples.map((v) => (
            <li key={v.id} className="rounded-2xl bg-surface ring-1 ring-rule p-4">
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
          <h2 id="watch" className="m-0 mb-3 text-xl font-extrabold">Watch out for</h2>
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
        <h2 id="try" className="m-0 mb-1 text-xl font-extrabold">Try it</h2>
        <p className="m-0 mb-4 text-muted">The {drillPool.length} most frequent verbs of this {family ? 'pattern' : 'group'}, one at a time.</p>
        {drilling
          ? <Drill pool={drillPool} forms={data.forms} mode="single" />
          : (
            <button type="button" onClick={() => setDrilling(true)} className="h-11 px-5 rounded-xl bg-ink text-paper font-bold">
              Practise {data.title.toLowerCase()}
            </button>
          )}
      </section>
    </div>
  )
}
