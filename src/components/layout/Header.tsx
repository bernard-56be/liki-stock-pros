// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userAvatar: string | null;
}

export function Header({ userName, userAvatar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-xl font-bold text-indigo-600">Liki-Stock Pro</span>
        </div>

        {/* Actions utilisateur */}
        <div className="flex items-center gap-3">
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