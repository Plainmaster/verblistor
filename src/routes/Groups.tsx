import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineBadge, Word } from '../components/bits'
import { applyShortcuts, normalize } from '../lib/check'
import { GROUPS, VERBS, VERB_BY_ID, families, route } from '../lib/groups'
import type { Verb } from '../lib/types'

export default function Groups() {
  const { named, other } = useMemo(() => families(), [])
  return (
    <div className="grid gap-12">
      <header>
        <h1 className="m-0 text-4xl sm:text-5xl font-extrabold">Verbgrupper</h1>
        <p className="m-0 mt-2 max-w-[62ch] text-lg text-muted">
          Svenska verb delas in i fem grupper. Gruppen avgör ändelserna i presens, preteritum och supinum.
          Grupp 1–3 följer regler. Grupp 4 byter vokal och måste läras in, men de flesta följer några få mönster.
        </p>
      </header>

      <RouteFinder />

      <section aria-labelledby="compare">
        <h2 id="compare" className="m-0 mb-4 text-2xl font-extrabold">Grupperna bredvid varandra</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="text-sm text-muted">
                <th className="py-2 pr-3 font-bold">Grupp</th>
                <th className="py-2 pr-3 font-bold">infinitiv</th>
                <th className="py-2 pr-3 font-bold">presens</th>
                <th className="py-2 pr-3 font-bold">preteritum</th>
                <th className="py-2 pr-3 font-bold">supinum</th>
                <th className="py-2 font-bold">andel</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => {
                const v = VERB_BY_ID.get(g.examples[0])!
                const count = VERBS.filter((x) => x.group === g.id).length
                return (
                  <tr key={g.id} className="border-t border-rule align-top">
                    <td className="py-3 pr-3">
                      <Link to={`/grupper/${g.id}`} className="inline-flex items-center gap-2 font-bold no-underline text-ink hover:underline">
                        <LineBadge group={g.id} /> {g.short}
                      </Link>
                    </td>
                    {(['inf', 'pres', 'pret', 'sup'] as const).map((k) => (
                      <td key={k} className="py-3 pr-3 text-xl font-medium"><Word verb={v} form={k} /></td>
                    ))}
                    <td className="py-3">
                      <ShareBar n={count} total={VERBS.length} group={g.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted max-w-[62ch]">
          Andel av de {VERBS.length} verben i Verblistor. Grupp 4 är mindre men har de flesta vardagsverben: {
            VERBS.filter((v) => v.freq <= 20 && !v.particle && !v.reflexive && v.group === '4').length
          } av de 20 vanligaste.
        </p>
      </section>

      <section aria-labelledby="families">
        <h2 id="families" className="m-0 text-2xl font-extrabold">Grupp 4 efter vokalmönster</h2>
        <p className="m-0 mt-1 mb-5 max-w-[62ch] text-muted">
          Starka verb byter vokal: <em lang="sv">skriva – skrev – skrivit</em> följer i – e – i.
          Lär dig dem i familjer, inte ett och ett.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {named.map((f) => (
            <Link
              key={f.id}
              to={`/grupper/monster/${encodeURIComponent(f.id)}`}
              className="block rounded-3xl bg-surface ring-1 ring-rule p-5 no-underline text-ink hover:ring-[color:var(--g4)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold" data-group="4"><span className="change no-underline">{f.id}</span></span>
                <span className="text-sm text-muted">{f.verbs.length} verb</span>
              </div>
              <p className="m-0 mt-2 text-[0.95rem]" lang="sv">
                {f.verbs.slice(0, 4).map((v, i) => (
                  <span key={v.id}>{i > 0 && ', '}<Word verb={v} form="inf" /> <Word verb={v} form="pret" /> <Word verb={v} form="sup" /></span>
                ))}
              </p>
            </Link>
          ))}
          <Link
            to="/grupper/monster/other"
            className="block rounded-3xl bg-surface ring-1 ring-rule p-5 no-underline text-ink hover:ring-[color:var(--g4)]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold">Oregelbundna</span>
              <span className="text-sm text-muted">{other.length} verb</span>
            </div>
            <p className="m-0 mt-2 text-[0.95rem]" lang="sv">
              {other.slice(0, 5).map((v, i) => <span key={v.id}>{i > 0 && ', '}<Word verb={v} form="inf" /> <Word verb={v} form="pret" /></span>)}
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}

function ShareBar({ n, total, group }: { n: number; total: number; group: Verb['group'] }) {
  return (
    <div className="flex items-center gap-2 min-w-[7rem]" data-group={group}>
      <div className="h-2 flex-1 rounded-full bg-sunk overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(n / total) * 100}%`, background: 'var(--g)' }} />
      </div>
      <span className="text-sm tabular-nums text-muted w-9 text-right">{Math.round((n / total) * 100)}%</span>
    </div>
  )
}

const STOPS = [
  { q: 'Är preteritum oregelbundet?', yes: '4' },
  { q: 'Slutar infinitiven på -a?', no: '3' },
  { q: 'Slutar presens på -ar?', yes: '1' },
  { q: 'Slutar stammen på k, p, s, t eller x?', yes: '2b', no: '2a' },
] as const

/** The decision tree drawn as a transit line; type a verb to light up its route. */
function RouteFinder() {
  const [q, setQ] = useState('skriva')
  const verb = useMemo(() => {
    const n = normalize(q)
    return VERB_BY_ID.get(n) ?? VERBS.find((v) => [v.pres, v.pret, v.sup].includes(n))
  }, [q])
  const steps = verb ? route(verb) : []

  return (
    <section aria-labelledby="route" className="rounded-3xl bg-surface ring-1 ring-rule p-5 sm:p-7">
      <h2 id="route" className="m-0 text-2xl font-extrabold">Hitta gruppen</h2>
      <p className="m-0 mt-1 text-muted">Skriv ett verb och följ vägen.</p>
      <label className="block mt-4 max-w-sm">
        <span className="sr-only">Verb</span>
        <input
          className="answer-input"
          lang="sv"
          value={q}
          onChange={(e) => setQ(applyShortcuts(e.target.value))}
          placeholder="t.ex. köpa"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {q && !verb && <p className="m-0 mt-2 text-muted">Verbet finns inte i listan. Prova ett annat, till exempel bo, köpa, ringa eller tala.</p>}

      <ol className="relative m-0 mt-6 p-0 list-none">
        {STOPS.map((s, i) => {
          const step = steps[i]
          const reached = !!step
          const ended = step?.group
          return (
            <li key={s.q} className="relative pl-10 pb-6 last:pb-0">
              <span
                aria-hidden
                className={`absolute left-[11px] top-3 bottom-0 w-[5px] ${i === STOPS.length - 1 ? 'hidden' : ''} ${reached && !ended ? 'bg-ink' : 'bg-rule'}`}
              />
              <span
                aria-hidden
                className={`absolute left-0 top-0.5 size-7 rounded-full border-[5px] bg-surface ${reached ? 'border-ink' : 'border-rule'}`}
              />
              <p className={`m-0 font-bold ${reached ? '' : 'text-muted'}`}>{s.q}</p>
              {step && <p className="m-0 text-muted" lang="sv">{step.a}</p>}
              <div className="mt-2 flex gap-2 flex-wrap">
                {(['yes' in s ? s.yes : null, 'no' in s ? s.no : null] as const).map((g, j) => g && (
                  <span
                    key={g}
                    className={`inline-flex items-center gap-2 rounded-full pr-3 text-sm ${ended === g ? 'bg-sunk font-bold' : 'opacity-60'}`}
                  >
                    <LineBadge group={g} />
                    {j === 0 ? 'ja' : 'nej'}
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
      {verb && (
        <p className="m-0 mt-5 text-lg" lang="sv">
          <LineBadge group={verb.group} /> <strong><Word verb={verb} form="inf" /></strong>{' '}
          <Word verb={verb} form="pres" />, <Word verb={verb} form="pret" />, <Word verb={verb} form="sup" />
          <span className="text-muted"> – {verb.en}</span>
        </p>
      )}
    </section>
  )
}
