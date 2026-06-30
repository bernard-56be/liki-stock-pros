'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar, type DashboardRole } from '@/components/layout/Sidebar';

type MenuContextType = {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within DashboardClientLayout');
  return ctx;
};

export function DashboardClientLayout({
  children,
  role,
  userName,
  userAvatar,
  currentRate,
}: {
  children: ReactNode;
  role: DashboardRole;
  userName: string;
  userAvatar: string | null;
  currentRate: number;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Stabilisation des fonctions pour éviter les fermetures intempestives
  const toggleMenu = useCallback(() => setIsMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <MenuContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
      <div className="flex min-h-screen flex-col bg-gray-100 w-full">
        <Header userName={userName} userAvatar={userAvatar} currentRate={currentRate} />
        
        <div className="flex flex-1 flex-col md:flex-row">
          <Sidebar role={role} />
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
        </div>
      </div>
    </MenuContext.Provider>
  );
}

  