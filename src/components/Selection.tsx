import { ALL_GROUPS, type Kind, type Sort, type Top } from '../lib/filters'
import { GROUP_BY_ID } from '../lib/groups'
import { describe, useSelection } from '../lib/selection'
import { Chip, Segmented } from './bits'

const KIND_NOTE: Partial<Record<Kind, string>> = {
  strong: 'Ny vokal i preteritum och supinum, efter åtta mönster: skriver – skrev – skrivit. Sortera på Grupp för att se mönstren.',
  umlaut: 'Vokalen byts, men ändelserna är de vanliga: väljer – valde – valt.',
  irregular: 'Följer inget mönster och lärs in ett och ett: går – gick – gått.',
  helper: 'Står före ett annat verb: kan, ska, vill, måste, bör, har, är.',
  sVerb: 'Slutar på -s men är inte passiva. Deponens finns bara med -s: hoppas, andas. Reciproka betyder att man gör något med varandra: träffas, ses.',
}

/** Which verbs, shared by the list and the practice page through the URL, so both always show the same selection. */
export default function SelectionControls({ search = true }: { search?: boolean }) {
  const { filter, sort, verbs, setFilter, setSort } = useSelection()
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

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
      {!filter.search && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
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
          <Segmented<Top> label="Hur vanliga" value={filter.top} onChange={(top) => setFilter({ top })}
            options={[
              { value: 100, label: 'Grundverb', title: 'De 100 vanligaste plus vardagsverb som bo, må, äta och sova' },
              { value: 300, label: '300 vanligaste' },
              { value: 0, label: 'Alla' },
            ]} />
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
        <p className="m-0 max-w-[68ch] text-[0.98rem] border-l-2 border-ink pl-3">{KIND_NOTE[filter.kind]}</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="m-0 text-[0.95rem] italic text-muted" aria-live="polite">{verbs.length} verb · {describe(filter)}</p>
        <span className="flex items-center gap-2">
          <span className="sc text-[0.95rem] text-muted">Ordning</span>
          <Segmented<Sort> label="Ordning" value={sort} onChange={setSort}
            options={[
              { value: 'freq', label: 'Vanligast först' },
              { value: 'abc', label: 'A–Ö' },
              { value: 'group', label: 'Grupp', title: 'Som i boken: grupp för grupp, de starka verben efter mönster, A–Ö inom varje' },
              { value: 'mix', label: 'Blandat', title: 'Verben i slumpvis ordning. Klicka igen för en ny ordning.' },
            ]} />
        </span>
      </div>
    </section>
  )
}
