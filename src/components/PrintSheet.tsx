import { FORM_NAMES } from '../lib/diagnose'
import type { Kind, Sort } from '../lib/filters'
import { groupLabel } from '../lib/groups'
import { sections, sectionTitle } from '../lib/sections'
import type { Verb } from '../lib/types'
import { PARADIGM } from './bits'

/** Plain list, or the book's landscape spread with a wide empty column for your own notes. */
export default function PrintSheet({ verbs, sort, kind, title, notes }: { verbs: Verb[]; sort: Sort; kind?: Kind; title: string; notes: boolean }) {
  const cell = `border-b border-gray-300 pr-2 ${notes ? 'h-[9mm] align-bottom pb-1' : 'py-1.5'}`
  const cols = PARADIGM.length + (notes ? 4 : 3)
  return (
    <div className="hidden print:block">
      {notes && <style>{'@page { size: A4 landscape; margin: 12mm; }'}</style>}
      <h1 className="m-0 text-2xl font-bold border-b-[3px] border-double border-black pb-1">Svenska verblistor <span className="font-normal text-base">– {title}</span></h1>
      <table className="w-full mt-4 border-collapse text-left text-[10.5pt]">
        <thead>
          <tr>
            {['#', ...PARADIGM.map((f) => FORM_NAMES[f]), 'engelska', 'grupp'].map((h, i) => (
              <th key={i} className="border-b-[1.5px] border-black py-1 pr-2 sc">{h}</th>
            ))}
            {notes && <th className="border-b-[1.5px] border-black py-1 pl-2 w-[32%] sc">Anteckningar</th>}
          </tr>
        </thead>
        {sections(verbs, sort, kind).map(({ key, verbs: rows }) => (
          <tbody key={key}>
            {key && (
              <tr className="break-after-avoid">
                <th colSpan={cols} className="text-left pt-4 pb-1 text-[12pt] font-bold border-b border-black">
                  {sectionTitle(key).title} <span className="font-normal italic">· {sectionTitle(key).sub}</span>
                </th>
              </tr>
            )}
            {rows.map((v, i) => (
              <tr key={v.id} className="break-inside-avoid">
                <td className={`${cell} text-gray-600 tabular-nums`}>{i + 1}</td>
                {PARADIGM.map((f) => f === 'inf'
                  ? <td key={f} className={`${cell} font-bold`}>{v.inf}</td>
                  : <td key={f} className={cell}>{v[f as 'pres'] ?? '–'}</td>)}
                <td className={`${cell} text-gray-600 italic`}>{v.en}</td>
                <td className={`${cell} text-gray-600 whitespace-nowrap`}>{groupLabel(v)}</td>
                {notes && <td className={`${cell} border-l border-l-gray-300`} />}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className="mt-3 text-xs italic">verblistor.pages.dev</p>
    </div>
  )
}
