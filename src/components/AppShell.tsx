import { MapPinCheck, Settings, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { BrandMark } from './BrandMark';

const NAV_ITEMS = [
  { to: '/squad', label: 'Squad', icon: Users },
  { to: '/check-in', label: 'Check-in', icon: MapPinCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink to="/squad" className="flex min-h-11 items-center gap-2.5">
            <BrandMark size={28} />
            <div className="leading-tight">
              <span className="block text-base font-bold tracking-tight">VAGASPOT</span>
              <span className="hidden text-xs text-[var(--muted)] sm:block">
                Your people. Your campus. Your spot.
              </span>
            </div>
          </NavLink>

          <nav aria-label="Desktop navigation" className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-[var(--surface-2)] text-[var(--primary)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 pt-4 pb-24 md:px-6 md:pb-8">
        <Outlet />
      </main>

      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
      >
        <div className="mx-auto grid max-w-[1000px] grid-cols-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold ${
                  isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
