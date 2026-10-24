import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ALL_GROUPS, filterVerbs, fromParams, sortVerbs, toParams, type Filter, type Sort } from './filters'
import { FAMILY_IDS, VERBS } from './groups'

const KIND_LABEL: Record<string, string> = {
  strong: 'starka och oregelbundna verb', sVerb: 's-verb', particle: 'partikelverb', reflexive: 'reflexiva verb',
}

/** Short Swedish description of a selection, e.g. "100 vanligaste · grupp 4 · i–e–i". */
export function describe(f: Filter): string {
  if (f.ids?.length) return `egen lista med ${f.ids.length} verb`
  const parts = [f.top ? `${f.top} vanligaste` : 'alla verb']
  if (f.groups.length !== ALL_GROUPS.length) parts.push(`grupp ${f.groups.join(', ')}`)
  if (f.kind.startsWith('strong:')) parts.push(f.kind === 'strong:other' ? 'oregelbundna' : `vokalmönster ${f.kind.slice(7)}`)
  else if (f.kind !== 'all') parts.push(KIND_LABEL[f.kind])
  return parts.join(' · ')
}

/** The verb selection lives in the URL so that it can be shared and carried between pages. */
export function useSelection() {
  const [params, setParams] = useSearchParams()
  const { filter, sort } = useMemo(() => fromParams(params), [params])
  const verbs = useMemo(() => sortVerbs(filterVerbs(VERBS, filter, FAMILY_IDS), sort), [filter, sort])

  const set = useCallback((f: Filter, s: Sort) => {
    setParams((prev) => {
      const next = new URLSearchParams(toParams(f, s))
      const keep = prev.get('verb')
      if (keep) next.set('verb', keep)
      return next
    }, { replace: true })
  }, [setParams])

  const query = new URLSearchParams(toParams(filter, sort)).toString()
  return {
    filter,
    sort,
    verbs,
    query: query ? `?${query}` : '',
    setFilter: (patch: Partial<Filter>) => set({ ...filter, ...patch }, sort),
    setSort: (s: Sort) => set(filter, s),
    openVerb: params.get('verb'),
    setOpenVerb: (id: string | null) => setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id) next.set('verb', id)
      else next.delete('verb')
      return next
    }),
  }
}
