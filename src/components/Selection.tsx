import { useState } from 'react'
import { ALL_GROUPS, type Kind, type Sort } from '../lib/filters'
import { GROUP_BY_ID } from '../lib/groups'
import { describe, useSelection } from '../lib/selection'
import { Chip, Segmented, TipIcon, type Icon } from './bits'

type Note = [Icon, string][]
/** A few short lines on each kind of verb, each with its icon: i for how it works, a bulb for a tip, a puzzle piece for meaning. */
const KIND_NOTE: Partial<Record<Kind, Note>> = {
  strong: [
    ['info', 'Vokalen byts i preteritum och supinum: skriver – skrev – skrivit.'],
    ['bulb', 'Verben följer åtta mönster. Sortera på Grupp för att se dem.'],
  ],
  umlaut: [
    ['info', 'Vokalen byts, men ändelserna är som vanligt: väljer – valde – valt.'],
  ],
  irregular: [
    ['info', 'Formerna följer inget mönster: går – gick – gått.'],
    ['bulb', 'Lär dig verben ett och ett. De är få, men man använder dem hela tiden.'],
  ],
  helper: [
    ['info', 'Hjälpverbet står före ett annat verb, utan att: Jag vill åka. Inte: Jag vill att åka.'],
    ['bulb', 'Börja med kan, vill och måste. Lär dig sedan får och bör.'],
    ['info', 'Har och ska visar tid. Har + supinum: Jag har ätit. Ska + infinitiv: Jag ska äta.'],
    ['info', 'Brukar, behöver, hinner och orkar tar inte heller att: Jag brukar cykla.'],
  ],
  particle: [
    ['info', 'Partikeln är betonad: ge upp. Verbet böjs som vanligt: gav upp, har gett upp.'],
    ['puzzle', 'Ibland är betydelsen ny: ge upp = sluta försöka. Ibland går den att gissa: frysa in = lägga i frysen. Öppna ett verb för att se vilket.'],
  ],
  reflexive: [
    ['info', 'Verbet har ett ord som pekar tillbaka: jag lägger mig, du lägger dig, hon lägger sig. I listan står sig.'],
    ['info', 'Imperativen har dig: Lägg dig!'],
    ['bulb', 'När du övar är mig, dig, sig, oss och er rätt.'],
  ],
  sVerb: [
    ['info', 'Verbet slutar alltid på -s, även i presens: jag hoppas, det finns.'],
    ['puzzle', 'Några betyder att man gör något med varandra: Vi ses! Vi träffas på fredag.'],
  ],
}

/** Which verbs, shared by the list and the practice page through the URL, so both always show the same selection. */
export default function SelectionControls({ search = true }: { search?: boolean }) {
  const { filter, sort, verbs, setFilter, setSort } = useSelection()
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])
  // on a phone the choices fold away behind one line, so the list starts higher up
  const [unfolded, setUnfolded] = useState(false)
  const fold = unfolded ? '' : 'max-sm:hidden'

  if (filter.ids?.length) {
    return (
      <div className="callout px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0"><strong>Ett eget urval</strong> med {verbs.length} verb, till exempel dina fel.</p>
        <button type="button" className="btn btn-quiet" onClick={() => setFilter({ ids: undefined })}>Visa alla verb</button>
      </div>
    )
  }

  return (
    <section aria-label="Urval" className="grid gap-3">
      {search && (
        <label className="block">
          <span className="sr-only">Sök på svenska eller engelska</span>
          <input
            type="search"
            className="answer-input !text-lg"
            placeholder="Sök: skriva, skrev, to write …"
            value={filter.search ?? ''}
            onChange={(e) => setFilter({ search: e.target.value || undefined })}
            lang="sv"
          />
        </label>
      )}
      <button type="button" onClick={() => setUnfolded((u) => !u)} aria-expanded={unfolded}
        className="sm:hidden h-10 px-3 flex items-center justify-between gap-2 border-[1.5px] border-rule-strong rounded-[2px] text-left">
        <span className="min-w-0 truncate"><span className="sc text-[0.9rem] text-muted mr-2">Urval</span>{verbs.length} verb · {describe(filter)}</span>
        <svg viewBox="0 0 24 24" className={`size-5 shrink-0 transition-transform duration-200 ${unfolded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 9 7 7 7-7" />
        </svg>
      </button>

      {!filter.search && (
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${fold}`}>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grupp">
            {ALL_GROUPS.map((g) => (
              <Chip key={g} group={g} on={filter.groups.length < ALL_GROUPS.length && filter.groups.includes(g)} title={GROUP_BY_ID.get(g)!.short}
                onClick={() => {
                  // with all groups on, a click picks just that group
                  const next = filter.groups.length === ALL_GROUPS.length ? [g] : toggle(filter.groups, g)
                  setFilter({ groups: next.length ? ALL_GROUPS.filter((x) => next.includes(x)) : ALL_GROUPS })
                }}>
                {g}
              </Chip>
            ))}
          </div>
          <label>
            <span className="sr-only">Typ av verb</span>
            <select className="field" value={filter.kind} onChange={(e) => setFilter({ kind: e.target.value as Kind })}>
              <option value="all">Alla typer</option>
              <option value="strong">Starka verb</option>
              <option value="umlaut">Omljudsverb</option>
              <option value="irregular">Oregelbundna verb</option>
              <option value="helper">Hjälpverb</option>
              <option value="sVerb">s-verb</option>
              <option value="particle">Partikelverb</option>
              <option value="reflexive">Reflexiva verb</option>
              {filter.kind.startsWith('strong:') && <option value={filter.kind}>Starka verb: {describe({ ...filter, groups: ALL_GROUPS, top: 100 }).split(' · ')[1]}</option>}
            </select>
          </label>
        </div>
      )}

      {!filter.search && KIND_NOTE[filter.kind] && (
        <ul className="m-0 p-0 list-none grid gap-1.5 max-w-[68ch] text-[1rem]" lang="sv">
          {KIND_NOTE[filter.kind]!.map(([icon, text]) => (
            <li key={text} className="flex items-start gap-2.5"><TipIcon icon={icon} /><span>{text}</span></li>
          ))}
        </ul>
      )}

      <div className={`flex flex-wrap items-end justify-between gap-3 ${fold}`}>
        <p className="m-0 text-[0.95rem] italic text-muted max-sm:hidden" aria-live="polite">{verbs.length} verb · {describe(filter)}</p>
        <span className="flex items-center gap-2">
          <span className="sc text-[0.95rem] text-muted max-sm:hidden">Ordning</span>
          <Segmented<Sort> label="Ordning" value={sort} onChange={setSort}
            options={[
              { value: 'freq', label: 'Vanligast', title: 'Vanligast först' },
              { value: 'abc', label: 'A–Ö' },
              { value: 'group', label: 'Grupp', title: 'Som i boken: grupp för grupp, de starka verben efter mönster, A–Ö inom varje' },
              { value: 'mix', label: 'Blandat', title: 'Verben i slumpvis ordning. Klicka igen för en ny ordning.' },
            ]} />
        </span>
      </div>
    </section>
  )
}
