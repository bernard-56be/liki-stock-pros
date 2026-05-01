import type { ReactNode } from 'react';

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#e2e2e2] to-[#c9d6ff]">
      {children}
    </div>
  );
}
