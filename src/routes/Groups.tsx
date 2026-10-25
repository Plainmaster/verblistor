import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PARADIGM, Word } from '../components/bits'
import { stemOf } from '../lib/conjugate'
import { FORM_NAMES } from '../lib/diagnose'
import { GROUPS, VERBS, VERB_BY_ID, families, patternLabel, type GroupInfo } from '../lib/groups'
import type { FormKey, Verb } from '../lib/types'

const byId = (ids: string[]) => ids.map((id) => VERB_BY_ID.get(id)).filter((v): v is Verb => !!v)

export default function Groups() {
  const [params] = useSearchParams()
  const first = params.get('open')
  // a link to another group (from a verb) starts the page over with that group open
  return <GroupsPage key={first} first={first} />
}

function GroupsPage({ first }: { first: string | null }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(first ? [first] : []))
  const toggle = (id: string) => setOpen((s) => {
    const next = new Set(s)
    if (!next.delete(id)) next.add(id)
    return next
  })
  useEffect(() => {
    // the table on wide screens, the list on phones: scroll to whichever is shown
    if (first) [`grupp-${first}`, `grupp-m-${first}`].map((id) => document.getElementById(id)).find((el) => el?.offsetParent)?.scrollIntoView({ block: 'start' })
  }, [first])

  return (
    <div className="grid gap-12 [&>*]:min-w-0">
      <header>
        <h1 className="page-title">Verbgrupper</h1>
        <p className="m-0 mt-3 max-w-[62ch] text-lg text-muted">
          Ändelserna läggs till stammen, och stammen är imperativen: tala!, ring!, bo!, skriv!
        </p>
      </header>

      <section aria-label="Grupperna bredvid varandra">
        <ul className="sm:hidden m-0 p-0 list-none border-t-[1.5px] border-ink">
          {GROUPS.map((g) => {
            const v = VERB_BY_ID.get(g.examples[0])!
            const isOpen = open.has(g.id)
            return (
              <li key={g.id} id={`grupp-m-${g.id}`} className="border-b border-rule scroll-mt-20">
                <button type="button" aria-expanded={isOpen} onClick={() => toggle(g.id)}
                  className={`w-full flex items-baseline gap-2 py-3 text-left ${isOpen ? 'font-bold' : ''}`}>
                  <svg viewBox="0 0 24 24" className={`size-4 shrink-0 self-center transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                  <span className="font-bold whitespace-nowrap">{g.name}</span>
                  <span className="ml-auto text-[1.05rem] font-normal" lang="sv">
                    <Word verb={v} form="pres" /> <Word verb={v} form="pret" /> <Word verb={v} form="sup" />
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-6">
                    {g.id === '4' ? <Strong g={g} /> : <Weak g={g} count={VERBS.filter((x) => x.group === g.id).length} />}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="hidden sm:block overflow-x-auto -mx-4 px-4">
          <table className="ledger min-w-[640px]">
            <thead>
              <tr>
                <th className="py-2 pr-3">Grupp</th>
                {PARADIGM.map((f) => <th key={f} className="vr py-2 px-3">{FORM_NAMES[f]}</th>)}
                <th className="vr py-2 pl-3">andel</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => {
                const v = VERB_BY_ID.get(g.examples[0])!
                const count = VERBS.filter((x) => x.group === g.id).length
                const isOpen = open.has(g.id)
                return (
                  <Fragment key={g.id}>
                    <tr id={`grupp-${g.id}`} className={`align-top cursor-pointer scroll-mt-20 ${isOpen ? 'bg-sunk' : ''}`} onClick={() => toggle(g.id)}>
                      <td className="py-3 pr-3">
                        <button type="button" aria-expanded={isOpen} className="inline-flex items-center gap-2 font-bold whitespace-nowrap hover:underline underline-offset-4"
                          onClick={(e) => { e.stopPropagation(); toggle(g.id) }}>
                          <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m9 6 6 6-6 6" />
                          </svg>
                          {g.name}
                        </button>
                      </td>
                      {PARADIGM.map((k) => (
                        <td key={k} className="vr py-3 px-3 text-xl"><Word verb={v} form={k} /></td>
                      ))}
                      <td className="vr py-3 pl-3">
                        <ShareBar n={count} total={VERBS.length} group={g.id} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="section">
                        <td colSpan={PARADIGM.length + 2} className="p-0 border-b-[1.5px] border-b-ink">
                          <div className="py-5 pl-1 pr-2">
                            {g.id === '4' ? <Strong g={g} /> : <Weak g={g} count={count} />}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm italic text-muted max-w-[62ch]">
          Det markerade läggs till stammen. Grupp 4 är liten men har {
            VERBS.filter((v) => v.freq <= 20 && !v.particle && !v.reflexive && v.group === '4').length
          } av de 20 vanligaste verben.
        </p>
      </section>

      <Endings />
    </div>
  )
}

/** Group 1–3 opened: the rule, then each pitfall worked out as stem + ending → form. */
function Weak({ g, count }: { g: GroupInfo; count: number }) {
  return (
    <div className="grid gap-5">
      <p className="m-0 text-lg max-w-[62ch]">{g.rule} <span className="text-muted">{g.spot}</span></p>
      {g.notes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {g.notes.map((n) => (
            <div key={n.text} className="panel px-4 py-3" data-group={g.id}>
              <h3 className="m-0 mb-1.5 sc text-[1rem] text-muted font-normal">{n.text}</h3>
              <div className={`grid gap-y-0.5 gap-x-6 justify-start text-[1.05rem] ${n.forms.length > 1 ? 'sm:grid-cols-[auto_auto]' : ''}`}>
                {byId(n.verbs).flatMap((v, i) => n.forms.map((f, j) => (
                  <span key={v.id + f} className={`whitespace-nowrap ${i > 0 && j === 0 ? 'max-sm:mt-1.5' : ''}`}><Fuse verb={v} form={f} end={g.endings[f as 'pres'].slice(1)} /></span>
                )))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to={`/?grupp=${g.id}&topp=alla&sort=grupp`} className="justify-self-start underline underline-offset-2 text-ink">Alla {count} verb i {g.name.toLowerCase()} i listan</Link>
    </div>
  )
}

/** stem + ending → form, with the letters that fall away struck out: glömm + de → glömde. */
function Fuse({ verb, form, end }: { verb: Verb; form: FormKey; end: string }) {
  const stem = stemOf(verb.inf, verb.group)
  const a = stem + end
  const b = verb[form as 'inf'] ?? ''
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const drop = new Array<boolean>(a.length).fill(false)
  for (let i = 0, j = 0; i < a.length;) {
    if (j < b.length && a[i] === b[j]) { i++; j++ } else if (j >= b.length || dp[i + 1][j] >= dp[i][j + 1]) drop[i++] = true
    else j++
  }
  const letters = (from: number, to: number, cls: string) =>
    [...a.slice(from, to)].map((ch, k) => <span key={from + k} className={drop[from + k] ? 'drop' : cls}>{ch}</span>)
  return (
    <span lang="sv">
      {letters(0, stem.length, '')}<span className="text-muted"> + </span>{letters(stem.length, a.length, 'end')}
      <span className="text-muted"> → </span><strong><Word verb={verb} form={form} /></strong>
    </span>
  )
}

/** Group 4 opened: the eight vowel patterns, then the irregular verbs and the helper verbs. */
function Strong({ g }: { g: GroupInfo }) {
  const { named, other, helpers } = useMemo(() => families(), [])
  const row = (key: string, title: string, sub: string, verbs: Verb[], to: string) => (
    <tr key={key} className="align-top">
      <td className="py-2.5 pr-4">
        <Link to={to} className="no-underline text-ink hover:underline underline-offset-4">
          <span className="block text-xl font-bold whitespace-nowrap" lang="sv">{title}</span>
        </Link>
        <span className="block text-sm italic text-muted whitespace-nowrap" lang="sv">{sub}</span>
        <Link to={to} className="sm:hidden text-sm text-muted underline underline-offset-2">{verbs.length} verb</Link>
      </td>
      <td className="vr py-2.5 pl-3 sm:px-4 text-[1.02rem]" lang="sv" data-group="4">
        {verbs.slice(0, 3).map((v, i) => (
          <span key={v.id} className={`sm:whitespace-nowrap max-sm:block ${i === 2 ? 'max-sm:hidden' : ''}`}>
            {i > 0 && <span className="text-muted max-sm:hidden"> · </span>}<Word verb={v} form="pres" /> <Word verb={v} form="pret" /> <Word verb={v} form="sup" />
          </span>
        ))}
      </td>
      <td className="max-sm:hidden vr py-2.5 pl-4 text-sm text-muted tabular-nums whitespace-nowrap">
        <Link to={to} className="text-muted underline underline-offset-2">{verbs.length} verb</Link>
      </td>
    </tr>
  )
  return (
    <div className="grid gap-4">
      <p className="m-0 text-lg max-w-[62ch]">{g.rule} <span className="text-muted">{g.spot}</span></p>
      <div className="overflow-x-auto">
        <table className="ledger w-full sm:w-auto">
          <tbody>
            {named.map((f) => row(f.id, patternLabel(f.id), f.sub.typ, f.verbs,
              `/?typ=${encodeURIComponent(`starka:${f.id}`)}&topp=alla`))}
            {row('other', 'oregelbundna', 'går – gick – gått', other, '/?typ=oregelbundna&topp=alla')}
            {row('helper', 'hjälpverb', 'kan – kunde – kunnat', helpers, '/?typ=hjalpverb&topp=alla')}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** The whole Swedish verb system in one table: what each form adds to the stem. */
function Endings() {
  return (
    <section aria-labelledby="endings" className="callout p-5 sm:p-7">
      <h2 id="endings" className="m-0 text-2xl font-bold">Så böjs svenska verb</h2>
      <p className="m-0 mt-1 mb-4 max-w-[62ch] text-muted">
        Ändelserna läggs till stammen. Presensgruppen är lika för alla verb. I preteritumgruppen skiljer sig svaga verb (grupp 1–3) från starka (grupp 4).
      </p>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="ledger min-w-[560px]">
          <thead>
            <tr>
              <th className="py-2 pr-3"><span className="sr-only">Formtyp</span></th>
              <th className="vr py-2 px-3">presensgruppen</th>
              <th className="vr py-2 px-3">preteritum, svaga</th>
              <th className="vr py-2 px-3">preteritum, starka</th>
            </tr>
          </thead>
          <tbody>
            <EndingRow kind="Tempusform" note="anger tiden" cells={[['presens', '-r', 'nu, eller ingen bestämd tid'], ['preteritum', '-de', 'då, en bestämd tid'], ['preteritum', 'ingen ändelse', 'ny vokal']]} />
            <EndingRow kind="Infinit form" note="möjlighet eller faktum" cells={[['infinitiv', '-a', 'att skriva'], ['supinum', '-t', 'har talat'], ['supinum', '-it', 'har skrivit']]} />
            <EndingRow kind="Particip" note="fungerar som adjektiv" cells={[['presens particip', '-ande', 'pågående'], ['perfekt particip', '-d', 'en målad vägg'], ['perfekt particip', '-en', 'en skriven bok']]} />
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-4 max-w-[62ch] text-[0.95rem]">
        Allt annat är varianter som gör ord lättare att uttala: ringer får ett hjälpvokal-e, köpte får -te efter ett tonlöst ljud, bodde får dubbel konsonant efter lång vokal.
      </p>
    </section>
  )
}

function EndingRow({ kind, note, cells }: { kind: string; note: string; cells: [string, string, string][] }) {
  return (
    <tr className="align-top">
      <td className="py-2.5 pr-3">
        <span className="font-semibold">{kind}</span>
        <span className="block text-sm italic text-muted">{note}</span>
      </td>
      {cells.map(([form, end, ex]) => (
        <td key={form + end} className="vr py-2.5 px-3">
          <span className="sc text-[0.95rem] text-muted block">{form}</span>
          <span className="text-xl font-bold" style={{ '--g': 'var(--ink)' } as React.CSSProperties}><span className={end.startsWith('-') ? 'end' : 'italic font-normal text-[1.05rem]'}>{end}</span></span>
          <span className="block text-sm italic text-muted" lang="sv">{ex}</span>
        </td>
      ))}
    </tr>
  )
}

function ShareBar({ n, total, group }: { n: number; total: number; group: Verb['group'] }) {
  return (
    <div className="flex items-center gap-2 min-w-[7rem]" data-group={group}>
      <div className="h-2 flex-1 bg-sunk ring-1 ring-inset ring-rule overflow-hidden">
        <div className="h-full" style={{ width: `${(n / total) * 100}%`, background: 'var(--g)' }} />
      </div>
      <span className="text-sm tabular-nums text-muted w-9 text-right">{Math.round((n / total) * 100)}%</span>
    </div>
  )
}
