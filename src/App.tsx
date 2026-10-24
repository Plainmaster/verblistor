import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import About from './routes/About'
import Groups from './routes/Groups'
import Learn from './routes/Learn'
import Mistakes from './routes/Mistakes'
import Practice from './routes/Practice'
import Verbs from './routes/Verbs'
import { useStore } from './store'

const NAV = [
  { to: '/', label: 'Verb', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/ova', label: 'Öva', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' },
  { to: '/grupper', label: 'Grupper', icon: 'M5 6h.01M5 12h.01M5 18h.01M9 6h11M9 12h8M9 18h5' },
  { to: '/fel', label: 'Mina fel', icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4' },
]

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline text-ink" aria-label="Verblistor, startsida">
      <span className="flex -space-x-1" aria-hidden>
        {(['1', '2a', '2b', '3', '4'] as const).map((g) => (
          <span key={g} data-group={g} className="size-3.5 rounded-full ring-2 ring-[color:var(--paper)]" style={{ background: 'var(--g)' }} />
        ))}
      </span>
      <span className="display text-xl font-extrabold">Verblistor</span>
    </Link>
  )
}

export default function App() {
  const { progress } = useStore()
  const { pathname, search } = useLocation()
  const mistakes = Object.keys(progress.mistakes).length
  // Verb and Öva share the selection in the query string
  const keep = pathname === '/' || pathname === '/ova' ? search.replace(/([?&])verb=[^&]*&?/, '$1').replace(/[?&]$/, '') : ''

  const item = (n: (typeof NAV)[number], mobile: boolean) => (
    <NavLink
      key={n.to}
      to={n.to === '/' || n.to === '/ova' ? `${n.to}${keep}` : n.to}
      end={n.to === '/'}
      className={({ isActive }) => mobile
        ? `relative flex flex-col items-center gap-0.5 py-2 text-xs font-bold no-underline ${isActive ? 'text-ink' : 'text-muted'}`
        : `relative px-3.5 h-9 inline-flex items-center rounded-full font-bold no-underline ${isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
    >
      {mobile && (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={n.icon} />
        </svg>
      )}
      {n.label}
      {n.to === '/fel' && mistakes > 0 && (
        <span className={`${mobile ? 'absolute top-1 right-[calc(50%-1.6rem)]' : 'ml-1.5'} min-w-5 h-5 px-1 rounded-full bg-accent text-on-accent text-[0.7rem] grid place-items-center tabular-nums`}>
          {mistakes > 99 ? '99+' : mistakes}
        </span>
      )}
    </NavLink>
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-surface px-3 py-2 rounded-lg z-50">Hoppa till innehållet</a>
      <header className="sticky top-0 z-30 backdrop-blur bg-[color:color-mix(in_srgb,var(--paper)_85%,transparent)] print:hidden">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
          <Wordmark />
          <nav aria-label="Huvudmeny" className="hidden sm:flex gap-1">{NAV.map((n) => item(n, false))}</nav>
        </div>
      </header>

      <main id="main" className="flex-1 mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:pb-16 print:p-0 print:max-w-none">
        <Routes>
          <Route path="/" element={<Verbs />} />
          <Route path="/ova" element={<Practice />} />
          <Route path="/grupper" element={<Groups />} />
          <Route path="/grupper/monster/:family" element={<Learn />} />
          <Route path="/grupper/:group" element={<Learn />} />
          <Route path="/fel" element={<Mistakes />} />
          <Route path="/om" element={<About />} />
          <Route path="/verbs" element={<Navigate to="/" replace />} />
          <Route path="/groups" element={<Navigate to="/grupper" replace />} />
          <Route path="/review" element={<Navigate to="/fel" replace />} />
          <Route path="/stats" element={<Navigate to="/fel" replace />} />
          <Route path="*" element={<p>Sidan finns inte. <Link to="/">Till verblistan</Link>.</p>} />
        </Routes>
      </main>

      <footer className="hidden sm:block print:hidden">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted flex justify-between gap-4">
          <span>Former från SALDO, frekvens från Kelly-listan (Språkbanken).</span>
          <Link to="/om" className="text-muted underline underline-offset-2">Om Verblistor</Link>
        </div>
      </footer>

      <nav aria-label="Huvudmeny" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-rule grid grid-cols-4 pb-[env(safe-area-inset-bottom)] print:hidden">
        {NAV.map((n) => item(n, true))}
      </nav>
    </div>
  )
}
