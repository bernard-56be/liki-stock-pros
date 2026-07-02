'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { useMenu } from '@/app/dashboard/(shell)/DashboardClientLayout';

interface HeaderProps {
  userName: string;
  userAvatar: string | null;
  currentRate: number;
}

export function Header({ userName, userAvatar, currentRate }: HeaderProps) {
  const { toggleMenu } = useMenu();

  const isValidRate = typeof currentRate === 'number' && currentRate > 0;
  const formattedRate = isValidRate 
    ? new Intl.NumberFormat('fr-FR').format(currentRate) 
    : "---";

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Gauche : bouton menu (mobile) + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMenu}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xl font-bold text-indigo-600">Liki-Stock Pro</span>
        </div>

        {/* Zone centrale/droite : Actions utilisateur + Pastille Taux */}
        <div className="flex items-center gap-3">
          
          {/* Pastille visuelle dynamique */}
          <div className={`mr-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm shadow-sm transition-colors ${
            isValidRate 
              ? 'border-purple-100 bg-purple-50/60 text-purple-700' 
              : 'border-gray-100 bg-gray-50 text-gray-500'
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              {isValidRate && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isValidRate ? 'bg-purple-600' : 'bg-gray-400'}`}></span>
            </span>
            <div className="flex items-center gap-0.5">
              <span className="text-gray-500 font-normal">Taux :</span>
              <span className="font-bold text-purple-950">1 $</span>
              <span className="text-purple-400 font-normal">=</span>
              <span className={`font-bold ${isValidRate ? 'text-purple-950' : 'text-gray-400'}`}>
                {formattedRate} FC
              </span>
            </div>
          </div>

          <Link
            href="/notifications"
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/settings"
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 pl-2">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
            )}
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {userName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}