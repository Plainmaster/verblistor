import SelectionControls from '../components/Selection'
import VerbList from '../components/VerbList'
import { filterVerbs, type Top } from '../lib/filters'
import { FAMILY_IDS, VERBS } from '../lib/groups'
import { useSelection } from '../lib/selection'

export default function Verbs() {
  const { filter, verbs, sort, openVerb, setOpenVerb, setFilter } = useSelection()
  // the list starts with the basic verbs; at the end it offers the next band, so there is no setting to choose first
  const count = (top: Top) => filterVerbs(VERBS, { ...filter, top }, FAMILY_IDS).length
  const bands = filter.search || filter.ids?.length ? [] : ([300, 0] as Top[]).filter((t) => filter.top !== 0 && (t === 0 || filter.top === 100))
  const next = bands.map((top) => ({ top, extra: count(top) - verbs.length })).find((b) => b.extra > 0)

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
      {verbs.length === 0 && !next && <p className="m-0 text-muted">Inga verb passar urvalet. Prova att välja fler grupper eller typer.</p>}
      {(next || filter.top !== 100) && !filter.search && !filter.ids?.length && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[1.02rem]">
            {next
              ? <>Det finns {next.extra} verb till {next.top ? 'bland de vanliga verben' : 'i hela listan'}.</>
              : <>Du ser alla verb som passar urvalet.</>}
          </p>
          <span className="flex gap-2">
            {filter.top !== 100 && <button type="button" className="btn btn-quiet" onClick={() => setFilter({ top: 100 })}>Bara grundverb</button>}
            {next && <button type="button" className="btn btn-primary" onClick={() => setFilter({ top: next.top })}>Visa {next.extra} till</button>}
          </span>
        </div>
      )}
    </div>
  )
}
