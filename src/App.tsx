import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import PrintSheet from './components/PrintSheet'
import SettingsButton, { ThemeButton } from './components/SettingsDialog'
import About from './routes/About'
import Groups from './routes/Groups'
import Mistakes from './routes/Mistakes'
import Verbs from './routes/Verbs'
import { isCareless } from './lib/diagnose'
import { describe, useSelection } from './lib/selection'
import { useStore } from './store'

const NAV = [
  { to: '/', label: 'Verb', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/grupper', label: 'Grupper', icon: 'M5 6h.01M5 12h.01M5 18h.01M9 6h11M9 12h8M9 18h5' },
  { to: '/fel', label: 'Mina fel', icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4' },
]

/** Old links to one group's page open that group on the group page. */
function OpenGroup() {
  const { group } = useParams()
  return <Navigate to={`/grupper?open=${group}`} replace />
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-baseline gap-2 no-underline text-ink" aria-label="Verblistor, startsida">
      <span className="display text-2xl font-bold">Svenska verblistor</span>
    </Link>
  )
}

/** The printer in the header: the verb list as it is now, plain or with a column for notes. */
function PrintMenu({ onPrint }: { onPrint: (notes: boolean) => void }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const pick = (notes: boolean) => {
    ref.current?.removeAttribute('open')
    onPrint(notes)
  }
  return (
    <details ref={ref} className="relative">
      <summary className="list-none [&::-webkit-details-marker]:hidden inline-grid place-items-center size-9 rounded-[2px] text-muted hover:text-ink hover:bg-sunk cursor-pointer"
        aria-label="Skriv ut" title="Skriv ut">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <path d="M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3" /><path d="M7 14h10v7H7z" />
        </svg>
      </summary>
      <div className="absolute right-0 top-11 z-40 w-60 panel shadow-lg py-1">
        <button type="button" className="block w-full text-left px-4 py-2 hover:bg-sunk" onClick={() => pick(false)}>
          Lista
          <span className="block text-sm italic text-muted">Verben som de visas nu</span>
        </button>
        <button type="button" className="block w-full text-left px-4 py-2 hover:bg-sunk" onClick={() => pick(true)}>
          Med anteckningar
          <span className="block text-sm italic text-muted">Liggande, med en tom kolumn</span>
        </button>
      </div>
    </details>
  )
}

export default function App() {
  const { progress } = useStore()
  const { pathname, search } = useLocation()
  const { filter, sort, verbs } = useSelection()
  const [notes, setNotes] = useState(false)
  const print = (n: boolean) => {
    flushSync(() => setNotes(n))
    window.print()
  }
  const mistakes = Object.values(progress.mistakes).filter((m) => !isCareless(m.type)).length
  const keep = pathname === '/' ? search.replace(/([?&])verb=[^&]*&?/, '$1').replace(/[?&]$/, '') : ''

  const item = (n: (typeof NAV)[number], mobile: boolean) => (
    <NavLink
      key={n.to}
      to={n.to === '/' ? `/${keep}` : n.to}
      end={n.to === '/'}
      className={({ isActive }) => mobile
        ? `relative flex flex-col items-center gap-0.5 py-2 text-xs font-semibold no-underline ${isActive ? 'text-ink' : 'text-muted'}`
        : `relative px-3 h-9 inline-flex items-center sc text-[1.2rem] no-underline underline-offset-[6px] decoration-[1.5px] ${isActive ? 'text-ink underline' : 'text-muted hover:text-ink'}`}
    >
      {mobile && (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={n.icon} />
        </svg>
      )}
      {n.label}
      {n.to === '/fel' && mistakes > 0 && (
        <span className={`${mobile ? 'absolute top-1 right-[calc(50%-1.6rem)]' : 'ml-1.5'} min-w-5 h-5 px-1 rounded-[2px] bg-accent text-on-accent text-[0.72rem] font-semibold grid place-items-center tabular-nums`}>
          {mistakes > 99 ? '99+' : mistakes}
        </span>
      )}
    </NavLink>
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-surface px-3 py-2 rounded-lg z-50">Hoppa till innehållet</a>
      <header className="sticky top-0 z-30 backdrop-blur bg-[color:color-mix(in_srgb,var(--paper)_90%,transparent)] border-b border-ink print:hidden">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <nav aria-label="Huvudmeny" className="hidden sm:flex gap-1">{NAV.map((n) => item(n, false))}</nav>
            {pathname === '/' && <PrintMenu onPrint={print} />}
            <ThemeButton />
            <SettingsButton />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 mx-auto w-full max-w-5xl px-4 pt-8 pb-28 sm:pb-16 print:p-0 print:max-w-none">
        <Routes>
          <Route path="/" element={<Verbs />} />
          <Route path="/ova" element={<Navigate to={`/${search}`} replace />} />
          <Route path="/grupper" element={<Groups />} />
          <Route path="/grupper/monster/:family" element={<Navigate to="/grupper?open=4" replace />} />
          <Route path="/grupper/:group" element={<OpenGroup />} />
          <Route path="/fel" element={<Mistakes />} />
          <Route path="/om" element={<About />} />
          <Route path="/verbs" element={<Navigate to="/" replace />} />
          <Route path="/groups" element={<Navigate to="/grupper" replace />} />
          <Route path="/review" element={<Navigate to="/fel" replace />} />
          <Route path="/stats" element={<Navigate to="/fel" replace />} />
          <Route path="*" element={<p>Sidan finns inte. <Link to="/">Till verblistan</Link>.</p>} />
        </Routes>
        {pathname === '/' && <PrintSheet verbs={verbs} sort={sort} kind={filter.kind} title={describe(filter)} notes={notes} />}
      </main>

      <footer className="hidden sm:block print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-5 border-t border-rule-strong text-sm italic text-muted flex justify-between gap-4">
          <span>Former från SALDO, frekvens från Kelly-listan (Språkbanken).</span>
          <Link to="/om" className="text-muted underline underline-offset-2">Om Verblistor</Link>
        </div>
      </footer>

      <nav aria-label="Huvudmeny" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-ink grid grid-cols-3 pb-[env(safe-area-inset-bottom)] print:hidden">
        {NAV.map((n) => item(n, true))}
      </nav>
    </div>
  )
}
