import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'INQUESTS', href: '/investigate', icon: 'terminal' },
  { label: 'RECORDS', href: '/results', icon: 'analytics' },
  { label: 'EVIDENCE', href: '/about', icon: 'history_edu' },
]

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-fc-surface">
      {/* TOP NAV */}
      <header className="bg-fc-black border-b-4 border-fc-white shadow-[4px_4px_0px_0px_rgba(234,234,0,1)] sticky top-0 z-50 h-20 flex items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-bungee text-3xl text-fc-yellow italic tracking-tighter">FAIRCORE</span>
          <span className="hidden md:block font-mono text-[10px] text-fc-outline uppercase tracking-widest border border-fc-outline px-2 py-1">v1.0</span>
        </Link>

        <nav className="hidden md:flex gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`font-headline font-black uppercase tracking-tighter text-sm transition-colors duration-75 ${
                location.pathname === item.href
                  ? 'text-fc-yellow border-b-4 border-fc-yellow pb-1'
                  : 'text-fc-white hover:text-fc-yellow'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/investigate" className="hidden md:block fc-btn-primary text-sm px-5 py-2 border-2 shadow-hard-sm">
            NEW_INVESTIGATION
          </Link>
          <button
            className="md:hidden text-fc-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="material-symbols-outlined text-3xl">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden bg-fc-black border-b-4 border-fc-white z-40 relative">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 p-4 font-headline font-black uppercase tracking-widest text-sm border-b border-fc-surface-high ${
                location.pathname === item.href ? 'text-fc-yellow bg-fc-surface-high' : 'text-fc-white'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* SIDEBAR — hidden on landing */}
        {!isLanding && (
          <aside className="hidden md:flex fixed left-0 top-20 h-[calc(100vh-5rem)] w-60 bg-fc-black border-r-4 border-fc-white flex-col z-40">
            <div className="p-5 border-b-2 border-fc-surface-higher">
              <h2 className="text-base font-headline font-black text-fc-white uppercase">INQUEST_SYSTEM</h2>
              <p className="text-[10px] text-fc-yellow font-mono font-bold tracking-[0.2em]">V1.0_STABLE</p>
            </div>

            <nav className="flex-grow py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 p-4 font-headline text-xs font-black uppercase tracking-widest transition-all duration-100 ${
                    location.pathname === item.href
                      ? 'bg-fc-yellow text-fc-black border-l-8 border-fc-white'
                      : 'text-fc-outline hover:bg-fc-surface-high hover:text-fc-white border-l-0'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t-2 border-fc-surface-higher">
              <Link
                to="/investigate"
                className="block w-full bg-fc-white text-fc-black font-headline font-black p-3 uppercase text-xs tracking-widest text-center hover:bg-fc-yellow transition-colors"
              >
                NEW_INVESTIGATION
              </Link>
              <div className="mt-4 flex items-center gap-2 p-2">
                <div className="w-2 h-2 bg-fc-yellow animate-pulse-slow" />
                <span className="text-[10px] font-mono text-fc-muted uppercase tracking-widest">SYSTEM_ONLINE</span>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className={`w-full ${!isLanding ? 'md:ml-60' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {!isLanding && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-fc-black border-t-4 border-fc-white flex justify-around items-center h-16 z-50">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                location.pathname === item.href ? 'text-fc-yellow' : 'text-fc-outline'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[8px] font-headline font-black uppercase">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
