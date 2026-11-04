import SelectionControls from '../components/Selection'
import VerbList from '../components/VerbList'
import { filterVerbs, type Top } from '../lib/filters'
import { FAMILY_IDS, VERBS } from '../lib/groups'
import { useSelection } from '../lib/selection'

export default function Verbs() {
  const { filter, verbs, sort, openVerb, setOpenVerb, setFilter } = useSelection()
  // the list starts with the basic verbs; at the end the three bands sit side by side with their sizes,
  // so you see where you are and how much each step adds. A band that adds nothing to the one before is left out.
  const count = (top: Top) => filterVerbs(VERBS, { ...filter, top }, FAMILY_IDS).length
  const free = !filter.search && !filter.ids?.length
  const bands = ([[100, 'Grundverb'], [300, 'Vanliga verb'], [0, 'Alla verb']] as [Top, string][])
    .map(([top, label]) => ({ top, label, n: count(top) }))
    .filter((b, i, all) => b.top === filter.top || i === 0 || b.n > all[i - 1].n)
  const more = bands.some((b) => b.n > verbs.length)

  return (
    <div className="grid gap-6 print:hidden">
      <header>
        <h1 className="page-title">Verblistor</h1>
        <p className="m-0 mt-3 max-w-[62ch] text-lg text-muted">
          {VERBS.length} svenska verb. Klicka på en form för att höra den. Klicka på raden för att se exempel.
        </p>
      </header>

      <SelectionControls />

      <VerbList verbs={verbs} sort={sort} kind={filter.kind} openId={openVerb} onOpen={setOpenVerb} />
      {verbs.length === 0 && !more && <p className="m-0 text-muted">Inga verb passar urvalet. Prova att välja fler grupper eller typer.</p>}
      {free && bands.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[1.02rem]">Hur många verb vill du se?</span>
          <span className="inline-flex" role="group" aria-label="Antal verb">
            {bands.map((b) => (
              <button key={b.top} type="button" onClick={() => setFilter({ top: b.top })} aria-pressed={filter.top === b.top}
                className={`h-9 px-3 inline-flex items-center gap-1.5 border-[1.5px] -ml-[1.5px] first:ml-0 first:rounded-l-[2px] last:rounded-r-[2px] ${filter.top === b.top ? 'bg-ink text-paper border-ink relative z-10' : 'border-rule-strong hover:bg-sunk'}`}>
                {b.label} <span className="tabular-nums opacity-75">{b.n}</span>
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
