'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useMenu } from '@/app/dashboard/(shell)/DashboardClientLayout';

export type DashboardRole = 'owner' | 'employee';

type NavItem = { href: string; label: string };

const ownerNav: NavItem[] = [
  { href: '/dashboard/owner/dashboard', label: 'Accueil' },
  { href: '/dashboard/owner/inventaire', label: 'Inventaire' },
  { href: '/dashboard/owner/validation', label: 'Validation' },
  { href: '/profile', label: 'Profile' }, 
];

const employeeNav: NavItem[] = [
  { href: '/dashboard/employee/ventes', label: 'Ventes' },
];

function navForRole(role: DashboardRole): NavItem[] {
  return role === 'owner' ? ownerNav : employeeNav;
}

export function Sidebar({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const { isMenuOpen, closeMenu } = useMenu();
  const items = navForRole(role);

  // Ferme le menu quand on change de route
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Overlay pour fermer le menu (mobile)
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      {/* Overlay mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar elle-même */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white/95 p-4 shadow-xl
          transition-transform duration-200 ease-out
          md:static md:z-auto md:w-56 md:translate-x-0 md:bg-white/40 md:backdrop-blur-sm md:shadow-none
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo / titre visible uniquement sur desktop */}
        <div className="mb-6 hidden px-2 md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-800/80">Liki-Stock</p>
          <p className="text-lg font-bold text-gray-900">Pro</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
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

        <p className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-600 md:border-white/30">
          {role === 'owner' ? 'Espace propriétaire' : 'Espace employé'}
        </p>
      </aside>
    </>
  );
}