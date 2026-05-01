'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type DashboardRole = 'owner' | 'employee';

type NavItem = { href: string; label: string };

const ownerNav: NavItem[] = [
  { href: '/dashboard/owner/inventaire', label: 'Inventaire' },
];

const employeeNav: NavItem[] = [
  { href: '/dashboard/employee/ventes', label: 'Ventes' },
];

function navForRole(role: DashboardRole): NavItem[] {
  return role === 'owner' ? ownerNav : employeeNav;
}

export function Sidebar({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navForRole(role);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div className="relative z-40 w-full shrink-0 md:z-auto md:w-56 md:border-r md:border-white/30 md:bg-white/20">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/30 bg-white/30 px-4 backdrop-blur-md md:hidden">
        <span className="text-sm font-bold text-gray-800">Liki-Stock Pro</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="dashboard-mobile-nav"
          className="rounded-lg p-2 text-gray-800 hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        id="dashboard-mobile-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-white/30 bg-white/45 p-4 backdrop-blur-md transition-transform duration-200 ease-out md:static md:z-0 md:h-[calc(100vh-0px)] md:min-h-screen md:w-56 md:translate-x-0 md:border-r-0 md:bg-transparent ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-6 hidden px-2 md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-800/80">Liki-Stock</p>
          <p className="text-lg font-bold text-gray-900">Pro</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-gray-800 hover:bg-white/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-4 border-t border-white/30 pt-3 text-xs text-gray-600">
          {role === 'owner' ? 'Espace propriétaire' : 'Espace employé'}
        </p>
      </aside>
    </div>
  );
}
