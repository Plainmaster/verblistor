import { NavLink, Route, Routes, Link } from 'react-router-dom'
import { dueCards } from './lib/srs'
import About from './routes/About'
import Groups from './routes/Groups'
import Learn from './routes/Learn'
import Practice from './routes/Practice'
import Review from './routes/Review'
import Stats from './routes/Stats'
import Verbs from './routes/Verbs'
import { useStore } from './store'

const NAV = [
  { to: '/', label: 'Öva', title: 'Practice', icon: 'M5 12h14M12 5l7 7-7 7' },
  { to: '/groups', label: 'Grupper', title: 'Verb groups', icon: 'M4 6h16M4 12h10M4 18h6' },
  { to: '/verbs', label: 'Verb', title: 'All verbs', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5-5' },
  { to: '/review', label: 'Repetera', title: 'Review', icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4' },
  { to: '/stats', label: 'Framsteg', title: 'Progress', icon: 'M5 20V10M12 20V4M19 20v-7' },
]

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline text-ink" aria-label="Verblistor, home">
      <span className="flex -space-x-1" aria-hidden>
        {(['1', '2a', '2b', '3', '4'] as const).map((g) => (
          <span key={g} data-group={g} className="size-3.5 rounded-full ring-2 ring-paper" style={{ background: 'var(--g)' }} />
        ))}
      </span>
      <span className="text-xl font-extrabold tracking-tight">Verblistor</span>
    </Link>
  )
}

export default function App() {
  const { progress } = useStore()
  const due = dueCards(progress.cards, Date.now()).length

  const item = (n: (typeof NAV)[number], mobile: boolean) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.to === '/'}
      title={n.title}
      className={({ isActive }) => mobile
        ? `relative flex flex-col items-center gap-0.5 py-2 text-xs font-bold no-underline ${isActive ? 'text-ink' : 'text-muted'}`
        : `relative px-3 h-9 inline-flex items-center rounded-lg font-bold no-underline ${isActive ? 'bg-sunk text-ink' : 'text-muted hover:text-ink'}`}
    >
      {mobile && (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={n.icon} />
        </svg>
      )}
      {n.label}
      {n.to === '/review' && due > 0 && (
        <span className={`${mobile ? 'absolute top-1 right-[calc(50%-1.4rem)]' : 'ml-1.5'} min-w-5 h-5 px-1 rounded-full bg-ink text-paper text-[0.7rem] grid place-items-center tabular-nums`}>
          {due > 99 ? '99+' : due}
          <span className="sr-only"> due</span>
        </span>
      )}
    </NavLink>
  )

  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-surface px-3 py-2 rounded-lg z-50">Skip to content</a>
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule">
        <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between gap-4">
          <Wordmark />
          <nav aria-label="Main" className="hidden sm:flex gap-1">{NAV.map((n) => item(n, false))}</nav>
        </div>
      </header>

      <main id="main" className="flex-1 mx-auto w-full max-w-4xl px-4 pt-6 pb-28 sm:pb-16">
        <Routes>
          <Route path="/" element={<Practice />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/learn/family/:family" element={<Learn />} />
          <Route path="/learn/:group" element={<Learn />} />
          <Route path="/verbs" element={<Verbs />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<p>Page not found. <Link to="/">Go to practice</Link>.</p>} />
        </Routes>
      </main>

      <footer className="hidden sm:block border-t border-rule">
        <div className="mx-auto max-w-4xl px-4 py-5 text-sm text-muted flex justify-between gap-4">
          <span>Forms from SALDO, frequencies from the Kelly-list (Språkbanken).</span>
          <Link to="/about" className="text-muted underline underline-offset-2">About</Link>
        </div>
      </footer>

      <nav aria-label="Main" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-rule grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => item(n, true))}
      </nav>
    </div>
  )
}
